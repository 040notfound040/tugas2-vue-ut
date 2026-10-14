# Tugas Praktik 2 — Aplikasi Pemesanan Bahan Ajar UT (Vue.js)
LAPORAN TUGAS 1 TUTORIAL ONLINE MATA KULIAH PEMROGRAMAN BERBASIS WEB STSI4209<Br>
DISUSUN OLEH<Br>
NAMA	: FADLILLAH<Br>
NIM	: 051908447<Br>
## Struktur Proyek
```
tugas2-vue-ut/
├─ index.html          ← Menu navigasi ke stok.html dan tracking.html
├─ stok.html           ← Halaman 1: Stok Bahan Ajar
├─ tracking.html       ← Halaman 2: Tracking DO
├─ css/
│  └─ style.css        ← Styling ringan
└─ js/
   ├─ dataBahanAjar.js ← Dummy data (variabel DATA_BAHAN_AJAR)
   ├─ stok-app.js      ← Logika Vue untuk stok.html
   └─ tracking-app.js  ← Logika Vue untuk tracking.html
```

## Cara Menjalankan
Tidak perlu instalasi. Vue 2 dimuat dari CDN.
1. Buka `index.html` langsung di browser, atau
2. Gunakan ekstensi VS Code **Live Server** (disarankan).

## Ringkasan Fitur
**Stok Bahan Ajar (`stok.html`)**
- Tabel stok lengkap dengan kolom sesuai spesifikasi.
- Filter UT-Daerah; filter Kategori MK muncul hanya setelah UT-Daerah dipilih (dependent option).
- Filter "perlu re-order" (qty < safety atau qty = 0).
- Sort berdasarkan judul, stok, atau harga (naik/turun), dan tombol Reset Filter.
- Edit inline stok, lokasi rak, safety, harga, dan catatan dengan validasi.
- Status: Aman (hijau, ✅), Menipis (oranye, ⚠️), Kosong (merah, ⛔).
- Formulir tambah bahan ajar dengan validasi setiap field.

**Tracking DO (`tracking.html`)**
- Nomor DO otomatis: `DO{tahun}-{nomor urut 3 digit}`.
- Formulir DO: NIM, nama, ekspedisi, paket (select + detail isi paket), tanggal kirim, dan total harga otomatis.
- Pencarian DO, serta riwayat perjalanan pengiriman per DO.

## Penerapan Konsep Vue.js
| Konsep | Lokasi |
|---|---|
| Mustache, `v-text`, `v-html` | Seluruh tabel dan detail |
| `v-bind` (`:value`, `:class`, `:key`, `:disabled`) | Form, badge status, baris tabel |
| `v-model` (text, number, checkbox, select, date) | Filter, form, edit inline |
| `v-if`, `v-else-if`, `v-else`, `v-show` | Status stok, edit inline, form toggle, detail paket |
| `v-for` | Tabel, options select, timeline |
| Computed | `filteredStok`, `reorderCount`, `formErrors`, `nextNo`, `paketIsi`, dll. |
| Methods | `perluReorder`, `formatRupiah`, `tambahData`, `saveEdit`, dll. |
| Watchers | Reset kategori saat UT-Daerah berubah, uppercase kode, sanitasi NIM, notifikasi paket, auto-hide notifikasi |

## Catatan
- Data bersifat sementara (in-memory). Refresh halaman akan mengembalikan data ke kondisi awal dummy.
- Opsi ekspedisi mengikuti deskripsi tugas: JNE Regular dan JNE Express.
