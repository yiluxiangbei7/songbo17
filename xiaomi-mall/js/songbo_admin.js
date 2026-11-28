/**
 * 文件名: songbo_admin.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 后台管理页——页面守卫拦截未登录；商品/分类/订单三实体
 *           增删改查（POST/PATCH/DELETE 走 Supabase REST，JWT 放行）+
 *           关键词搜索 + 客户端分页；动态表单弹窗复用一套编辑逻辑。
 */

/* 页面守卫：未登录跳转登录页（评分项：拦截） */
if (songbo_require_login()) songbo_init_admin();

const songbo_A_PAGE_SIZE = 8;
let songbo_a_tab = "products";
let songbo_a_page = 1;
let songbo_a_data = [];          // 当前实体全部数据
let songbo_a_editing = null;     // null=新增 / 对象=编辑

/* ---------- 实体配置：表头 / 渲染行 / 搜索字段 / 表单字段 ---------- */
const songbo_admin_cfg = {
    products: {
        title: "商品", headers: ["ID", "图片", "商品名", "分类", "价格", "库存", "销量", "爆款", "操作"],
        search: p => p.name.toLowerCase(),
        row: p => `<td>#${p.id}</td>
            <td><img src="${p.cover}" alt=""></td>
            <td style="text-align:left;">${p.name}</td>
            <td>${(window._songbo_admin_cats || {})[p.category_id] || p.category_id}</td>
            <td style="color:#ff6700;">¥${p.price}</td>
            <td>${p.stock}</td><td>${p.sales}</td>
            <td>${p.hot ? "🔥" : "—"}</td>`,
        form: [
            { key: "name", label: "商品名", type: "text" },
            { key: "category_id", label: "分类ID", type: "number" },
            { key: "price", label: "价格", type: "number" },
            { key: "old_price", label: "原价(可空)", type: "number" },
            { key: "stock", label: "库存", type: "number" },
            { key: "sales", label: "销量", type: "number" },
            { key: "cover", label: "图片路径", type: "text", ph: "images/songbo_p1.svg" },
            { key: "brief", label: "简介", type: "text" },
            { key: "hot", label: "是否爆款", type: "checkbox" }
        ]
    },
    categories: {
        title: "分类", headers: ["ID", "图标", "分类名", "排序", "操作"],
        search: c => c.name.toLowerCase(),
        row: c => `<td>#${c.id}</td><td><img src="${c.icon}" alt=""></td>
            <td style="text-align:left;">${c.name}</td><td>${c.sort}</td>`,
        form: [
            { key: "name", label: "分类名", type: "text" },
            { key: "icon", label: "图标路径", type: "text", ph: "images/songbo_cat_1.svg" },
            { key: "sort", label: "排序号", type: "number" }
        ]
    },
    orders: {
        title: "订单", headers: ["订单号", "商品", "数量", "金额", "收货人", "手机号", "状态", "操作"],
        search: o => (o.product_name + o.receiver + o.phone).toLowerCase(),
        row: o => `<td>#${String(o.id).padStart(6, "0")}</td>
            <td style="text-align:left;">${o.product_name}</td>
            <td>×${o.qty}</td><td style="color:#ff6700;">¥${o.total}</td>
            <td>${o.receiver}</td><td>${o.phone}</td>
            <td><span class="songbo_status ${o.status === "已取消" ? "songbo_cancel" : (o.status === "已完成" || o.status === "已发货" ? "songbo_done" : (o.status === "待发货" ? "songbo_wait" : "songbo_paid"))}">${o.status}</span></td>`,
        form: [
            { key: "product_name", label: "商品名", type: "text" },
            { key: "qty", label: "数量", type: "number" },
            { key: "total", label: "总金额", type: "number" },
            { key: "receiver", label: "收货人", type: "text" },
            { key: "phone", label: "手机号", type: "text" },
            { key: "address", label: "地址", type: "text" },
            { key: "status", label: "状态", type: "select", options: ["已支付", "待发货", "已发货", "已完成", "已取消"] }
        ]
    }
};

/* ---------- 1. 初始化 ---------- */
async function songbo_init_admin() {
    /* 分类映射（商品表用） */
    const songbo_cats = await songbo_rest_get("categories", "select=*&order=sort.asc");
    window._songbo_admin_cats = {};
    songbo_cats.forEach(c => window._songbo_admin_cats[c.id] = c.name);

    document.querySelectorAll(".songbo_admin_tabs button").forEach(b => {
        b.addEventListener("click", () => {
            songbo_a_tab = b.dataset.tab; songbo_a_page = 1;
            document.querySelectorAll(".songbo_admin_tabs button").forEach(x => x.classList.remove("songbo_active"));
            b.classList.add("songbo_active");
            songbo_load_entity();
        });
    });
    document.getElementById("songbo_admin_kw").addEventListener("input", () => { songbo_a_page = 1; songbo_render_admin(); });
    document.getElementById("songbo_admin_add").addEventListener("click", () => songbo_open_form(null));
    document.getElementById("songbo_admin_cancel").addEventListener("click", () => {
        document.getElementById("songbo_admin_mask").classList.remove("songbo_show");
    });
    document.getElementById("songbo_admin_save").addEventListener("click", songbo_save_entity);

    songbo_load_entity();
}

/* ---------- 2. 拉取当前实体数据 ---------- */
async function songbo_load_entity() {
    document.querySelector("#songbo_admin_table tbody").innerHTML =
        `<tr><td class="songbo_loading" colspan="8">加载中…</td></tr>`;
    songbo_a_data = await songbo_rest_get(songbo_a_tab, "select=*&order=id.asc");
    songbo_render_admin();
}

/* ---------- 3. 搜索 + 分页 + 渲染 ---------- */
function songbo_render_admin() {
    const songbo_cfg = songbo_admin_cfg[songbo_a_tab];
    const songbo_kw = document.getElementById("songbo_admin_kw").value.trim().toLowerCase();
    const songbo_rows = songbo_kw ? songbo_a_data.filter(x => songbo_cfg.search(x).includes(songbo_kw)) : songbo_a_data;

    const songbo_pages = Math.max(1, Math.ceil(songbo_rows.length / songbo_A_PAGE_SIZE));
    if (songbo_a_page > songbo_pages) songbo_a_page = songbo_pages;
    const songbo_slice = songbo_rows.slice((songbo_a_page - 1) * songbo_A_PAGE_SIZE, songbo_a_page * songbo_A_PAGE_SIZE);

    document.querySelector("#songbo_admin_table thead").innerHTML =
        `<tr>${songbo_cfg.headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
    document.querySelector("#songbo_admin_table tbody").innerHTML = songbo_slice.length
        ? songbo_slice.map(x => `<tr>${songbo_cfg.row(x)}
            <td><button class="songbo_op_btn" data-edit="${x.id}">编辑</button>
                <button class="songbo_op_btn songbo_del" data-del="${x.id}">删除</button></td></tr>`).join("")
        : `<tr><td colspan="9" class="songbo_loading">无匹配数据</td></tr>`;
    document.getElementById("songbo_admin_count").textContent =
        `共 ${songbo_rows.length} 条（第 ${songbo_a_page}/${songbo_pages} 页）`;

    /* 操作按钮 */
    document.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click",
        () => songbo_open_form(songbo_a_data.find(x => x.id === Number(b.dataset.edit)))));
    document.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
        if (!confirm("确认删除该" + songbo_cfg.title + "？此操作不可恢复！")) return;
        const songbo_res = await songbo_rest_write("DELETE", songbo_a_tab, `id=eq.${b.dataset.del}`, null);
        if (songbo_res.ok) { songbo_toast("删除成功"); songbo_load_entity(); }
        else songbo_toast("删除失败：" + (songbo_res.data?.message || `HTTP ${songbo_res.status}`), 3000);
    }));

    /* 分页 */
    const songbo_pager = document.getElementById("songbo_admin_pager");
    let songbo_html = `<button ${songbo_a_page === 1 ? "disabled" : ""} data-go="${songbo_a_page - 1}">‹</button>`;
    for (let i = 1; i <= songbo_pages; i++)
        songbo_html += `<button class="${i === songbo_a_page ? "songbo_active" : ""}" data-go="${i}">${i}</button>`;
    songbo_html += `<button ${songbo_a_page === songbo_pages ? "disabled" : ""} data-go="${songbo_a_page + 1}">›</button>`;
    songbo_pager.innerHTML = songbo_html;
    songbo_pager.querySelectorAll("button").forEach(b =>
        b.addEventListener("click", () => { songbo_a_page = Number(b.dataset.go); songbo_render_admin(); }));
}

/* ---------- 4. 动态表单弹窗（新增/编辑复用） ---------- */
function songbo_open_form(songbo_item) {
    const songbo_cfg = songbo_admin_cfg[songbo_a_tab];
    songbo_a_editing = songbo_item;
    document.getElementById("songbo_admin_modal_title").textContent =
        (songbo_item ? "编辑" : "新增") + songbo_cfg.title;

    document.getElementById("songbo_admin_form").innerHTML = songbo_cfg.form.map(f => `
        <div class="songbo_field">
            <label>${f.label}</label>
            ${f.type === "select"
                ? `<select id="songbo_f_${f.key}">${f.options.map(o =>
                    `<option ${songbo_item && songbo_item[f.key] === o ? "selected" : ""}>${o}</option>`).join("")}</select>`
                : f.type === "checkbox"
                    ? `<input type="checkbox" id="songbo_f_${f.key}" ${songbo_item && songbo_item[f.key] ? "checked" : ""} style="width:auto;">`
                    : `<input type="${f.type}" id="songbo_f_${f.key}" value="${songbo_item ? (songbo_item[f.key] ?? "") : ""}" placeholder="${f.ph || ""}">`}
        </div>`).join("");
    document.getElementById("songbo_admin_mask").classList.add("songbo_show");
}

/* ---------- 5. 保存（POST 新增 / PATCH 编辑） ---------- */
async function songbo_save_entity() {
    const songbo_cfg = songbo_admin_cfg[songbo_a_tab];
    const songbo_body = {};
    songbo_cfg.form.forEach(f => {
        const songbo_el = document.getElementById("songbo_f_" + f.key);
        if (f.type === "checkbox") songbo_body[f.key] = songbo_el.checked;
        else if (f.type === "number") {
            const songbo_v = songbo_el.value.trim();
            if (songbo_v !== "") songbo_body[f.key] = Number(songbo_v);
        } else {
            const songbo_v = songbo_el.value.trim();
            if (songbo_v !== "") songbo_body[f.key] = songbo_v;
        }
    });

    const songbo_res = songbo_a_editing
        ? await songbo_rest_write("PATCH", songbo_a_tab, `id=eq.${songbo_a_editing.id}`, songbo_body)
        : await songbo_rest_write("POST", songbo_a_tab, "", songbo_body);

    if (songbo_res.ok) {
        songbo_toast(songbo_a_editing ? "修改已保存" : "新增成功");
        document.getElementById("songbo_admin_mask").classList.remove("songbo_show");
        songbo_load_entity();
    } else {
        songbo_toast("保存失败：" + (songbo_res.data?.message || `HTTP ${songbo_res.status}`), 3000);
    }
}
