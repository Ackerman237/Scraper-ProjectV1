const DATA_URL = '/igo_data.json';

async function loadData() {
    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error('Data not found');
        const json = await res.json();
        return json.posts || [];
    } catch (err) {
        showError('Gagal memuat data. Jalankan <code>npm run scrape</code> terlebih dahulu.');
        console.error('Gagal memuat data:', err);
        return null;
    }
}

function getVideoUrl() {
    return decodeURIComponent(new URLSearchParams(location.search).get('url') || '');
}

function render(post, allPosts) {
    const content = document.getElementById('watch-content');

    const playerHtml = post.player_url ? `
        <div class="player-wrap">
            <iframe src="${escapeAttr(post.player_url)}"
                    allowfullscreen allow="autoplay; fullscreen"></iframe>
        </div>` : `
        <div class="player-wrap player-empty">Player tidak tersedia untuk video ini</div>`;

    const tags = post.tags && post.tags.length
        ? `<div class="tag-list">${post.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
        : '';

    const related = allPosts
        .filter(p => p.url !== post.url)
        .slice(0, 12)
        .map(p => `
            <a class="related-card" href="/watch.html?url=${encodeURIComponent(p.url)}">
                <div class="thumb-wrap">
                    <img src="${p.thumbnail || ''}" alt="${escapeAttr(p.title)}" loading="lazy"
                         onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22168%22 height=%2294%22><rect fill=%22%23222%22 width=%22100%25%22 height=%22100%25%22/></svg>'">
                    ${p.duration ? `<span class="duration-badge">${escapeHtml(p.duration)}</span>` : ''}
                </div>
                <div class="related-info">
                    <div class="related-title">${escapeHtml(p.title)}</div>
                    <div class="card-meta"><span>${p.views || 0} views</span></div>
                </div>
            </a>
        `).join('');

    content.innerHTML = `
        <section class="player-section">
            ${playerHtml}
            <h2 class="watch-title">${escapeHtml(post.title)}</h2>
            <div class="meta-row">
                ${post.duration ? `<span>⏱ ${escapeHtml(post.duration)}</span>` : ''}
                <span>👁 ${post.views || 0} views</span>
                ${post.scraped_at ? `<span>🗓 ${new Date(post.scraped_at).toLocaleDateString('id-ID')}</span>` : ''}
            </div>
            ${tags}
            <div class="action-row">
                ${post.url ? `<a class="btn btn-primary" href="${escapeAttr(post.url)}" target="_blank" rel="noopener">Buka Sumber</a>` : ''}
                ${post.download_url ? `<a class="btn btn-secondary" href="${escapeAttr(post.download_url)}" target="_blank" rel="noopener">⬇ Download</a>` : ''}
            </div>
        </section>
        <aside class="related-panel">
            <div class="related-heading">Rekomendasi</div>
            ${related}
        </aside>
    `;

    document.title = `${post.title} - Gio-desu`;
}

function showError(messageHtml) {
    document.getElementById('skeleton-watch').classList.add('hidden');
    document.getElementById('watch-content').classList.add('hidden');
    const box = document.getElementById('error-box');
    box.innerHTML = `<p>${messageHtml}</p><a class="btn btn-secondary" href="/">← Kembali ke Beranda</a>`;
    box.classList.remove('hidden');
}

async function init() {
    const allPosts = await loadData();
    if (!allPosts) return;

    const url = getVideoUrl();
    const post = allPosts.find(p => p.url === url);

    document.getElementById('skeleton-watch').classList.add('hidden');

    if (!post) {
        showError(
            url
                ? 'Video tidak ditemukan di database.'
                : 'Parameter video tidak ada. Buka video dari halaman beranda.'
        );
        return;
    }

    document.getElementById('watch-content').classList.remove('hidden');
    render(post, allPosts);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return escapeHtml(String(str)).replace(/"/g, '&quot;');
}

init();
