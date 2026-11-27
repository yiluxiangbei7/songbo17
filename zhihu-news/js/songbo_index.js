/**
 * 文件名: songbo_index.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 首页逻辑——canvas 粒子背景（动画③）、轮播图（JS效果① 自动播放+指示点+
 *           箭头）、话题筛选条渲染、今日热榜新闻列表（点击跳详情页）。
 *           涉及表：topics（话题条）、news（轮播/列表）
 */

/* ---------- 1. canvas 粒子背景（动画③ canvas + requestAnimationFrame） ---------- */
function songbo_init_particles() {
    const songbo_canvas = document.getElementById("songbo_canvas");
    const songbo_wrap = songbo_canvas.parentElement;
    const songbo_ctx = songbo_canvas.getContext("2d");

    function songbo_resize() {
        songbo_canvas.width = songbo_wrap.clientWidth;
        songbo_canvas.height = songbo_wrap.clientHeight;
    }
    songbo_resize();
    window.addEventListener("resize", songbo_resize);

    // 生成粒子：位置随机、速度缓慢、半径 1.2~2.6
    const songbo_dots = Array.from({ length: 34 }, () => ({
        x: Math.random() * songbo_canvas.width,
        y: Math.random() * songbo_canvas.height,
        vx: (Math.random() - .5) * .5,
        vy: (Math.random() - .5) * .5,
        r: 1.2 + Math.random() * 1.4
    }));

    function songbo_draw() {
        songbo_ctx.clearRect(0, 0, songbo_canvas.width, songbo_canvas.height);
        // 粒子位移 + 边界反弹
        songbo_dots.forEach(d => {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > songbo_canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > songbo_canvas.height) d.vy *= -1;
            songbo_ctx.beginPath();
            songbo_ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            songbo_ctx.fillStyle = "rgba(0,132,255,.28)";
            songbo_ctx.fill();
        });
        // 临近粒子连线
        for (let i = 0; i < songbo_dots.length; i++) {
            for (let j = i + 1; j < songbo_dots.length; j++) {
                const a = songbo_dots[i], b = songbo_dots[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 110) {
                    songbo_ctx.beginPath();
                    songbo_ctx.moveTo(a.x, a.y);
                    songbo_ctx.lineTo(b.x, b.y);
                    songbo_ctx.strokeStyle = `rgba(0,132,255,${(1 - dist / 110) * .16})`;
                    songbo_ctx.stroke();
                }
            }
        }
        requestAnimationFrame(songbo_draw);
    }
    songbo_draw();
}

/* ---------- 2. 轮播图：取阅读量前 3 的新闻（JS效果①） ---------- */
let songbo_carousel_timer = null;
let songbo_slide_idx = 0;

async function songbo_load_carousel() {
    const songbo_box = document.getElementById("songbo_carousel");
    // PostgREST 参数：order=views.desc 取热度前3
    const songbo_top = await songbo_rest_get("news", "select=id,title,summary,cover_image,category&order=views.desc&limit=3");
    if (songbo_top.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status" style="width:100%;line-height:260px;">暂无精选数据</div>';
        return;
    }
    songbo_box.innerHTML = `
        ${songbo_top.map((n, i) => `
            <div class="songbo_carousel_slide ${i === 0 ? "songbo_active" : ""}" data-id="${n.id}">
                <div><h2>${n.title}</h2><p>${n.summary}</p></div>
                <img src="${n.cover_image}" alt="${n.category}">
            </div>`).join("")}
        <button class="songbo_carousel_arrow songbo_arrow_prev" id="songbo_car_prev">‹</button>
        <button class="songbo_carousel_arrow songbo_arrow_next" id="songbo_car_next">›</button>
        <div class="songbo_carousel_dots">
            ${songbo_top.map((n, i) => `<i class="${i === 0 ? "songbo_active" : ""}" data-i="${i}"></i>`).join("")}
        </div>`;

    const songbo_slides = songbo_box.querySelectorAll(".songbo_carousel_slide");
    const songbo_dots = songbo_box.querySelectorAll(".songbo_carousel_dots i");

    function songbo_show(i) {
        songbo_slide_idx = (i + songbo_slides.length) % songbo_slides.length;
        songbo_slides.forEach((s, k) => s.classList.toggle("songbo_active", k === songbo_slide_idx));
        songbo_dots.forEach((d, k) => d.classList.toggle("songbo_active", k === songbo_slide_idx));
    }
    function songbo_auto() {
        clearInterval(songbo_carousel_timer);
        songbo_carousel_timer = setInterval(() => songbo_show(songbo_slide_idx + 1), 4000);
    }

    songbo_box.querySelector("#songbo_car_prev").addEventListener("click", () => { songbo_show(songbo_slide_idx - 1); songbo_auto(); });
    songbo_box.querySelector("#songbo_car_next").addEventListener("click", () => { songbo_show(songbo_slide_idx + 1); songbo_auto(); });
    songbo_dots.forEach(d => d.addEventListener("click", () => { songbo_show(+d.dataset.i); songbo_auto(); }));
    // 点击轮播跳详情页（URL 传参）
    songbo_slides.forEach(s => s.addEventListener("click", () => {
        if (window.event && window.event.target.tagName === "BUTTON") return;
        location.href = `detail.html?id=${s.dataset.id}`;
    }));
    songbo_auto();
}

/* ---------- 3. 话题筛选条（点击跳列表页并按话题过滤） ---------- */
async function songbo_load_topics_bar() {
    const songbo_bar = document.getElementById("songbo_topics_bar");
    const songbo_list = await songbo_rest_get("topics", "select=id,name,followers&order=sort.asc");
    if (songbo_list.length === 0) { songbo_bar.innerHTML = ""; return; }
    songbo_bar.innerHTML = songbo_list.map(t =>
        `<span class="songbo_topic_chip" data-name="${t.name}">${t.name} · ${t.followers}万</span>`
    ).join("");
    songbo_bar.querySelectorAll(".songbo_topic_chip").forEach(chip => {
        chip.addEventListener("click", () => {
            location.href = `list.html?topic=${encodeURIComponent(chip.dataset.name)}`;
        });
    });
}

/* ---------- 4. 今日热榜列表（按发布时间倒序） ---------- */
async function songbo_load_news() {
    const songbo_box = document.getElementById("songbo_news_list");
    songbo_box.innerHTML = '<div class="songbo_status">正在从 Supabase 加载新闻…</div>';
    const songbo_list = await songbo_rest_get("news", "select=id,title,summary,category,author,cover_image,views,published_at&order=published_at.desc&limit=8");

    if (songbo_list.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">没有查到数据（请检查 Supabase 配置或数据库是否已建表）</div>';
        return;
    }
    songbo_box.innerHTML = "";
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
            <img class="songbo_news_cover" src="${n.cover_image}" alt="封面图">
        `;
        // 点击卡片 → 详情页 URL 传参（评分项：列表与列表详情）
        songbo_card.addEventListener("click", () => location.href = `detail.html?id=${n.id}`);
        songbo_box.appendChild(songbo_card);
    });
}

/* ---------- 启动 ---------- */
songbo_init_particles();
songbo_load_carousel();
songbo_load_topics_bar();
songbo_load_news();
