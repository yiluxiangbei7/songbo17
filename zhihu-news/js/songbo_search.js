/**
 * 文件名: songbo_search.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 搜索页逻辑——调用搜索接口（PostgREST or=ilike 对 title/summary/content
 *           模糊匹配）；搜索历史写入 localStorage（最多保留 8 条，去重），
 *           点击历史词可再次搜索，支持清空。
 */

const SONGBO_HISTORY_KEY = "songbo_search_history";

/* ---------- 1. 执行搜索 ---------- */
async function songbo_do_search(songbo_kw) {
    const songbo_box = document.getElementById("songbo_result_list");
    if (!songbo_kw) {
        songbo_box.innerHTML = '<div class="songbo_status">请输入关键词</div>';
        return;
    }
    songbo_box.innerHTML = '<div class="songbo_status">正在搜索…</div>';
    songbo_save_history(songbo_kw);

    // 搜索接口：or=(title.ilike.*kw*,summary.ilike.*kw*,content.ilike.*kw*)
    const songbo_cond = `or=(title.ilike.*${songbo_kw}*,summary.ilike.*${songbo_kw}*,content.ilike.*${songbo_kw}*)`;
    const songbo_list = await songbo_rest_get("news",
        `select=id,title,summary,category,author,cover_image,views,published_at&${songbo_cond}&order=views.desc`);

    if (songbo_list.length === 0) {
        songbo_box.innerHTML = `<div class="songbo_status">没有找到与「${songbo_kw}」相关的新闻</div>`;
        return;
    }
    songbo_box.innerHTML = `<div class="songbo_section_title">找到 ${songbo_list.length} 条结果</div>`;
    songbo_list.forEach(n => {
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

/* ---------- 2. 搜索历史（localStorage，JS效果⑦本地存储） ---------- */
function songbo_save_history(songbo_kw) {
    let songbo_arr = [];
    try { songbo_arr = JSON.parse(localStorage.getItem(SONGBO_HISTORY_KEY) || "[]"); } catch (e) {}
    songbo_arr = songbo_arr.filter(x => x !== songbo_kw);   // 去重：本次提到最前
    songbo_arr.unshift(songbo_kw);
    songbo_arr = songbo_arr.slice(0, 8);                    // 最多 8 条
    localStorage.setItem(SONGBO_HISTORY_KEY, JSON.stringify(songbo_arr));
    songbo_render_history();
}

function songbo_render_history() {
    let songbo_arr = [];
    try { songbo_arr = JSON.parse(localStorage.getItem(SONGBO_HISTORY_KEY) || "[]"); } catch (e) {}
    const songbo_box = document.getElementById("songbo_history");
    if (songbo_arr.length === 0) {
        document.getElementById("songbo_history_box").style.display = "none";
        return;
    }
    document.getElementById("songbo_history_box").style.display = "block";
    songbo_box.innerHTML = songbo_arr.map(w => `<span data-w="${w}">${w}</span>`).join("");
    songbo_box.querySelectorAll("[data-w]").forEach(s => {
        s.addEventListener("click", () => {
            document.getElementById("songbo_kw").value = s.dataset.w;
            songbo_do_search(s.dataset.w);
        });
    });
}

/* ---------- 启动 ---------- */
document.getElementById("songbo_btn_search").addEventListener("click", () => {
    songbo_do_search(document.getElementById("songbo_kw").value.trim());
});
document.getElementById("songbo_kw").addEventListener("keydown", (e) => {
    if (e.key === "Enter") songbo_do_search(document.getElementById("songbo_kw").value.trim());
});
document.getElementById("songbo_btn_clear").addEventListener("click", () => {
    localStorage.removeItem(SONGBO_HISTORY_KEY);
    songbo_render_history();
    songbo_toast("搜索历史已清空");
});
songbo_render_history();
