/**
 * 文件名: songbo_common.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 全站公共 UI 与交互——动态注入页头导航/页脚（按登录态显示"登录/我的"）、
 *           导航吸顶阴影与返回顶部按钮（滚动监听）、Toast 轻提示、收藏工具函数。
 *           每个页面 body 前后放置 <header id="songbo_header"></header> 与
 *           <footer id="songbo_footer"></footer> 占位，由本脚本填充。
 */

/* ---------- 1. 页头导航渲染（登录态感知） ---------- */
function songbo_render_nav() {
    const songbo_header = document.getElementById("songbo_header");
    if (!songbo_header) return;
    const songbo_page = location.pathname.split("/").pop() || "index.html";
    const songbo_user = songbo_current_user();
    const songbo_nick = songbo_user ? (songbo_user.email || "用户").split("@")[0] : "";
    const songbo_right = songbo_is_login()
        ? `<a href="profile.html">我的 · <b>${songbo_nick}</b></a><a href="javascript:songbo_do_logout()">退出</a>`
        : `<a href="login.html">登录</a><a href="register.html">注册</a>`;
    songbo_header.innerHTML = `
        <nav class="songbo_nav">
            <div class="songbo_nav_inner">
                <a class="songbo_logo" href="index.html">知乎新闻<small>ZHIHU NEWS</small></a>
                <div class="songbo_nav_links">
                    <a href="index.html" data-page="index.html">首页</a>
                    <a href="list.html" data-page="list.html">话题</a>
                    <a href="search.html" data-page="search.html">搜索</a>
                    <a href="about.html" data-page="about.html">关于</a>
                </div>
                <div class="songbo_nav_user">${songbo_right}</div>
            </div>
        </nav>`;
    // 当前页高亮
    songbo_header.querySelectorAll("[data-page]").forEach(a => {
        if (a.dataset.page === songbo_page) a.classList.add("songbo_on");
    });
}

/* ---------- 2. 页脚渲染 ---------- */
function songbo_render_footer() {
    const songbo_footer = document.getElementById("songbo_footer");
    if (!songbo_footer) return;
    songbo_footer.innerHTML = `
        <footer class="songbo_footer">
            <b>宋博 · songbo17 · 24001011017</b> ｜ 《高级网页设计I》三级项目 ｜
            数据库：Supabase（BAAS） ｜ 前端：原生 HTML/CSS/JS（无框架 · 无 CDN）
        </footer>`;
}

/* ---------- 3. 退出登录 ---------- */
function songbo_do_logout() {
    songbo_logout();
    location.href = "index.html";
}

/* ---------- 4. 滚动监听：导航阴影 + 返回顶部按钮显隐（JS效果⑥） ---------- */
function songbo_init_scroll() {
    const songbo_btn = document.createElement("button");
    songbo_btn.id = "songbo_backtop";
    songbo_btn.textContent = "↑";
    songbo_btn.title = "返回顶部";
    document.body.appendChild(songbo_btn);

    window.addEventListener("scroll", () => {
        const songbo_nav = document.querySelector(".songbo_nav");
        if (songbo_nav) songbo_nav.classList.toggle("songbo_shadow", window.scrollY > 8);
        songbo_btn.classList.toggle("songbo_show", window.scrollY > 400);
    });
    songbo_btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- 5. Toast 轻提示 ---------- */
function songbo_toast(songbo_msg, songbo_ms = 2000) {
    let songbo_box = document.getElementById("songbo_toast");
    if (!songbo_box) {
        songbo_box = document.createElement("div");
        songbo_box.id = "songbo_toast";
        document.body.appendChild(songbo_box);
    }
    songbo_box.textContent = songbo_msg;
    songbo_box.classList.add("songbo_show");
    clearTimeout(songbo_box._songbo_timer);
    songbo_box._songbo_timer = setTimeout(() => songbo_box.classList.remove("songbo_show"), songbo_ms);
}

/* ---------- 6. 收藏工具（本地存储 JS效果⑦ + favorites 表） ----------
   收藏记录同时写 localStorage（快速回显）与 Supabase favorites 表（登录后云端同步） */
const songbo_fav = {
    /** 本地收藏 id 列表 */
    list() { try { return JSON.parse(localStorage.getItem("songbo_favs") || "[]"); } catch (e) { return []; } },
    has(id) { return this.list().includes(Number(id)); },
    /** 切换收藏：已登录时同步云端 favorites 表 */
    async toggle(songbo_news) {
        const songbo_id = Number(songbo_news.id);
        let songbo_arr = this.list();
        if (songbo_arr.includes(songbo_id)) {
            songbo_arr = songbo_arr.filter(x => x !== songbo_id);
            localStorage.setItem("songbo_favs", JSON.stringify(songbo_arr));
            if (songbo_is_login()) {
                const songbo_user = songbo_current_user();
                await songbo_rest_write("DELETE", "favorites",
                    `user_id=eq.${songbo_user.id}&news_id=eq.${songbo_id}`);
            }
            return false; // 返回：现在是否收藏
        }
        songbo_arr.push(songbo_id);
        localStorage.setItem("songbo_favs", JSON.stringify(songbo_arr));
        if (songbo_is_login()) {
            const songbo_user = songbo_current_user();
            await songbo_rest_write("POST", "favorites", "", {
                user_id: songbo_user.id, news_id: songbo_id, title: songbo_news.title || ""
            });
        }
        return true;
    }
};

/* ---------- 启动：每个页面引入本文件后自动执行 ---------- */
document.addEventListener("DOMContentLoaded", () => {
    songbo_render_nav();
    songbo_render_footer();
    songbo_init_scroll();
});
