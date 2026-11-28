/**
 * 文件名: songbo_profile.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 个人中心——展示登录用户信息；"我的订单"按 user_id 过滤查询
 *           （RLS 行级隔离：每个用户只能看到自己的订单）；待支付/已支付订单
 *           可取消（PATCH status=已取消）。
 */

/* 未登录直接拦截到登录页 */
if (!songbo_is_login()) {
    location.href = "login.html?from=profile.html";
}

/* ---------- 1. 用户信息 ---------- */
const songbo_me = songbo_current_user();
if (songbo_me) {
    document.getElementById("songbo_user_nick").textContent =
        (songbo_me.email || "用户").split("@")[0];
    document.getElementById("songbo_user_mail").textContent = songbo_me.email || "";
}

/* ---------- 2. 我的订单（RLS 隔离查询） ---------- */
async function songbo_load_orders() {
    const songbo_me2 = songbo_current_user();
    if (!songbo_me2) return;
    /* GET /rest/v1/orders?user_id=eq.{uid} —— 数据库 RLS 保证只能读自己的 */
    const songbo_arr = await songbo_rest_get("orders", `select=*&user_id=eq.${songbo_me2.id}&order=id.desc`);

    const songbo_box = document.getElementById("songbo_orders_box");
    if (!songbo_arr.length) {
        songbo_box.innerHTML = `<div class="songbo_empty" style="padding:36px;">
            还没有订单，<a href="list.html" style="color:#ff6700;">去逛逛 ›</a></div>`;
        return;
    }
    const songbo_cls = s => ({ "已支付": "songbo_paid", "待发货": "songbo_wait", "已发货": "songbo_done", "已完成": "songbo_done", "已取消": "songbo_cancel" }[s] || "songbo_paid");
    songbo_box.innerHTML = `
        <table class="songbo_table">
            <tr><th>订单号</th><th>商品</th><th>数量</th><th>金额</th><th>收货人</th><th>状态</th><th>操作</th></tr>
            ${songbo_arr.map(o => `
            <tr>
                <td>#${String(o.id).padStart(6, "0")}</td>
                <td style="text-align:left;">${o.product_name}</td>
                <td>×${o.qty}</td>
                <td style="color:#ff6700;font-weight:bold;">¥${o.total}</td>
                <td>${o.receiver}</td>
                <td><span class="songbo_status ${songbo_cls(o.status)}">${o.status}</span></td>
                <td>${(o.status === "已支付" || o.status === "待发货")
                    ? `<button class="songbo_op_btn songbo_del" data-oid="${o.id}">取消订单</button>`
                    : "—"}</td>
            </tr>`).join("")}
        </table>`;

    /* 取消订单（PATCH /rest/v1/orders?id=eq.N） */
    songbo_box.querySelectorAll("[data-oid]").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("确定取消该订单吗？")) return;
            const songbo_res = await songbo_rest_write("PATCH", "orders", `id=eq.${btn.dataset.oid}`, { status: "已取消" });
            if (songbo_res.ok) { songbo_toast("订单已取消"); songbo_load_orders(); }
            else songbo_toast("取消失败：" + (songbo_res.data?.message || `HTTP ${songbo_res.status}`), 3000);
        });
    });
}
songbo_load_orders();
