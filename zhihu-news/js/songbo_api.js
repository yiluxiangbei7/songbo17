/**
 * 文件名: songbo_api.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: Supabase REST 访问封装——统一请求头、控制台留证、错误处理。
 *           匿名请求带 anon key；若本地已登录则自动携带用户 JWT（获得写权限）。
 *           接口路径: {SONGBO_SUPABASE_URL}/rest/v1/<表名>?<PostgREST 查询参数>
 */

/**
 * GET 方式查询 Supabase REST 接口
 * @param {string} songbo_table 表名，如 news / comments / topics / favorites
 * @param {string} songbo_query PostgREST 查询串，如 "select=*&id=eq.1"
 * @returns {Promise<Array>}   返回 JSON 数组；失败时返回空数组并打日志
 */
async function songbo_rest_get(songbo_table, songbo_query) {
    const songbo_url = `${SONGBO_SUPABASE_URL}/rest/v1/${songbo_table}?${songbo_query}`;
    // 控制台留证（评分项：过程可查）
    console.log(`%c[SONGBO请求] GET ${songbo_table}?${songbo_query}`, "color:#0084ff;font-weight:bold", songbo_url);

    try {
        const songbo_resp = await fetch(songbo_url, { method: "GET", headers: songbo_headers() });
        const songbo_data = await songbo_resp.json();
        console.log(`%c[SONGBO响应] ${songbo_table}`, "color:#00a854;font-weight:bold", songbo_data);
        if (!songbo_resp.ok) {
            console.error(`[SONGBO接口异常] HTTP ${songbo_resp.status}`, songbo_data);
            return [];
        }
        return Array.isArray(songbo_data) ? songbo_data : [];
    } catch (songbo_err) {
        console.error(`[SONGBO网络错误] ${songbo_table}`, songbo_err);
        return [];
    }
}

/**
 * 通用写操作（POST / PATCH / DELETE）——需登录（JWT 由 songbo_auth 保存）
 * @param {string} songbo_method "POST" | "PATCH" | "DELETE"
 * @param {string} songbo_table  表名
 * @param {string} songbo_query  过滤串（PATCH/DELETE 用，如 "id=eq.3"；POST 传 ""）
 * @param {object} songbo_body   写入的数据对象
 * @returns {Promise<{ok:boolean,status:number,data:any}>}
 */
async function songbo_rest_write(songbo_method, songbo_table, songbo_query, songbo_body) {
    const songbo_url = `${SONGBO_SUPABASE_URL}/rest/v1/${songbo_table}${songbo_query ? "?" + songbo_query : ""}`;
    console.log(`%c[SONGBO请求] ${songbo_method} ${songbo_table}`, "color:#0084ff;font-weight:bold", songbo_body || "");

    try {
        const songbo_headers_ = songbo_headers();
        songbo_headers_["Content-Type"] = "application/json";
        songbo_headers_["Prefer"] = "return=representation";
        const songbo_resp = await fetch(songbo_url, {
            method: songbo_method,
            headers: songbo_headers_,
            body: songbo_body ? JSON.stringify(songbo_body) : undefined
        });
        const songbo_text = await songbo_resp.text();
        let songbo_data = null;
        try { songbo_data = songbo_text ? JSON.parse(songbo_text) : null; } catch (e) { songbo_data = songbo_text; }

        console.log(`%c[SONGBO响应] ${songbo_method} ${songbo_table}`, "color:#00a854;font-weight:bold", songbo_data);
        if (!songbo_resp.ok) {
            // RLS 拦截未登录写操作时返回 401/403 或 42501，前端统一提示
            console.error(`[SONGBO写操作被拒绝] HTTP ${songbo_resp.status}`, songbo_data);
        }
        return { ok: songbo_resp.ok, status: songbo_resp.status, data: songbo_data };
    } catch (songbo_err) {
        console.error(`[SONGBO网络错误] ${songbo_method} ${songbo_table}`, songbo_err);
        return { ok: false, status: 0, data: null };
    }
}

/**
 * 组装请求头：未登录用 anon key（只读）；已登录带用户 JWT（RLS 放行写操作）
 */
function songbo_headers() {
    const songbo_token = localStorage.getItem("songbo_token");
    const songbo_bearer = songbo_token || SONGBO_SUPABASE_ANON_KEY;
    return {
        apikey: SONGBO_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${songbo_bearer}`
    };
}
