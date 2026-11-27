/**
 * 文件名: songbo_admin.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 后台管理逻辑——配置驱动的 3 实体管理（news/topics/comments）。
 *           加载时 songbo_require_login() 鉴权拦截；每实体支持列表、搜索（本地过滤）、
 *           分页（每页 5 条）、新增（POST）、编辑（PATCH）、删除（DELETE），
 *           写请求自动携带登录 JWT，未登录时 Supabase RLS 返回 401 被前端拦截提示。
 */

const SONGBO_ADMIN_PAGE_SIZE = 5;
const SONGBO_ADMIN_ROWS_KEY = "songbo_admin_rows";     // 当前实体数据缓存

// 实体配置：表名、展示列、搜索字段、表单字段（type: text/number/textarea/datetime）
const SONGBO_ENTITIES = {
    news: {
        label: "新闻",
        search_fields: ["title", "summary", "author", "category"],
        columns: ["id", "title", "category", "author", "views", "published_at"],
        fields: [
            { key: "title",       label: "标题",   type: "text",     required: true },
            { key: "summary",     label: "摘要",   type: "text",     required: true },
            { key: "content",     label: "正文",   type: "textarea", required: true },
            { key: "category",    label: "分类(科技/互联网/教育/开发者)", type: "text", required: true },
            { key: "author",      label: "作者",   type: "text",     required: true },
            { key: "cover_image", label: "封面图路径(images/songbo_cover_ai.svg)", type: "text" },
            { key: "views",       label: "阅读量", type: "number" },
            { key: "published_at",label: "发布时间(留空=现在)", type: "datetime" }
        ]
    },
    topics: {
        label: "话题",
        search_fields: ["name", "description"],
        columns: ["id", "name", "followers", "sort", "description"],
        fields: [
            { key: "name",        label: "话题名称(唯一)", type: "text", required: true },
            { key: "description", label: "话题简介", type: "text", required: true },
            { key: "icon",        label: "图标路径(images/songbo_topic_ai.svg)", type: "text" },
            { key: "followers",   label: "关注数(万)", type: "number" },
            { key: "sort",        label: "排序权重(小靠前)", type: "number" }
        ]
    },
    comments: {
        label: "评论",
        search_fields: ["nickname", "content"],
        columns: ["id", "news_id", "nickname", "likes", "content"],
        fields: [
            { key: "news_id",  label: "所属新闻ID", type: "number", required: true },
            { key: "nickname", label: "评论者昵称", type: "text", required: true },
            { key: "content",  label: "评论内容", type: "textarea", required: true },
            { key: "likes",    label: "点赞数", type: "number" }
        ]
    }
};

let songbo_entity = "news";
let songbo_rows = [];
let songbo_page_no = 1;
let songbo_editing_id = null;   // null=新增，数字=编辑

/* ---------- 0. 鉴权拦截：未登录直接跳转登录页 ---------- */
if (!songbo_require_login()) {
    throw new Error("未登录，后台管理终止加载");
}

/* ---------- 1. 实体切换（tab） ---------- */
function songbo_bind_tabs() {
    document.querySelectorAll("#songbo_admin_tabs button").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#songbo_admin_tabs button")
                .forEach(b => { b.className = "songbo_btn songbo_btn_ghost songbo_btn_small"; });
            btn.className = "songbo_btn songbo_btn_small";
            songbo_entity = btn.dataset.entity;
            songbo_page_no = 1;
            songbo_load_rows();
        });
    });
}

/* ---------- 2. 加载当前实体数据（REST 列表接口） ---------- */
async function songbo_load_rows() {
    const songbo_box = document.getElementById("songbo_admin_table_box");
    songbo_box.innerHTML = '<div class="songbo_status">正在加载数据…</div>';
    const songbo_conf = SONGBO_ENTITIES[songbo_entity];
    const songbo_order = songbo_entity === "topics" ? "sort.asc" : "id.asc";
    songbo_rows = await songbo_rest_get(songbo_entity, `select=*&order=${songbo_order}`);
    document.getElementById("songbo_admin_user").textContent =
        `（当前管理员：${(songbo_current_user() || {}).email || "未知"}）`;
    songbo_render_table();
}

/* ---------- 3. 表格渲染（搜索过滤 + 分页） ---------- */
function songbo_render_table() {
    const songbo_conf = SONGBO_ENTITIES[songbo_entity];
    const songbo_kw = document.getElementById("songbo_admin_kw").value.trim().toLowerCase();

    const songbo_hits = songbo_rows.filter(r =>
        !songbo_kw || songbo_conf.search_fields.some(f => String(r[f] || "").toLowerCase().includes(songbo_kw)));

    const songbo_pages = Math.max(1, Math.ceil(songbo_hits.length / SONGBO_ADMIN_PAGE_SIZE));
    if (songbo_page_no > songbo_pages) songbo_page_no = songbo_pages;
    const songbo_slice = songbo_hits.slice((songbo_page_no - 1) * SONGBO_ADMIN_PAGE_SIZE, songbo_page_no * SONGBO_ADMIN_PAGE_SIZE);

    const songbo_box = document.getElementById("songbo_admin_table_box");
    if (songbo_slice.length === 0) {
        songbo_box.innerHTML = '<div class="songbo_status">没有匹配的数据</div>';
    } else {
        songbo_box.innerHTML = `
            <table class="songbo_table">
                <thead><tr>
                    ${songbo_conf.columns.map(c => `<th>${c}</th>`).join("")}
                    <th>操作</th>
                </tr></thead>
                <tbody>
                    ${songbo_slice.map(r => `
                        <tr>
                            ${songbo_conf.columns.map(c =>
                                `<td class="${c === "title" || c === "description" || c === "content" || c === "name" ? "songbo_cell_title" : ""}" title="${(r[c] ?? "")}">${(r[c] ?? "")}</td>`).join("")}
                            <td class="songbo_op">
                                <button class="songbo_btn songbo_btn_ghost songbo_btn_small" data-edit="${r.id}">编辑</button>
                                <button class="songbo_btn songbo_btn_danger songbo_btn_small" data-del="${r.id}">删除</button>
                            </td>
                        </tr>`).join("")}
                </tbody>
            </table>`;
        songbo_box.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => songbo_open_modal(+b.dataset.edit)));
        songbo_box.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => songbo_delete_row(+b.dataset.del)));
    }
    songbo_render_admin_pager(songbo_pages);
}

function songbo_render_admin_pager(songbo_pages) {
    const songbo_pager = document.getElementById("songbo_admin_pager");
    let songbo_html = `<button id="songbo_apg_prev" ${songbo_page_no <= 1 ? "disabled" : ""}>‹</button>`;
    for (let i = 1; i <= songbo_pages; i++) {
        songbo_html += `<button class="${i === songbo_page_no ? "songbo_active" : ""}" data-p="${i}">${i}</button>`;
    }
    songbo_html += `<button id="songbo_apg_next" ${songbo_page_no >= songbo_pages ? "disabled" : ""}>›</button>`;
    songbo_pager.innerHTML = songbo_html;
    document.getElementById("songbo_apg_prev").addEventListener("click", () => { songbo_page_no--; songbo_render_table(); });
    document.getElementById("songbo_apg_next").addEventListener("click", () => { songbo_page_no++; songbo_render_table(); });
    songbo_pager.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => { songbo_page_no = +b.dataset.p; songbo_render_table(); }));
}

/* ---------- 4. 新增/编辑弹层（配置驱动动态表单） ---------- */
function songbo_open_modal(songbo_id) {
    songbo_editing_id = songbo_id;   // null = 新增
    const songbo_conf = SONGBO_ENTITIES[songbo_entity];
    const songbo_row = songbo_id ? songbo_rows.find(r => r.id === songbo_id) : {};

    document.getElementById("songbo_admin_modal_title").textContent =
        (songbo_id ? "编辑" : "新增") + songbo_conf.label;

    document.getElementById("songbo_admin_form").innerHTML = songbo_conf.fields.map(f => `
        <div class="songbo_field">
            <label>${f.label}${f.required ? " *" : ""}</label>
            ${f.type === "textarea"
                ? `<textarea class="songbo_textarea" data-key="${f.key}" id="songbo_f_${f.key}">${songbo_row[f.key] ?? ""}</textarea>`
                : `<input type="${f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : "text"}"
                       data-key="${f.key}" id="songbo_f_${f.key}"
                       value="${f.type === "datetime" && songbo_row[f.key] ? songbo_row[f.key].slice(0, 16) : (songbo_row[f.key] ?? "")}">`}
            <div class="songbo_field_msg" id="songbo_f_msg_${f.key}"></div>
        </div>`).join("");

    document.getElementById("songbo_admin_mask").classList.add("songbo_show");
}

/* ---------- 5. 保存（POST 新增 / PATCH 编辑，携带 JWT） ---------- */
async function songbo_save_row() {
    const songbo_conf = SONGBO_ENTITIES[songbo_entity];
    const songbo_body = {};
    let songbo_valid = true;

    // 收集表单值 + 必填校验
    songbo_conf.fields.forEach(f => {
        const songbo_el = document.getElementById(`songbo_f_${f.key}`);
        let songbo_val = songbo_el.value.trim();
        if (f.type === "number") songbo_val = songbo_val === "" ? 0 : Number(songbo_val);
        if (f.type === "datetime" && songbo_val) songbo_val = new Date(songbo_val).toISOString();
        if (f.required && (songbo_val === "" || songbo_val === undefined)) {
            document.getElementById(`songbo_f_msg_${f.key}`).textContent = "此项为必填";
            songbo_valid = false;
        } else {
            document.getElementById(`songbo_f_msg_${f.key}`).textContent = "";
        }
        if (songbo_val !== "" && songbo_val !== undefined) songbo_body[f.key] = songbo_val;
    });
    if (!songbo_valid) return;

    const songbo_ret = songbo_editing_id
        ? await songbo_rest_write("PATCH", songbo_entity, `id=eq.${songbo_editing_id}`, songbo_body)
        : await songbo_rest_write("POST", songbo_entity, "", songbo_body);

    if (songbo_ret.ok) {
        songbo_toast(songbo_editing_id ? "修改成功" : "新增成功");
        document.getElementById("songbo_admin_mask").classList.remove("songbo_show");
        songbo_load_rows();   // 重新拉取列表
    } else if (songbo_ret.status === 401 || songbo_ret.status === 403) {
        songbo_toast("登录状态失效（401），请重新登录");
        songbo_logout();
        setTimeout(() => location.href = "login.html?from=admin.html", 900);
    } else {
        songbo_toast("保存失败：" + (songbo_ret.data?.message || `HTTP ${songbo_ret.status}`));
    }
}

/* ---------- 6. 删除（二次确认 + DELETE，携带 JWT） ---------- */
async function songbo_delete_row(songbo_id) {
    if (!confirm(`确定删除 ${SONGBO_ENTITIES[songbo_entity].label} id=${songbo_id} 吗？删除后不可恢复！`)) return;
    const songbo_ret = await songbo_rest_write("DELETE", songbo_entity, `id=eq.${songbo_id}`);
    if (songbo_ret.ok) {
        // 级联清理：删新闻时本地收藏同步移除
        if (songbo_entity === "news") {
            const songbo_arr = songbo_fav.list().filter(x => x !== songbo_id);
            localStorage.setItem("songbo_favs", JSON.stringify(songbo_arr));
        }
        songbo_toast("删除成功");
        songbo_load_rows();
    } else if (songbo_ret.status === 401 || songbo_ret.status === 403) {
        songbo_toast("登录状态失效（401），请重新登录");
        songbo_logout();
        setTimeout(() => location.href = "login.html?from=admin.html", 900);
    } else {
        songbo_toast("删除失败：" + (songbo_ret.data?.message || `HTTP ${songbo_ret.status}`));
    }
}

/* ---------- 启动 ---------- */
songbo_bind_tabs();
document.getElementById("songbo_admin_kw").addEventListener("input", () => { songbo_page_no = 1; songbo_render_table(); });
document.getElementById("songbo_btn_add").addEventListener("click", () => songbo_open_modal(null));
document.getElementById("songbo_admin_close").addEventListener("click", () => document.getElementById("songbo_admin_mask").classList.remove("songbo_show"));
document.getElementById("songbo_admin_cancel").addEventListener("click", () => document.getElementById("songbo_admin_mask").classList.remove("songbo_show"));
document.getElementById("songbo_admin_save").addEventListener("click", songbo_save_row);
// 点遮罩空白处关闭
document.getElementById("songbo_admin_mask").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("songbo_show");
});
songbo_load_rows();
