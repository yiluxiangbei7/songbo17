/**
 * 文件名: songbo_cart.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 购物车页——localStorage 渲染购物车（数量增减/删除/清空/合计）、
 *           去结算（未登录拦截 + 表单校验）→ 逐商品 POST orders 下单 +
 *           PATCH 扣库存 → 清空购物车跳转个人中心。
 */

/* ---------- 1. 渲染购物车（JS效果：本地存储数据驱动） ---------- */
function songbo_render_cart() {
    const songbo_arr = songbo_cart.list();
    const songbo_box = document.getElementById("songbo_cart_box");
    const songbo_foot = document.getElementById("songbo_cart_foot");

    if (!songbo_arr.length) {
        songbo_box.innerHTML = `<div class="songbo_empty">
            <img src="images/songbo_logo.svg" alt="空购物车">
            购物车还是空的，<a href="list.html" style="color:#ff6700;">去逛逛 ›</a>
        </div>`;
        songbo_foot.style.display = "none";
        return;
    }

    const songbo_total = songbo_arr.reduce((n, g) => n + g.price * g.qty, 0);
    const songbo_count = songbo_arr.reduce((n, g) => n + g.qty, 0);

    songbo_box.innerHTML = `
        <table class="songbo_cart_table">
            <tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th><th>操作</th></tr>
            ${songbo_arr.map(g => `
            <tr>
                <td style="display:flex;align-items:center;gap:12px;text-align:left;">
                    <img src="${g.cover}" alt="${g.name}">
                    <a href="detail.html?id=${g.id}" style="text-align:left;">${g.name}</a>
                </td>
                <td>¥${g.price}</td>
                <td>
                    <span class="songbo_qty">
                        <button data-act="minus" data-id="${g.id}">-</button>
                        <input value="${g.qty}" data-id="${g.id}" data-act="qty">
                        <button data-act="plus" data-id="${g.id}">+</button>
                    </span>
                </td>
                <td style="color:#ff6700;font-weight:bold;">¥${(g.price * g.qty).toFixed(2)}</td>
                <td><button class="songbo_link_danger" data-act="del" data-id="${g.id}">删除</button></td>
            </tr>`).join("")}
        </table>`;
    document.getElementById("songbo_cart_total").textContent = songbo_total.toFixed(2);
    document.getElementById("songbo_cart_total_count").textContent = songbo_count;
    songbo_foot.style.display = "flex";

    /* 事件绑定（委托） */
    songbo_box.querySelectorAll("[data-act]").forEach(el => {
        el.addEventListener("click", () => {
            const songbo_id = el.dataset.id;
            const songbo_hit = songbo_cart.list().find(x => x.id === Number(songbo_id));
            if (el.dataset.act === "plus") songbo_cart.setQty(songbo_id, songbo_hit.qty + 1);
            if (el.dataset.act === "minus") songbo_cart.setQty(songbo_id, songbo_hit.qty - 1);
            if (el.dataset.act === "del") { songbo_cart.remove(songbo_id); songbo_toast("已从购物车移除"); }
            songbo_render_cart();
        });
    });
    songbo_box.querySelectorAll("[data-act='qty']").forEach(el => {
        el.addEventListener("change", () => { songbo_cart.setQty(el.dataset.id, el.value); songbo_render_cart(); });
    });
}
songbo_render_cart();

/* ---------- 2. 清空 ---------- */
document.getElementById("songbo_cart_clear").addEventListener("click", () => {
    songbo_cart.clear();
    songbo_toast("购物车已清空");
    songbo_render_cart();
});

/* ---------- 3. 去结算：未登录拦截（评分项） ---------- */
document.getElementById("songbo_cart_checkout").addEventListener("click", () => {
    if (!songbo_cart.list().length) { songbo_toast("购物车是空的"); return; }
    if (!songbo_is_login()) {
        alert("结算前请先登录！");
        location.href = "login.html?from=cart.html";
        return;
    }
    document.getElementById("songbo_checkout_mask").classList.add("songbo_show");
});
document.getElementById("songbo_co_cancel").addEventListener("click", () => {
    document.getElementById("songbo_checkout_mask").classList.remove("songbo_show");
});
document.getElementById("songbo_checkout_mask").addEventListener("click", e => {
    if (e.target.id === "songbo_checkout_mask") e.target.classList.remove("songbo_show");
});

/* ---------- 4. 提交结算订单 ---------- */
document.getElementById("songbo_co_ok").addEventListener("click", async () => {
    const songbo_receiver = document.getElementById("songbo_co_receiver").value.trim();
    const songbo_phone = document.getElementById("songbo_co_phone").value.trim();
    const songbo_address = document.getElementById("songbo_co_address").value.trim();

    let songbo_ok = true;
    const songbo_set_err = (id, msg) => { document.getElementById(id).textContent = msg; if (msg) songbo_ok = false; };
    songbo_set_err("songbo_co_receiver_err", songbo_receiver ? "" : "收货人不能为空");
    songbo_set_err("songbo_co_phone_err", /^1[3-9]\d{9}$/.test(songbo_phone) ? "" : "手机号格式不正确");
    songbo_set_err("songbo_co_address_err", songbo_address ? "" : "收货地址不能为空");
    if (!songbo_ok) return;

    const songbo_user = songbo_current_user();
    const songbo_btn = document.getElementById("songbo_co_ok");
    songbo_btn.disabled = true;

    /* 逐商品下单 + 扣库存 */
    const songbo_items = songbo_cart.list();
    for (const g of songbo_items) {
        const songbo_res = await songbo_rest_write("POST", "orders", "", {
            product_name: g.name, qty: g.qty,
            total: +(g.price * g.qty).toFixed(2),
            status: "已支付", receiver: songbo_receiver, phone: songbo_phone,
            address: songbo_address, user_id: songbo_user.id, user_email: songbo_user.email
        });
        if (songbo_res.ok) {
            const songbo_cur = await songbo_rest_get("products", `select=stock,sales&id=eq.${g.id}`);
            if (songbo_cur[0]) {
                await songbo_rest_write("PATCH", "products", `id=eq.${g.id}`, {
                    stock: Math.max(0, songbo_cur[0].stock - g.qty),
                    sales: songbo_cur[0].sales + g.qty
                });
            }
        }
    }

    songbo_cart.clear();
    document.getElementById("songbo_checkout_mask").classList.remove("songbo_show");
    songbo_toast("结算成功！正在跳转我的订单…");
    setTimeout(() => location.href = "profile.html", 1200);
});
