// ===================================================================
// stok-app.js — logika Vue untuk halaman stok.html
// Data diambil dari js/dataBahanAjar.js (variabel DATA_BAHAN_AJAR)
// ===================================================================

// Helper: buat form kosong (dipakai saat init, reset, dan setelah simpan)
function emptyForm() {
  return {
    kode: '', judul: '', kategori: '', upbjj: '', lokasiRak: '',
    harga: null, qty: 0, safety: 0, catatan: ''
  };
}

// Helper: stok/safety wajib bilangan bulat >= 0
function isBilanganValid(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

// Helper: lindungi teks dari injeksi HTML saat ditampilkan dengan v-html
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helper: buang tag HTML agar catatan bisa diedit sebagai teks biasa
function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, '');
}

var app = new Vue({
  el: '#app',

  // ---------------- DATA ----------------
  data: {
    upbjjList: DATA_BAHAN_AJAR.upbjjList,
    kategoriList: DATA_BAHAN_AJAR.kategoriList,
    // Salinan data agar perubahan tidak menyentuh sumber dummy
    stok: JSON.parse(JSON.stringify(DATA_BAHAN_AJAR.stok)),

    filter: { upbjj: 'all', kategori: 'all', hanyaReorder: false },
    sort: { by: 'judul', order: 'asc' },

    showForm: false,
    formSubmitted: false,
    form: emptyForm(),

    editingKode: null,
    editForm: {},

    notif: '',
    notifTimer: null
  },

  // ---------------- COMPUTED (di-cache Vue, tidak dihitung ulang tanpa perubahan dependensi) ----------------
  computed: {
    reorderCount() {
      return this.stok.filter(item => this.perluReorder(item)).length;
    },

    // Filter + sort digabung dalam satu computed, sehingga
    // perubahan filter/sort tidak memicu perhitungan ulang di template.
    filteredStok() {
      const f = this.filter;
      const dir = this.sort.order === 'asc' ? 1 : -1;
      const key = this.sort.by;

      return this.stok
        .filter(item =>
          (f.upbjj === 'all' || item.upbjj === f.upbjj) &&
          (f.kategori === 'all' || item.kategori === f.kategori) &&
          (!f.hanyaReorder || this.perluReorder(item))
        )
        .sort((a, b) => key === 'judul'
          ? a.judul.localeCompare(b.judul, 'id') * dir
          : (a[key] - b[key]) * dir
        );
    },

    formErrors() {
      const f = this.form;
      const e = {};
      if (!/^[A-Z]{4}\d{4}$/.test(f.kode)) {
        e.kode = 'Format kode: 4 huruf + 4 angka (contoh: EKMA4117)';
      } else if (this.stok.some(s => s.kode === f.kode)) {
        e.kode = 'Kode sudah terdaftar';
      }
      if (f.judul.trim().length < 3) e.judul = 'Judul minimal 3 karakter';
      if (!f.kategori) e.kategori = 'Pilih kategori';
      if (!f.upbjj) e.upbjj = 'Pilih UT-Daerah';
      if (!/^R\d-[A-Z]\d$/.test(f.lokasiRak)) e.lokasiRak = 'Format lokasi rak: R1-A3';
      if (!(f.harga > 0)) e.harga = 'Harga harus lebih dari 0';
      if (!isBilanganValid(f.qty)) e.qty = 'Stok harus bilangan bulat >= 0';
      if (!isBilanganValid(f.safety)) e.safety = 'Safety stock harus bilangan bulat >= 0';
      return e;
    },

    editErrors() {
      const f = this.editForm;
      const e = {};
      if (!isBilanganValid(f.qty)) e.qty = 'Stok harus bilangan bulat >= 0';
      if (!isBilanganValid(f.safety)) e.safety = 'Safety stock harus bilangan bulat >= 0';
      if (!(f.harga > 0)) e.harga = 'Harga harus lebih dari 0';
      if (!/^R\d-[A-Z]\d$/.test(f.lokasiRak || '')) e.lokasiRak = 'Format lokasi rak: R1-A3';
      return e;
    },

    editErrorMsg() {
      const keys = Object.keys(this.editErrors);
      return keys.length ? this.editErrors[keys[0]] : '';
    }
  },

  // ---------------- WATCHERS ----------------
  watch: {
    // Watcher 1: dependent filter — saat UT-Daerah berubah, reset Kategori
    'filter.upbjj'() {
      this.filter.kategori = 'all';
    },

    // Watcher 2: kode MK otomatis huruf kapital
    'form.kode'(val) {
      this.form.kode = String(val).toUpperCase().trim();
    },

    // Watcher 3: notifikasi hilang otomatis setelah 3 detik
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

    // Re-order jika stok kosong atau di bawah safety stock
    perluReorder(item) {
      return item.qty === 0 || item.qty < item.safety;
    },

    resetFilter() {
      this.filter = { upbjj: 'all', kategori: 'all', hanyaReorder: false };
      this.sort = { by: 'judul', order: 'asc' };
    },

    // ----- Edit inline -----
    isEditing(item) {
      return this.editingKode === item.kode;
    },

    startEdit(item) {
      this.editingKode = item.kode;
      this.editForm = {
        qty: item.qty,
        safety: item.safety,
        lokasiRak: item.lokasiRak,
        harga: item.harga,
        catatan: stripTags(item.catatanHTML)
      };
    },

    cancelEdit() {
      this.editingKode = null;
      this.editForm = {};
    },

    saveEdit(item) {
      if (this.editErrorMsg) {
        this.notif = this.editErrorMsg;
        return;
      }
      Object.assign(item, {
        qty: this.editForm.qty,
        safety: this.editForm.safety,
        lokasiRak: this.editForm.lokasiRak,
        harga: this.editForm.harga,
        catatanHTML: escapeHtml(this.editForm.catatan)
      });
      this.notif = 'Data ' + item.kode + ' berhasil diperbarui';
      this.cancelEdit();
    },

    // ----- Tambah data -----
    tambahData() {
      this.formSubmitted = true;
      if (Object.keys(this.formErrors).length > 0) {
        this.notif = 'Periksa kembali isian formulir';
        return;
      }
      const f = this.form;
      this.stok.push({
        kode: f.kode,
        judul: f.judul.trim(),
        kategori: f.kategori,
        upbjj: f.upbjj,
        lokasiRak: f.lokasiRak,
        harga: Number(f.harga),
        qty: f.qty,
        safety: f.safety,
        catatanHTML: escapeHtml(f.catatan.trim())
      });
      this.notif = 'Bahan ajar ' + f.kode + ' berhasil ditambahkan';
      this.resetForm();
      this.showForm = false;
    },

    resetForm() {
      this.form = emptyForm();
      this.formSubmitted = false;
    }
  }
});
