/**
 * 文件名: songbo_profile.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 个人中心逻辑——展示当前登录用户（邮箱/注册时间，来自 Supabase Auth）；
 *           我的收藏：本地 songbo_favs 列表 + 云端 favorites 表（登录后），
 *           点击卡片跳详情页 URL 传参，支持取消收藏；未登录显示引导卡片。
 */

/* ---------- 1. 用户信息卡片 ---------- */
function songbo_render_user() {
    const songbo_box = document.getElementById("songbo_profile_box");
    if (!songbo_is_login()) {
        songbo_box.innerHTML = `
            <div class="songbo_form_card" style="margin-top:30px;">
                <h1>你还没有登录</h1>
                <p class="songbo_form_sub">登录后可以收藏新闻、使用后台管理</p>
                <button class="songbo_btn songbo_form_submit" onclick="location.href='login.html?from=profile.html'">去登录</button>
                <div class="songbo_form_foot">没有账号？<a href="register.html">去注册 →</a></div>
            </div>`;
        return null;
    }
    const songbo_user = songbo_current_user() || {};
    const songbo_email = songbo_user.email || "未知邮箱";
    songbo_box.innerHTML = `
        <div class="songbo_profile_head">
            <div class="songbo_avatar">${songbo_email.charAt(0).toUpperCase()}</div>
            <div>
                <h2>${songbo_email.split("@")[0]}</h2>
                <p>邮箱：${songbo_email} ｜ 注册时间：${(songbo_user.created_at || "").slice(0, 10) || "—"}</p>
                <p>数据来源：Supabase Auth（登录态由 token 保持，刷新页面不丢失）</p>
            </div>
            <button class="songbo_btn songbo_btn_danger songbo_btn_small" style="margin-left:auto;" onclick="songbo_do_logout()">退出登录</button>
        </div>`;
    return songbo_user;
}

/* ---------- 2. 我的收藏（本地 + 云端） ---------- */
async function songbo_render_favs() {
    const songbo_area = document.getElementById("songbo_fav_area");
    if (!songbo_is_login()) return;

    // 合并本地收藏与云端收藏（登录后两端一致；以 id 并集为准）
    let songbo_ids = songbo_fav.list();
    const songbo_cloud = await songbo_rest_get("favorites", "select=news_id,title&order=created_at.desc");
    songbo_cloud.forEach(f => {
        if (!songbo_ids.includes(f.news_id)) songbo_ids.push(f.news_id);
    });

    if (songbo_ids.length === 0) {
        songbo_area.innerHTML = `
            <div class="songbo_section_title">我的收藏</div>
            <div class="songbo_status">还没有收藏，去<a href="list.html" style="color:#0084ff;">列表页</a>发现好内容吧</div>`;
        return;
    }

    // PostgREST in 过滤：id=in.(1,2,3) 批量取收藏的新闻
    const songbo_news = await songbo_rest_get("news",
        `select=id,title,category,views,published_at&id=in.(${songbo_ids.join(",")})&order=published_at.desc`);

    songbo_area.innerHTML = '<div class="songbo_section_title">我的收藏</div>';
    songbo_news.forEach(n => {
        const songbo_card = document.createElement("div");
        songbo_card.className = "songbo_fav_card";
        songbo_card.innerHTML = `
            <div>
                <b>${n.title}</b>
                <span style="display:block;">${n.category} ｜ 🔥 ${n.views} 阅读 ｜ ${(n.published_at || "").slice(0, 10)}</span>
            </div>
            <button class="songbo_btn songbo_btn_danger songbo_btn_small">取消收藏</button>`;
        // 点击卡片主体跳详情（URL 传参），点击按钮取消收藏
        songbo_card.addEventListener("click", (e) => {
            if (e.target.tagName === "BUTTON") return;
            location.href = `detail.html?id=${n.id}`;
        });
        songbo_card.querySelector("button").addEventListener("click", async (e) => {
            e.stopPropagation();
            await songbo_fav.toggle(n);
            songbo_toast("已取消收藏");
            songbo_render_favs();   // 重新渲染
        });
        songbo_area.appendChild(songbo_card);
    });
}

/* ---------- 启动 ---------- */
const songbo_user = songbo_render_user();
if (songbo_user) songbo_render_favs();
