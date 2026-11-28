/**
 * 文件名: songbo_index.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 首页脚本——轮播图（自动播放+圆点+箭头+悬停暂停）、分类导航渲染、
 *           爆款/新品商品渲染、卡片快捷加购、canvas 粒子连线背景动画。
 */

/* ---------- 1. 轮播图（JS效果①） ---------- */
const songbo_banner = document.getElementById("songbo_banner");
const songbo_blist = document.getElementById("songbo_banner_list");
const songbo_dots = document.getElementById("songbo_banner_dots");
let songbo_idx = 0;
const songbo_total = songbo_blist.children.length;

for (let i = 0; i < songbo_total; i++) {
    const d = document.createElement("span");
    if (i === 0) d.classList.add("songbo_active");
    d.addEventListener("click", () => songbo_slide(i));
    songbo_dots.appendChild(d);
}

function songbo_slide(i) {
    songbo_idx = (i + songbo_total) % songbo_total;
    songbo_blist.style.transform = `translateX(-${songbo_idx * 100}%)`;
    songbo_dots.querySelectorAll("span").forEach((d, k) => {
        d.classList.toggle("songbo_active", k === songbo_idx);
    });
}

let songbo_timer = setInterval(() => songbo_slide(songbo_idx + 1), 4000);
songbo_banner.addEventListener("mouseenter", () => clearInterval(songbo_timer));
songbo_banner.addEventListener("mouseleave", () => {
    songbo_timer = setInterval(() => songbo_slide(songbo_idx + 1), 4000);
});
document.getElementById("songbo_banner_prev").addEventListener("click", () => songbo_slide(songbo_idx - 1));
document.getElementById("songbo_banner_next").addEventListener("click", () => songbo_slide(songbo_idx + 1));

/* ---------- 2. 商品卡片渲染（首页两处复用） ---------- */
function songbo_goods_card(p) {
    return `
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
                ${p.hot ? `<span class="songbo_tag songbo_tag_hot">爆款</span>` : `<span class="songbo_tag">新品</span>`}
                <button class="songbo_btn songbo_btn_ghost" style="padding:4px 14px;font-size:12px;margin-left:auto;"
                        onclick="songbo_quick_add(${p.id})">加入购物车</button>
            </div>
        </div>
    </div>`;
}

/* 快捷加购（先本地记录，缺详情时按列表内数据补齐） */
async function songbo_quick_add(id) {
    const hit = (window._songbo_cache || []).find(x => x.id === id);
    if (!hit) return;
    songbo_cart.add(hit, 1);
    songbo_toast(`已加入购物车：${hit.name}`);
}

/* ---------- 3. 拉取数据：分类 + 爆款 + 新品 ---------- */
(async function songbo_init_index() {
    const songbo_cats = await songbo_rest_get("categories", "select=*&order=sort.asc");
    document.getElementById("songbo_cat_grid").innerHTML = songbo_cats.length
        ? songbo_cats.map(c => `
            <a class="songbo_cat_item" href="list.html?cat=${c.id}">
                <img src="${c.icon || "images/songbo_logo.svg"}" alt="${c.name}">
                <p>${c.name}</p>
            </a>`).join("")
        : `<div class="songbo_loading">暂无分类数据</div>`;

    const songbo_all = await songbo_rest_get("products", "select=*&order=id.asc");
    window._songbo_cache = songbo_all;                       // 供快捷加购
    const songbo_hot = songbo_all.filter(p => p.hot).slice(0, 8);
    const songbo_new = [...songbo_all].reverse().slice(0, 4);
    document.getElementById("songbo_hot_grid").innerHTML = songbo_hot.map(songbo_goods_card).join("");
    document.getElementById("songbo_new_grid").innerHTML = songbo_new.map(songbo_goods_card).join("");
})();

/* ---------- 4. canvas 粒子连线背景（动画方式：canvas） ---------- */
(function songbo_particles() {
    const cv = document.getElementById("songbo_canvas");
    const ctx = cv.getContext("2d");
    let songbo_W, songbo_H, songbo_pts = [];

    function songbo_resize() {
        songbo_W = cv.width = window.innerWidth;
        songbo_H = cv.height = window.innerHeight;
    }
    songbo_resize();
    window.addEventListener("resize", songbo_resize);

    for (let i = 0; i < 46; i++) {
        songbo_pts.push({
            x: Math.random() * songbo_W, y: Math.random() * songbo_H,
            vx: (Math.random() - .5) * .55, vy: (Math.random() - .5) * .55, r: Math.random() * 1.8 + 1
        });
    }

    function songbo_draw() {
        ctx.clearRect(0, 0, songbo_W, songbo_H);
        for (const p of songbo_pts) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > songbo_W) p.vx *= -1;
            if (p.y < 0 || p.y > songbo_H) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,103,0,.35)";
            ctx.fill();
        }
        for (let i = 0; i < songbo_pts.length; i++) {
            for (let j = i + 1; j < songbo_pts.length; j++) {
                const a = songbo_pts[i], b = songbo_pts[j];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(255,103,0,${(1 - dist / 130) * .18})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(songbo_draw);
    }
    songbo_draw();
})();
