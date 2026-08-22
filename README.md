# Gio-desu Dashboard

![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

Dashboard web untuk menjelajahi koleksi video — tampilan ala YouTube, dibangun
murni dengan **Node.js** dan vanilla JavaScript, **tanpa dependency npm sama sekali**.

Project ini terdiri dari dua bagian:

1. **Scraper** (`scraper.js`) — mengumpulkan data video (judul, thumbnail,
   durasi, dll.) dari sebuah situs web ke dalam satu file JSON
2. **Dashboard** (`public/` + `server.js`) — antarmuka web untuk browse,
   cari, dan menonton video dari data yang sudah dikumpulkan

---

## Fitur

### Beranda (ala YouTube home)

- Grid card responsif: thumbnail 16:9 + badge durasi + play overlay saat hover
- Search instan berdasarkan judul
- Sort: terbaru / terlama / durasi terpanjang / terpopuler / judul A-Z
- Filter tag chips
- Pagination "muat lebih banyak"
- Stats bar: total video, total durasi kumulatif, waktu scrape terakhir
- Skeleton loading animation

### Halaman Nonton (ala YouTube watch)

- Player besar ter-embed di atas
- Judul, metadata (durasi, views, tanggal), dan tag
- **Rekomendasi video** di sisi kanan — klik langsung pindah video
- URL tiap video bisa dibagikan (`watch.html?url=...`)
- Tombol kembali ke beranda & buka sumber

### Server

- Static server bawaan, zero-dependency (`node:http`)
- **Port auto-increment**: kalau port sedang dipakai, otomatis pindah ke
  port berikutnya sampai ketemu yang kosong

---

## Cara Menjalankan

> Butuh **Node.js >= 18** (memakai `fetch` bawaan).

```bash
# 1. siapkan scraper
cp scraper.example.js scraper.js   # lalu isi logika parsing untuk situs targetmu

# 2. kumpulkan data
npm run scrape

# 3. jalankan dashboard
npm run serve
```

Buka URL yang muncul di terminal (mulai dari `http://localhost:3000`;
kalau port dipakai, otomatis pindah ke `3001`, dst).

Opsi port:

```bash
npm run serve -- --port=8080   # mulai dari port tertentu
PORT=8080 npm run serve        # lewat environment variable
```

---

## Struktur Folder

```
├── public/
│   ├── index.html       # halaman beranda (grid card)
│   ├── watch.html       # halaman nonton + rekomendasi
│   ├── app.js           # logic beranda (search/sort/filter/pagination)
│   ├── watch.js         # logic halaman nonton
│   └── style.css        # styling dark theme, responsive
├── server.js            # static server + port auto-increment
├── scraper.example.js   # template scraper (salin jadi scraper.js)
├── scraper.js           # scraper kamu sendiri (tidak ikut di-commit)
├── igo_data.json        # hasil scraping (tidak ikut di-commit)
└── package.json
```

---

## Struktur Data

Scraper menyimpan hasilnya ke `igo_data.json`:

```jsonc
{
  "posts": [
    {
      "title": "Judul video",
      "url": "https://situs-target.com/slug/",
      "thumbnail": "https://.../thumbnail.jpg",
      "duration": "02.53",
      "views": "1234",
      "player_url": "https://...",
      "download_url": null,
      "tags": [],
      "scraped_at": "2026-08-21T11:26:23.610Z"
    }
  ]
}
```

Field `title`, `url`, `thumbnail`, dan `player_url` dipakai dashboard;
field lain opsional (elemen UI-nya otomatis sembunyi kalau kosong).

---

## Menulis Scraper Sendiri

Salin `scraper.example.js` menjadi `scraper.js`. Template sudah menyediakan:

- Class dengan pola load/save database JSON + deteksi duplikat
- Helper `fetchHtml()` dengan User-Agent browser
- Delay antar request agar tidak membebani server
- CLI entry point

Yang perlu kamu isi: fungsi `getListItems()` (parsing halaman list) dan
`getDetail()` (parsing detail item) sesuai struktur situs target kamu.

---

## Roadmap

- [ ] Multi-site support (profil scraper per situs)
- [ ] Export ke SQLite/MySQL
- [ ] Scheduler scrape otomatis
- [ ] Tema light/dark toggle
- [ ] API server sendiri untuk trigger scrape dari web

---

## Disclaimer

Project ini dibuat **untuk tujuan edukasi** seputar web scraping dan
pengembangan web. Gunakan dengan bijak:

- Patuhi Terms of Service situs target dan hukum setempat
- Hormati `robots.txt` dan batasi frekuensi request
- Kamu bertanggung jawab penuh atas penggunaanmu sendiri

## License

MIT
