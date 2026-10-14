// ===================================================================
// tracking-app.js — logika Vue untuk halaman tracking.html
// Data diambil dari js/dataBahanAjar.js (variabel DATA_BAHAN_AJAR)
// ===================================================================

// Helper: tanggal lokal format YYYY-MM-DD (untuk input type="date")
function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// Helper: timestamp lokal format "YYYY-MM-DD HH:MM:SS"
function nowStamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return todayISO() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function emptyDOForm() {
  return { nim: '', nama: '', ekspedisi: '', paket: '', tanggalKirim: todayISO() };
}

var app = new Vue({
  el: '#app',

  // ---------------- DATA ----------------
  data: {
    upbjjList: DATA_BAHAN_AJAR.upbjjList,
    ekspedisiList: ['JNE Regular', 'JNE Express'],
    paketList: DATA_BAHAN_AJAR.paket,
    stokList: DATA_BAHAN_AJAR.stok,

    // Ubah objek tracking { "DO..": {...} } menjadi array agar mudah di-render
    doList: Object.keys(DATA_BAHAN_AJAR.tracking).map(no =>
      Object.assign({ no }, JSON.parse(JSON.stringify(DATA_BAHAN_AJAR.tracking[no])))
    ),

    form: emptyDOForm(),
    formSubmitted: false,
    showForm: false,
    search: '',
    selectedNo: null,
    notif: '',
    notifTimer: null
  },

  // ---------------- COMPUTED ----------------
  computed: {
    tahunBerjalan() {
      return new Date().getFullYear();
    },

    // Format: DO + tahun berjalan + "-" + nomor urut (3 digit), mis. DO2026-001
    nextNo() {
      const prefix = 'DO' + this.tahunBerjalan + '-';
      const seq = this.doList
        .filter(d => d.no.startsWith(prefix))
        .map(d => parseInt(d.no.slice(prefix.length), 10))
        .filter(n => !isNaN(n));
      const next = (seq.length ? Math.max(...seq) : 0) + 1;
      return prefix + String(next).padStart(3, '0');
    },

    selectedPaket() {
      return this.paketList.find(p => p.kode === this.form.paket) || null;
    },

    // Mengubah daftar kode buku di paket menjadi judul dari data stok
    paketIsi() {
      if (!this.selectedPaket) return [];
      return this.selectedPaket.isi.map(kode => {
        const buku = this.stokList.find(s => s.kode === kode);
        return { kode, judul: buku ? buku.judul : 'Tidak ditemukan di stok' };
      });
    },

    totalHarga() {
      return this.selectedPaket ? this.selectedPaket.harga : 0;
    },

    formErrors() {
      const f = this.form;
      const e = {};
      if (!/^\d{8,12}$/.test(f.nim)) e.nim = 'NIM harus 8–12 digit angka';
      if (!/^[A-Za-z][A-Za-z .'-]{2,}$/.test(f.nama.trim())) e.nama = 'Nama minimal 3 huruf (tanpa angka)';
      if (!this.ekspedisiList.includes(f.ekspedisi)) e.ekspedisi = 'Pilih ekspedisi';
      if (!f.paket) e.paket = 'Pilih paket bahan ajar';
      if (!f.tanggalKirim) e.tanggalKirim = 'Isi tanggal kirim';
      return e;
    },

    filteredDO() {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.doList;
      return this.doList.filter(d =>
        d.no.toLowerCase().includes(q) ||
        d.nim.includes(q) ||
        d.nama.toLowerCase().includes(q)
      );
    },

    selectedDO() {
      return this.doList.find(d => d.no === this.selectedNo) || null;
    }
  },

  // ---------------- WATCHERS ----------------
  watch: {
    // Watcher 1: NIM hanya boleh berisi angka
    'form.nim'(val) {
      this.form.nim = String(val).replace(/\D/g, '');
    },

    // Watcher 2: memberi notifikasi saat paket dipilih
    'form.paket'(val) {
      const p = this.paketList.find(x => x.kode === val);
      if (p) {
        this.notif = 'Paket dipilih: ' + p.nama + ' (' + this.formatRupiah(p.harga) + ')';
      }
    },

    // Watcher 3: notifikasi hilang otomatis
    notif(val) {
      clearTimeout(this.notifTimer);
      if (val) {
        this.notifTimer = setTimeout(() => { this.notif = ''; }, 3000);
      }
    }
  },

  // ---------------- METHODS ----------------
  methods: {
    formatRupiah(n) {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    },

    paketNama(kode) {
      const p = this.paketList.find(x => x.kode === kode);
      return p ? p.nama : kode;
    },

    badgeStatus(status) {
      if (status === 'Diterima') return 'badge-hijau';
      if (status === 'Dalam Perjalanan') return 'badge-biru';
      return 'badge-oranye';
    },

    reversedPerjalanan(d) {
      return d.perjalanan.slice().reverse(); // terbaru di atas
    },

    pilihDO(no) {
      this.selectedNo = this.selectedNo === no ? null : no;
    },

    tambahDO() {
      this.formSubmitted = true;
      if (Object.keys(this.formErrors).length > 0) {
        this.notif = 'Periksa kembali isian formulir';
        return;
      }
      const no = this.nextNo; // ambil nomor sebelum data ditambahkan
      const f = this.form;
      this.doList.unshift({
        no,
        nim: f.nim,
        nama: f.nama.trim(),
        status: 'Menunggu Pickup',
        ekspedisi: f.ekspedisi,
        tanggalKirim: f.tanggalKirim,
        paket: f.paket,
        total: this.totalHarga,
        perjalanan: [
          { waktu: nowStamp(), keterangan: 'DO dibuat, menunggu pengiriman' }
        ]
      });
      this.selectedNo = no;
      this.notif = 'DO ' + no + ' berhasil dibuat';
      this.resetDOForm();
      this.showForm = false;
    },

    resetDOForm() {
      this.form = emptyDOForm();
      this.formSubmitted = false;
    }
  }
});
