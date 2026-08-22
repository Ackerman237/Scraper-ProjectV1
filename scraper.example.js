// ============================================================
// Scraper Template
// ------------------------------------------------------------
// Salin file ini menjadi `scraper.js` lalu isi logika parsing
// untuk situs target kamu sendiri.
//
// Output contract yang diharapkan dashboard (public/):
//   igo_data.json -> { "posts": [ { ...item, scraped_at } ] }
//
// Field item yang dipakai dashboard:
//   title, url, thumbnail, duration, views,
//   player_url, download_url, tags[]
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CONFIG = {
    targetUrl: 'https://example.com',
    maxPages: 1,
    requestDelayMs: 1000
};

class Scraper {
    constructor() {
        this.dbPath = path.join(__dirname, 'igo_data.json');
        this.data = this.loadDb();
    }

    loadDb() {
        if (fs.existsSync(this.dbPath)) {
            return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        }
        return { posts: [] };
    }

    saveDb() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    }

    async fetchHtml(url) {
        const response = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    }

    // TODO: implementasikan parsing daftar item dari halaman list/index.
    // Kembalikan array berisi minimal { title, url, thumbnail }.
    async getListItems(page = 1) {
        const html = await this.fetchHtml(`${CONFIG.targetUrl}/page/${page}`);
        void html;
        throw new Error('getListItems() belum diimplementasikan - isi parsing di sini');
    }

    // TODO: implementasikan parsing detail per item.
    // Kembalikan object dengan field yang dipakai dashboard:
    //   player_url, duration, views, tags, download_url, dll.
    async getDetail(url) {
        const html = await this.fetchHtml(url);
        void html;
        throw new Error('getDetail() belum diimplementasikan - isi parsing di sini');
    }

    async run(maxPages = CONFIG.maxPages) {
        for (let i = 1; i <= maxPages; i++) {
            console.log(`Scraping page ${i}...`);
            let items;
            try {
                items = await this.getListItems(i);
            } catch (err) {
                console.error(`Page ${i} gagal: ${err.message}`);
                continue;
            }

            for (const item of items) {
                if (this.data.posts.some(p => p.url === item.url)) continue;

                console.log(`Processing: ${item.title}`);
                try {
                    const detail = await this.getDetail(item.url);
                    this.data.posts.push({
                        ...item,
                        ...detail,
                        scraped_at: new Date().toISOString()
                    });
                    this.saveDb();
                } catch (err) {
                    console.error(`  Gagal: ${err.message}`);
                }

                await new Promise(r => setTimeout(r, CONFIG.requestDelayMs));
            }
        }
        console.log('Selesai. Data tersimpan di igo_data.json');
    }
}

const scraper = new Scraper();
scraper.run();
