/**
 * 文件名: songbo_detail.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 详情页逻辑——URLSearchParams 解析 ?id=N，调用详情接口按 id 加载
 *           （评分项：URL 传参）；评论列表（外键过滤）；相关推荐（同分类）；
 *           收藏切换（localStorage + favorites 表）；AI 摘要（Express 中间层转 DeepSeek）
 */

let songbo_detail_data = null;   // 当前新闻对象（收藏/AI 摘要用）

/* ---------- 1. 解析 URL 参数并加载详情 ---------- */
async function songbo_load_detail() {
    const songbo_box = document.getElementById("songbo_detail_box");
    // URL 传参：detail.html?id=3
    const songbo_id = new URLSearchParams(location.search).get("id");
    if (!songbo_id) {
        songbo_box.innerHTML = '<div class="songbo_status">缺少参数 id，请从<a href="list.html" style="color:#0084ff;">列表页</a>进入</div>';
        return;
    }
    console.log("[SONGBO传参] URL 参数 id =", songbo_id);

    // 详情接口：按主键过滤 id=eq.N
    const songbo_list = await songbo_rest_get("news", `select=*&id=eq.${songbo_id}`);
    if (songbo_list.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">未找到该新闻（id 不存在）</div>';
        return;
    }
    songbo_detail_data = songbo_list[0];
    document.title = `${songbo_detail_data.title} · 知乎新闻`;

    const songbo_faved = songbo_fav.has(songbo_detail_data.id);
    songbo_box.innerHTML = `
        <article class="songbo_detail">
            <h1>${songbo_detail_data.title}</h1>
            <div class="songbo_detail_meta">
                <span class="songbo_tag">${songbo_detail_data.category}</span>
                <span>${songbo_detail_data.author}</span>
                <span>发布于 ${(songbo_detail_data.published_at || "").slice(0, 10)}</span>
                <span>🔥 ${songbo_detail_data.views} 阅读</span>
            </div>
            <img class="songbo_detail_cover" src="${songbo_detail_data.cover_image}" alt="封面图">
            <div class="songbo_detail_content">${songbo_detail_data.content}</div>

            <div class="songbo_detail_actions">
                <button class="songbo_btn ${songbo_faved ? "songbo_fav_on" : ""}" id="songbo_btn_fav">
                    ${songbo_faved ? "★ 已收藏" : "☆ 收藏"}
                </button>
                <button class="songbo_btn songbo_btn_ghost" id="songbo_btn_ai">✨ AI 摘要</button>
            </div>

            <!-- AI 摘要结果卡片（LLM 中间层返回后填充） -->
            <div class="songbo_ai_card" id="songbo_ai_card" style="display:none;">
                <h3>✨ AI 摘要（DeepSeek）</h3>
                <p id="songbo_ai_text"></p>
            </div>
        </article>
        <div class="songbo_cmt_title">精选评论</div>
        <div id="songbo_cmt_list"><div class="songbo_status">正在加载评论…</div></div>
        <div class="songbo_cmt_title">相关推荐</div>
        <div class="songbo_rel_list" id="songbo_rel_list"><div class="songbo_status">加载中…</div></div>
    `;

    songbo_bind_actions();
    songbo_load_comments(songbo_detail_data.id);
    songbo_load_related(songbo_detail_data.category, songbo_detail_data.id);
}

/* ---------- 2. 收藏切换 + AI 摘要按钮 ---------- */
function songbo_bind_actions() {
    document.getElementById("songbo_btn_fav").addEventListener("click", async (e) => {
        const songbo_on = await songbo_fav.toggle(songbo_detail_data);
        e.target.classList.toggle("songbo_fav_on", songbo_on);
        e.target.textContent = songbo_on ? "★ 已收藏" : "☆ 收藏";
        songbo_toast(songbo_on ? "已加入收藏" : "已取消收藏");
    });

    document.getElementById("songbo_btn_ai").addEventListener("click", songbo_ask_ai);
}

/**
 * AI 摘要：POST {SONGBO_AI_BASE}/api/ai/summary
 * 中间层（backend-llm/server.js）服务端保管 DeepSeek 密钥并转发请求。
 * 未启动中间层时给出友好降级提示。
 */
async function songbo_ask_ai() {
    const songbo_card = document.getElementById("songbo_ai_card");
    const songbo_text = document.getElementById("songbo_ai_text");
    songbo_card.style.display = "block";
    songbo_text.innerHTML = '<span class="songbo_ai_loading">AI 正在阅读全文并生成摘要…</span>';

    try {
        const songbo_resp = await fetch(`${SONGBO_AI_BASE}/api/ai/summary`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: songbo_detail_data.title,
                content: songbo_detail_data.content
            })
        });
        const songbo_data = await songbo_resp.json();
        console.log("%c[SONGBO响应] AI 摘要", "color:#00a854;font-weight:bold", songbo_data);
        if (songbo_data.code === 0) {
            songbo_text.textContent = songbo_data.data;
        } else {
            songbo_text.textContent = "AI 服务返回异常：" + (songbo_data.msg || "未知错误");
        }
    } catch (songbo_err) {
        console.error("[SONGBO网络错误] AI 摘要", songbo_err);
        songbo_text.innerHTML =
            '未能连接 AI 服务（中间层未启动）。<br>' +
            '启动方式：进入 backend-llm 目录，配置 .env 中的 DeepSeek 密钥后执行 <b>node server.js</b>。';
    }
}

/* ---------- 3. 评论列表（外键过滤 news_id=eq.N，按点赞倒序） ---------- */
async function songbo_load_comments(songbo_id) {
    const songbo_box = document.getElementById("songbo_cmt_list");
    const songbo_cmts = await songbo_rest_get("comments",
        `select=nickname,content,likes,created_at&news_id=eq.${songbo_id}&order=likes.desc`);
    if (songbo_cmts.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">暂无评论</div>';
        return;
    }
    songbo_box.innerHTML = songbo_cmts.map(c => `
        <div class="songbo_cmt_item">
            <div class="songbo_cmt_head">
                <b>${c.nickname}</b><span>👍 ${c.likes}</span>
                <span>${(c.created_at || "").slice(0, 10)}</span>
            </div>
            <div class="songbo_cmt_content">${c.content}</div>
        </div>`).join("");
}

/* ---------- 4. 相关推荐（同分类、排除当前 id） ---------- */
async function songbo_load_related(songbo_cate, songbo_id) {
    const songbo_box = document.getElementById("songbo_rel_list");
    const songbo_list = await songbo_rest_get("news",
        `select=id,title,views&category=eq.${encodeURIComponent(songbo_cate)}&id=neq.${songbo_id}&order=views.desc&limit=4`);
    if (songbo_list.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">暂无相关推荐</div>';
        return;
    }
    songbo_box.innerHTML = songbo_list.map(n =>
        `<div class="songbo_rel_item" data-id="${n.id}">${n.title} · 🔥${n.views}</div>`).join("");
    songbo_box.querySelectorAll(".songbo_rel_item").forEach(item => {
        item.addEventListener("click", () => {
            location.href = `detail.html?id=${item.dataset.id}`;  // URL 传参跳转
        });
    });
}

/* ---------- 启动 ---------- */
songbo_load_detail();
