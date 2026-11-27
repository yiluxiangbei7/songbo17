/**
 * 文件名: songbo_auth.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 登录注册与鉴权封装——基于 Supabase Auth（密码 bcrypt 加密存储，
 *           高阶功能项）。token 存 localStorage 实现登录态保持（刷新不丢失）。
 *           后台/仪表盘页面加载时调用 songbo_require_login() 拦截未登录访问。
 */

const SONGBO_TOKEN_KEY = "songbo_token";
const SONGBO_USER_KEY = "songbo_user";

/**
 * 注册：POST /auth/v1/signup —— Supabase 自动完成密码加密存储
 * @returns {Promise<{ok:boolean,msg:string}>}
 */
async function songbo_register(songbo_email, songbo_password) {
    const songbo_url = `${SONGBO_SUPABASE_URL}/auth/v1/signup`;
    console.log("%c[SONGBO请求] POST /auth/v1/signup", "color:#0084ff;font-weight:bold", { email: songbo_email });
    try {
        const songbo_resp = await fetch(songbo_url, {
            method: "POST",
            headers: { apikey: SONGBO_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email: songbo_email, password: songbo_password })
        });
        const songbo_data = await songbo_resp.json();
        console.log("%c[SONGBO响应] signup", "color:#00a854;font-weight:bold", songbo_data);
        if (!songbo_resp.ok) {
            return { ok: false, msg: (songbo_data.msg || songbo_data.error_description || songbo_data.error || "注册失败") };
        }
        // 自动登录：保存 token 与用户信息
        if (songbo_data.access_token) {
            localStorage.setItem(SONGBO_TOKEN_KEY, songbo_data.access_token);
            localStorage.setItem(SONGBO_USER_KEY, JSON.stringify(songbo_data.user));
        }
        return { ok: true, msg: "注册成功" };
    } catch (songbo_err) {
        console.error("[SONGBO网络错误] signup", songbo_err);
        return { ok: false, msg: "网络错误，请稍后重试" };
    }
}

/**
 * 登录：POST /auth/v1/token?grant_type=password —— 返回 JWT
 * @returns {Promise<{ok:boolean,msg:string}>}
 */
async function songbo_login(songbo_email, songbo_password) {
    const songbo_url = `${SONGBO_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    console.log("%c[SONGBO请求] POST /auth/v1/token", "color:#0084ff;font-weight:bold", { email: songbo_email });
    try {
        const songbo_resp = await fetch(songbo_url, {
            method: "POST",
            headers: { apikey: SONGBO_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email: songbo_email, password: songbo_password })
        });
        const songbo_data = await songbo_resp.json();
        console.log("%c[SONGBO响应] login", "color:#00a854;font-weight:bold", songbo_data);
        if (!songbo_resp.ok) {
            return { ok: false, msg: songbo_data.error_description || "邮箱或密码错误" };
        }
        localStorage.setItem(SONGBO_TOKEN_KEY, songbo_data.access_token);
        localStorage.setItem(SONGBO_USER_KEY, JSON.stringify(songbo_data.user));
        return { ok: true, msg: "登录成功" };
    } catch (songbo_err) {
        console.error("[SONGBO网络错误] login", songbo_err);
        return { ok: false, msg: "网络错误，请稍后重试" };
    }
}

/** 是否已登录（本地存在 token 即视为已登录） */
function songbo_is_login() {
    return !!localStorage.getItem(SONGBO_TOKEN_KEY);
}

/** 获取当前登录用户对象（含 id / email） */
function songbo_current_user() {
    try {
        return JSON.parse(localStorage.getItem(SONGBO_USER_KEY) || "null");
    } catch (e) { return null; }
}

/** 退出登录：清除本地登录态 */
function songbo_logout() {
    localStorage.removeItem(SONGBO_TOKEN_KEY);
    localStorage.removeItem(SONGBO_USER_KEY);
}

/**
 * 页面守卫：后台管理 / 仪表盘等页面加载时调用。
 * 未登录 → 提示并跳转登录页（评分项：未登录访问管理页面被拦截）。
 */
function songbo_require_login() {
    if (!songbo_is_login()) {
        alert("请先登录后再访问后台管理页面！");
        location.href = "login.html?from=" + encodeURIComponent(location.pathname.split("/").pop());
        return false;
    }
    return true;
}
