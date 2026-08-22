const DATA_URL = '/igo_data.json';
const PAGE_SIZE = 12;

let allPosts = [];
let activeTag = null;
let shownCount = PAGE_SIZE;

async function loadData() {
    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error('Data not found');
        const json = await res.json();
        allPosts = json.posts || [];
        renderChips();
        render();
    } catch (err) {
        document.getElementById('skeleton-grid').classList.add('hidden');
        document.getElementById('empty-state').classList.remove('hidden');
        console.error('Gagal memuat data:', err);
    }
}

function getTags() {
    const counts = new Map();
    for (const p of allPosts) {
        for (const t of p.tags || []) {
            counts.set(t, (counts.get(t) || 0) + 1);
        }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function renderChips() {
    const wrap = document.getElementById('tag-chips');
    const tags = getTags();
    if (!tags.length) return;
    wrap.innerHTML = tags
        .map(([t]) => `<button class="chip" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`)
        .join('');
    wrap.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', () => {
            if (activeTag === btn.dataset.tag) {
                activeTag = null;
                btn.classList.remove('active');
            } else {
                activeTag = btn.dataset.tag;
                wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
            }
            resetAndRender();
        });
    });
}

function parseDuration(d) {
    if (!d) return 0;
    const parts = d.split('.').map(Number);
    return parts.length === 2 ? parts[0] * 60 + parts[1] : (parts[0] || 0);
}

function formatTotalDuration(seconds) {
    if (!seconds) return '0 menit';
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return h ? `${h} jam ${m} menit` : `${m} menit`;
}

function getFiltered() {
    const query = document.getElementById('search').value.toLowerCase();
    const sort = document.getElementById('sort').value;

    let posts = allPosts.filter(p => {
        const matchQuery = p.title.toLowerCase().includes(query);
        const matchTag = !activeTag || (p.tags || []).includes(activeTag);
        return matchQuery && matchTag;
    });

    switch (sort) {
        case 'oldest':
            posts.sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at));
            break;
        case 'duration':
            posts.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
            break;
        case 'views':
            posts.sort((a, b) => parseInt(b.views) - parseInt(a.views));
            break;
        case 'title':
            posts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        default:
            posts.sort((a, b) => new Date(b.scraped_at) - new Date(a.scraped_at));
    }

    return posts;
}

function renderStats(list) {
    const totalDuration = list.reduce((sum, p) => sum + parseDuration(p.duration), 0);
    const lastScrape = allPosts.reduce((latest, p) =>
        p.scraped_at > latest ? p.scraped_at : latest, '');
    document.getElementById('stats').textContent =
        `Menampilkan ${Math.min(shownCount, list.length)} dari ${list.length} video` +
        ` • Total durasi: ${formatTotalDuration(totalDuration)}` +
        (lastScrape ? ` • Scrape terakhir: ${new Date(lastScrape).toLocaleString('id-ID')}` : '');
}

function cardTemplate(p) {
    const watchUrl = `/watch.html?url=${encodeURIComponent(p.url || '')}`;
    return `
        <a class="card" href="${escapeAttr(watchUrl)}">
            <div class="thumb-wrap">
                <img src="${p.thumbnail || ''}" alt="${escapeAttr(p.title)}" loading="lazy"
                     onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22><rect fill=%22%23222%22 width=%22100%25%22 height=%22100%25%22/></svg>'">
                <span class="play-overlay">▶</span>
                ${p.duration ? `<span class="duration-badge">${escapeHtml(p.duration)}</span>` : ''}
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(p.title)}</div>
                <div class="card-meta">
                    <span>${p.views || '0'} views</span>
                    ${p.scraped_at ? `<span>${new Date(p.scraped_at).toLocaleDateString('id-ID')}</span>` : ''}
                </div>
            </div>
        </a>`;
}

function render() {
    document.getElementById('skeleton-grid').classList.add('hidden');
    const grid = document.getElementById('grid');
    const emptyState = document.getElementById('empty-state');
    const loadMoreBtn = document.getElementById('load-more');

    grid.classList.remove('hidden');

    const posts = getFiltered();

    if (!allPosts.length) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    renderStats(posts);

    const visible = posts.slice(0, shownCount);
    grid.innerHTML = visible.map(cardTemplate).join('');

    loadMoreBtn.classList.toggle('hidden', shownCount >= posts.length);
}

function resetAndRender() {
    shownCount = PAGE_SIZE;
    render();
}

document.getElementById('search').addEventListener('input', resetAndRender);
document.getElementById('sort').addEventListener('change', resetAndRender);
document.getElementById('load-more').addEventListener('click', () => {
    shownCount += PAGE_SIZE;
    render();
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return escapeHtml(String(str)).replace(/"/g, '&quot;');
}

loadData();
