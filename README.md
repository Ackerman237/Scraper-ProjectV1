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

## 🔍 Logika yang Perlu Kamu Implementasikan Sendiri

Repo ini sengaja **tidak menyertakan logika parsing untuk situs tertentu**.
Bagian itulah yang kamu tulis sendiri. Berikut ringkasannya.

### 1. Apa saja yang harus diisi

| Fungsi | Tugas | Output wajib |
|---|---|---|
| `getListItems(page)` | Parsing daftar video dari halaman list/index | Array `{ title, url, thumbnail }` |
| `getDetail(url)` | Parsing satu halaman detail video | `{ player_url, duration, views, tags, download_url }` |

Field `title`, `url`, `thumbnail`, dan `player_url` adalah minimum agar
dashboard berfungsi penuh — field lain opsional (UI-nya otomatis
menyembunyikan bagian yang kosong).

### 2. Contoh pola implementasi

> ⚠️ Contoh di bawah memakai **HTML fiktif** hanya sebagai ilustrasi
> pola — struktur asli setiap situs pasti berbeda.

```js
async getListItems(page = 1) {
    const html = await this.fetchHtml(`${CONFIG.targetUrl}/page/${page}`);

    // contoh: kartu video berulang dengan pola <div class="video-card">
    const chunks = html.split('<div class="video-card">').slice(1);
    const items = [];

    for (const chunk of chunks) {
        const title     = chunk.match(/<h2 class="title">([^<]+)<\/h2>/)?.[1];
        const url       = chunk.match(/<a[^>]+href="([^"]+)"/)?.[1];
        const thumbnail = chunk.match(/<img[^>]+src="([^"]+)"/)?.[1];

        if (title && url && thumbnail) {
            items.push({ title, url, thumbnail });
        }
    }
    return items;
}

async getDetail(url) {
    const html = await this.fetchHtml(url);

    return {
        player_url:   html.match(/<iframe[^>]+src="([^"]+)"[^>]*player/)?.[1] ?? null,
        duration:     html.match(/class="duration">([^<]+)</)?.[1] ?? null,
        views:        html.match(/class="views">([\d.,]+)/)?.[1] ?? '0',
        tags:         [...html.matchAll(/class="tag">([^<]+)</g)].map(m => m[1]),
        download_url: html.match(/class="download"[^>]+href="([^"]+)"/)?.[1] ?? null
    };
}
```

### 3. Cara menemukan struktur situs target

1. **Buka situs target di browser**, klik kanan → *View Page Source*
   atau buka DevTools (`F12`) → tab *Elements*.
2. Cari blok HTML yang **berulang** di halaman list — biasanya itu
   kartu/list item. Catat class/nama elemen pembungkusnya.
3. Untuk `player_url`: buka halaman detail, lalu di DevTools → tab
   *Network* → filter media/iframe sambil memutar video. Sumber pemutar
   biasanya terlihat sebagai request eksternal atau atribut `src`
   sebuah `<iframe>` / `<video>`.
4. Klik kanan elemen → *Copy → Copy selector* sebagai titik awal
   penulisan pattern.
5. Tulis regex/parser-mu, uji dulu dengan `console.log()` sebelum
   menyimpan ke database.

### 4. Tips

- Mulai dari **satu item** sampai berhasil, baru loop ke banyak
- Setelah scrape, cek `igo_data.json` untuk memastikan format sesuai
- Selalu kasih delay antar request (template sudah menyediakan)
- Struktur HTML bisa berubah sewaktu-waktu — parser kadang perlu
  disesuaikan ulang

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
