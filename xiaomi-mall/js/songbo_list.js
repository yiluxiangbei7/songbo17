/**
 * 文件名: songbo_list.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 商品列表页——URL 传参（?cat=分类id 初始筛选）、分类 tab 切换、
 *           价格区间过滤、排序、关键词模糊过滤、客户端分页（每页 8 条）。
 */

const songbo_PAGE_SIZE = 8;
let songbo_all = [];            // 全部商品缓存
let songbo_view = [];           // 当前筛选结果
let songbo_page = 1;
let songbo_cat = 0;             // 当前分类
let songbo_cats_map = {};       // 分类 id -> 名称

/* ---------- 1. URL 传参（与首页分类导航联动） ---------- */
const songbo_params = new URLSearchParams(location.search);
if (songbo_params.get("cat")) songbo_cat = Number(songbo_params.get("cat"));
const songbo_url_kw = songbo_params.get("q") || "";
if (songbo_url_kw) document.getElementById("songbo_kw_input").value = songbo_url_kw;

/* ---------- 2. 拉取分类与商品，初始化 tab ---------- */
(async function songbo_init_list() {
    const songbo_cats = await songbo_rest_get("categories", "select=*&order=sort.asc");
    songbo_cats.forEach(c => songbo_cats_map[c.id] = c.name);
    const songbo_chips = document.getElementById("songbo_cat_chips");
    songbo_chips.innerHTML = `<span class="songbo_chip ${songbo_cat === 0 ? "songbo_active" : ""}" data-cat="0">全部</span>` +
        songbo_cats.map(c => `<span class="songbo_chip ${c.id === songbo_cat ? "songbo_active" : ""}" data-cat="${c.id}">${c.name}</span>`).join("");

    songbo_chips.querySelectorAll(".songbo_chip").forEach(chip => {
        chip.addEventListener("click", () => {
            songbo_cat = Number(chip.dataset.cat);
            songbo_chips.querySelectorAll(".songbo_chip").forEach(x => x.classList.remove("songbo_active"));
            chip.classList.add("songbo_active");
            songbo_page = 1;
            songbo_apply();
        });
    });

    songbo_all = await songbo_rest_get("products", "select=*&order=id.asc");
    songbo_apply();
})();

/* ---------- 3. 筛选 + 排序 + 分页渲染 ---------- */
function songbo_apply() {
    const songbo_price = document.getElementById("songbo_price_sel").value;
    const songbo_sort = document.getElementById("songbo_sort_sel").value;
    const songbo_kw = document.getElementById("songbo_kw_input").value.trim().toLowerCase();

    songbo_view = songbo_all.filter(p => {
        if (songbo_cat && p.category_id !== songbo_cat) return false;
        if (songbo_price) {
            const [lo, hi] = songbo_price.split("-").map(Number);
            if (p.price < lo || p.price > hi) return false;
        }
        if (songbo_kw) {
            const hay = (p.name + " " + (p.brief || "") + " " + (songbo_cats_map[p.category_id] || "")).toLowerCase();
            if (!hay.includes(songbo_kw)) return false;
        }
        return true;
    });

    if (songbo_sort === "price_asc") songbo_view.sort((a, b) => a.price - b.price);
    if (songbo_sort === "price_desc") songbo_view.sort((a, b) => b.price - a.price);
    if (songbo_sort === "sales_desc") songbo_view.sort((a, b) => b.sales - a.sales);

    songbo_render();
}

/* ---------- 4. 渲染当前页 ---------- */
function songbo_render() {
    const songbo_pages = Math.max(1, Math.ceil(songbo_view.length / songbo_PAGE_SIZE));
    if (songbo_page > songbo_pages) songbo_page = songbo_pages;
    const songbo_slice = songbo_view.slice((songbo_page - 1) * songbo_PAGE_SIZE, songbo_page * songbo_PAGE_SIZE);

    document.getElementById("songbo_list_grid").innerHTML = songbo_slice.length ? songbo_slice.map(p => `
        <div class="songbo_card">
            <a href="detail.html?id=${p.id}" class="songbo_thumb"><img src="${p.cover}" alt="${p.name}"></a>
            <div class="songbo_card_body">
                <h3><a href="detail.html?id=${p.id}">${p.name}</a></h3>
                <p class="songbo_brief">${p.brief || ""}</p>
                <div class="songbo_price_row">
                    <span class="songbo_price">${p.price}</span>
                    ${p.old_price ? `<span class="songbo_old_price">¥${p.old_price}</span>` : ""}
                </div>
                <div class="songbo_tags">
                    <span class="songbo_tag">${songbo_cats_map[p.category_id] || "商品"}</span>
                    ${p.hot ? `<span class="songbo_tag songbo_tag_hot">爆款</span>` : ""}
                    <span class="songbo_tag">已售 ${p.sales}</span>
                </div>
            </div>
        </div>`).join("")
        : `<div class="songbo_empty" style="grid-column:1/-1;">没有符合条件的商品，换个筛选试试～</div>`;

    /* 分页按钮 */
    const pager = document.getElementById("songbo_pager");
    let html = `<button ${songbo_page === 1 ? "disabled" : ""} data-go="${songbo_page - 1}">‹</button>`;
    for (let i = 1; i <= songbo_pages; i++) {
        html += `<button class="${i === songbo_page ? "songbo_active" : ""}" data-go="${i}">${i}</button>`;
    }
    html += `<button ${songbo_page === songbo_pages ? "disabled" : ""} data-go="${songbo_page + 1}">›</button>`;
    pager.innerHTML = html;
    pager.querySelectorAll("button").forEach(b => {
        b.addEventListener("click", () => { songbo_page = Number(b.dataset.go); songbo_render(); });
    });
}

/* ---------- 5. 工具条事件（JS效果：过滤/排序联动） ---------- */
document.getElementById("songbo_price_sel").addEventListener("change", () => { songbo_page = 1; songbo_apply(); });
document.getElementById("songbo_sort_sel").addEventListener("change", () => { songbo_page = 1; songbo_apply(); });
document.getElementById("songbo_kw_input").addEventListener("input", () => { songbo_page = 1; songbo_apply(); });
