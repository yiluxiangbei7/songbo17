/**
 * 文件名: songbo_detail.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 商品详情页——URLSearchParams 解析 ?id= 传参（评分项）加载对应商品；
 *           加入购物车（localStorage）；立即购买（未登录拦截 + 表单校验 +
 *           POST orders 下单 + PATCH 扣库存）；AI 选购助手（调用本地 Express
 *           中间层 → DeepSeek，后端未启动时优雅降级提示）。
 */

/* ---------- 1. URL 传参加载商品 ---------- */
const songbo_id = Number(new URLSearchParams(location.search).get("id"));
let songbo_goods = null;

(async function songbo_init_detail() {
    if (!songbo_id) {
        document.getElementById("songbo_detail_box").innerHTML =
            `<div class="songbo_empty" style="grid-column:1/-1;">参数错误：缺少商品 id（正确格式 detail.html?id=1）</div>`;
        return;
    }
    const songbo_arr = await songbo_rest_get("products", `select=*&id=eq.${songbo_id}`);
    songbo_goods = songbo_arr[0];
    if (!songbo_goods) {
        document.getElementById("songbo_detail_box").innerHTML =
            `<div class="songbo_empty" style="grid-column:1/-1;">商品不存在（id=${songbo_id}）</div>`;
        return;
    }
    await songbo_render_detail();
})();

/* ---------- 2. 渲染详情 ---------- */
async function songbo_render_detail() {
    const songbo_cats = await songbo_rest_get("categories", `select=name&id=eq.${songbo_goods.category_id}`);
    const songbo_cat_name = songbo_cats[0]?.name || "商品";
    document.getElementById("songbo_detail_box").innerHTML = `
        <div class="songbo_detail_img"><img src="${songbo_goods.cover}" alt="${songbo_goods.name}"></div>
        <div class="songbo_detail_info">
            <h1>${songbo_goods.name}</h1>
            <p class="songbo_brief">${songbo_goods.brief || ""}</p>
            <div class="songbo_price_box">
                <span class="songbo_price">${songbo_goods.price}</span>
                ${songbo_goods.old_price ? `<span class="songbo_old_price">¥${songbo_goods.old_price}</span>` : ""}
                <span style="margin-left:20px;color:#999;font-size:12px;">已售 ${songbo_goods.sales} ｜ 库存 ${songbo_goods.stock}</span>
            </div>
            <table class="songbo_spec_table">
                <tr><td>品牌</td><td>小米 / Redmi</td></tr>
                <tr><td>分类</td><td>${songbo_cat_name}</td></tr>
                <tr><td>型号</td><td>${songbo_goods.name}</td></tr>
                <tr><td>服务</td><td>全国联保 · 7 天无理由退货 · 顺丰包邮</td></tr>
            </table>
            <button class="songbo_btn songbo_btn_ghost" id="songbo_add_cart">加入购物车</button>
            <button class="songbo_btn" id="songbo_buy_now">立即购买</button>
        </div>`;
    document.getElementById("songbo_add_cart").addEventListener("click", () => {
        songbo_cart.add(songbo_goods, 1);
        songbo_toast(`已加入购物车：${songbo_goods.name}`);
    });
    document.getElementById("songbo_buy_now").addEventListener("click", songbo_open_buy);
}

/* ---------- 3. 立即购买：未登录拦截（评分项） ---------- */
function songbo_open_buy() {
    if (!songbo_is_login()) {
        alert("下单前请先登录！");
        location.href = "login.html?from=" + encodeURIComponent(`detail.html?id=${songbo_id}`);
        return;
    }
    document.getElementById("songbo_buy_name").value = songbo_goods.name;
    document.getElementById("songbo_buy_qty").value = 1;
    document.getElementById("songbo_buy_mask").classList.add("songbo_show");
}
document.getElementById("songbo_buy_cancel").addEventListener("click", () => {
    document.getElementById("songbo_buy_mask").classList.remove("songbo_show");
});
document.getElementById("songbo_buy_mask").addEventListener("click", e => {
    if (e.target.id === "songbo_buy_mask") e.target.classList.remove("songbo_show");
});

/* ---------- 4. 提交订单：正则校验 + POST orders + PATCH 扣库存 ---------- */
document.getElementById("songbo_buy_ok").addEventListener("click", async () => {
    const songbo_qty = Math.max(1, Number(document.getElementById("songbo_buy_qty").value) || 1);
    const songbo_receiver = document.getElementById("songbo_buy_receiver").value.trim();
    const songbo_phone = document.getElementById("songbo_buy_phone").value.trim();
    const songbo_address = document.getElementById("songbo_buy_address").value.trim();

    /* 表单正则校验（JS效果：表单校验） */
    let songbo_ok = true;
    const songbo_set_err = (id, msg) => { document.getElementById(id).textContent = msg; if (msg) songbo_ok = false; };
    songbo_set_err("songbo_buy_receiver_err", songbo_receiver ? "" : "收货人不能为空");
    songbo_set_err("songbo_buy_phone_err", /^1[3-9]\d{9}$/.test(songbo_phone) ? "" : "手机号格式不正确");
    songbo_set_err("songbo_buy_address_err", songbo_address ? "" : "收货地址不能为空");
    if (!songbo_ok) return;
    if (songbo_qty > songbo_goods.stock) { songbo_toast(`库存不足，仅剩 ${songbo_goods.stock} 件`); return; }

    const songbo_user = songbo_current_user();
    const songbo_btn = document.getElementById("songbo_buy_ok");
    songbo_btn.disabled = true;

    /* POST /rest/v1/orders —— 登录态 JWT 放行（RLS） */
    const songbo_res = await songbo_rest_write("POST", "orders", "", {
        product_name: songbo_goods.name,
        qty: songbo_qty,
        total: +(songbo_goods.price * songbo_qty).toFixed(2),
        status: "已支付",
        receiver: songbo_receiver,
        phone: songbo_phone,
        address: songbo_address,
        user_id: songbo_user.id,
        user_email: songbo_user.email
    });

    if (songbo_res.ok) {
        /* PATCH 扣库存 + 累加销量 */
        await songbo_rest_write("PATCH", "products", `id=eq.${songbo_goods.id}`, {
            stock: songbo_goods.stock - songbo_qty,
            sales: songbo_goods.sales + songbo_qty
        });
        document.getElementById("songbo_buy_mask").classList.remove("songbo_show");
        songbo_toast("下单成功！可在「我的」查看订单");
        songbo_goods.stock -= songbo_qty;
        songbo_render_detail();
    } else {
        songbo_toast("下单失败：" + (songbo_res.data?.message || `HTTP ${songbo_res.status}`), 3000);
    }
    songbo_btn.disabled = false;
});

/* ---------- 5. AI 选购助手（Express 中间层 → DeepSeek） ---------- */
document.getElementById("songbo_ai_btn").addEventListener("click", async () => {
    const songbo_budget = document.getElementById("songbo_ai_budget").value.trim();
    const songbo_usage = document.getElementById("songbo_ai_usage").value.trim();
    const songbo_out = document.getElementById("songbo_ai_out");
    if (!songbo_budget || !songbo_usage) { songbo_toast("请填写预算和用途"); return; }

    songbo_out.textContent = "AI 思考中…";
    console.log("%c[SONGBO请求] POST localhost:3007/api/ai/advice", "color:#ff6700;font-weight:bold", { budget: songbo_budget, usage: songbo_usage });
    try {
        const songbo_resp = await fetch(SONGBO_AI_BASE + "/api/ai/advice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ budget: songbo_budget, usage: songbo_usage })
        });
        const songbo_data = await songbo_resp.json();
        console.log("%c[SONGBO响应] AI advice", "color:#00a854;font-weight:bold", songbo_data);
        songbo_out.textContent = songbo_data.code === 0 ? songbo_data.data : ("AI 返回异常：" + songbo_data.msg);
    } catch (songbo_err) {
        console.error("[SONGBO网络错误] AI advice", songbo_err);
        songbo_out.textContent = "AI 助手服务未启动（backend-llm）。请先运行：cd backend-llm && node server.js";
    }
});
