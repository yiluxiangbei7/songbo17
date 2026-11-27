/**
 * 文件名: songbo_list.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 列表页逻辑——话题 tab 筛选（点击切换高亮并重新过滤）、
 *           关键词实时过滤（input 事件）、客户端分页（每页 4 条，上一页/下一页/页码）。
 *           支持 URL 传参 ?topic=话题名。
 */

const SONGBO_PAGE_SIZE = 4;              // 每页条数
let songbo_all = [];                     // 当前筛选后的全量数据
let songbo_page_no = 1;                  // 当前页码
let songbo_cate = "";                    // 当前话题（空 = 全部）

/* ---------- 1. 话题筛选条（tab 选项卡，JS效果②） ---------- */
async function songbo_load_tabs() {
    const songbo_bar = document.getElementById("songbo_topics_bar");
    const songbo_topics = await songbo_rest_get("topics", "select=id,name,followers&order=sort.asc");
    // 支持 URL 传参：list.html?topic=人工智能
    const songbo_url_cate = new URLSearchParams(location.search).get("topic") || "";
    if (songbo_url_cate) songbo_cate = songbo_url_cate;

    songbo_bar.innerHTML =
        `<span class="songbo_topic_chip ${songbo_cate === "" ? "songbo_active" : ""}" data-name="">全部</span>` +
        songbo_topics.map(t =>
            `<span class="songbo_topic_chip ${t.name === songbo_cate ? "songbo_active" : ""}" data-name="${t.name}">${t.name} · ${t.followers}万</span>`
        ).join("");

    songbo_bar.querySelectorAll(".songbo_topic_chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".songbo_topic_chip").forEach(c => c.classList.remove("songbo_active"));
            chip.classList.add("songbo_active");
            songbo_cate = chip.dataset.name;
            songbo_page_no = 1;
            songbo_apply_filter();
        });
    });
}

/* ---------- 2. 拉取新闻全量（一次性取回，前端过滤+分页） ---------- */
async function songbo_load_data() {
    const songbo_box = document.getElementById("songbo_news_list");
    songbo_box.innerHTML = '<div class="songbo_status">正在加载新闻列表…</div>';
    songbo_all = await songbo_rest_get("news",
        "select=id,title,summary,category,author,cover_image,views,published_at&order=published_at.desc");
    songbo_apply_filter();
}

/* ---------- 3. 关键词过滤（input 实时触发，JS效果③） ---------- */
function songbo_apply_filter() {
    const songbo_kw = document.getElementById("songbo_kw").value.trim().toLowerCase();
    songbo_all.forEach(n => {
        n._hit = (!songbo_cate || n.category === songbo_cate) &&
                 (!songbo_kw || (n.title + n.summary).toLowerCase().includes(songbo_kw));
    });
    songbo_render_page();
}

/* ---------- 4. 分页渲染（JS效果④） ---------- */
function songbo_render_page() {
    const songbo_box = document.getElementById("songbo_news_list");
    const songbo_hits = songbo_all.filter(n => n._hit);
    const songbo_pages = Math.max(1, Math.ceil(songbo_hits.length / SONGBO_PAGE_SIZE));
    if (songbo_page_no > songbo_pages) songbo_page_no = songbo_pages;

    const songbo_slice = songbo_hits.slice((songbo_page_no - 1) * SONGBO_PAGE_SIZE, songbo_page_no * SONGBO_PAGE_SIZE);

    if (songbo_slice.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">没有匹配的新闻，换个关键词试试～</div>';
    } else {
        songbo_box.innerHTML = "";
        songbo_slice.forEach(n => {
            const songbo_card = document.createElement("article");
            songbo_card.className = "songbo_news_card";
            songbo_card.innerHTML = `
                <div class="songbo_news_body">
                    <div class="songbo_news_title">${n.title}</div>
                    <div class="songbo_news_summary">${n.summary}</div>
                    <div class="songbo_news_foot">
                        <span class="songbo_tag">${n.category}</span>
                        <span class="songbo_hot">🔥 ${n.views} 阅读</span>
                        <span>${n.author}</span>
                        <span>${(n.published_at || "").slice(0, 10)}</span>
                    </div>
                </div>
                <img class="songbo_news_cover" src="${n.cover_image}" alt="封面图">`;
            songbo_card.addEventListener("click", () => location.href = `detail.html?id=${n.id}`);
            songbo_box.appendChild(songbo_card);
        });
    }
    songbo_render_pager(songbo_pages);
}

function songbo_render_pager(songbo_pages) {
    const songbo_pager = document.getElementById("songbo_pager");
    let songbo_html = `<button id="songbo_pg_prev" ${songbo_page_no <= 1 ? "disabled" : ""}>‹ 上一页</button>`;
    for (let i = 1; i <= songbo_pages; i++) {
        songbo_html += `<button class="${i === songbo_page_no ? "songbo_active" : ""}" data-p="${i}">${i}</button>`;
    }
    songbo_html += `<button id="songbo_pg_next" ${songbo_page_no >= songbo_pages ? "disabled" : ""}>下一页 ›</button>`;
    songbo_pager.innerHTML = songbo_html;

    document.getElementById("songbo_pg_prev").addEventListener("click", () => { songbo_page_no--; songbo_render_page(); window.scrollTo({ top: 0 }); });
    document.getElementById("songbo_pg_next").addEventListener("click", () => { songbo_page_no++; songbo_render_page(); window.scrollTo({ top: 0 }); });
    songbo_pager.querySelectorAll("[data-p]").forEach(b => {
        b.addEventListener("click", () => { songbo_page_no = +b.dataset.p; songbo_render_page(); window.scrollTo({ top: 0 }); });
    });
}

/* ---------- 启动 ---------- */
document.getElementById("songbo_kw").addEventListener("input", () => { songbo_page_no = 1; songbo_apply_filter(); });
songbo_load_tabs();
songbo_load_data();
