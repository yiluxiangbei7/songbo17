/**
 * 文件名: songbo_login.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 登录页——邮箱/密码正则校验（JS效果：表单校验）→ 调 Supabase Auth
 *           密码授权登录（密码 bcrypt 加密存储在云端，高阶功能项）→ 登录态
 *           token 存 localStorage 保持 → 按 ?from= 参数回跳来源页（如后台）。
 */

/* 支持 ?from=admin.html / ?from=detail.html%3Fid%3D3 等 */
const songbo_from = new URLSearchParams(location.search).get("from") || "index.html";

/* 表单校验 */
function songbo_check_login_form() {
    let songbo_ok = true;
    const songbo_email = document.getElementById("songbo_email").value.trim();
    const songbo_pwd = document.getElementById("songbo_pwd").value;
    document.getElementById("songbo_email_err").textContent =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(songbo_email) ? "" : "邮箱格式不正确";
    document.getElementById("songbo_pwd_err").textContent =
        songbo_pwd.length >= 6 ? "" : "密码至少 6 位";
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(songbo_email) || songbo_pwd.length < 6) songbo_ok = false;
    return songbo_ok;
}

async function songbo_do_login() {
    if (!songbo_check_login_form()) return;
    const songbo_btn = document.getElementById("songbo_login_btn");
    songbo_btn.disabled = true; songbo_btn.textContent = "登录中…";

    const songbo_res = await songbo_login(
        document.getElementById("songbo_email").value.trim(),
        document.getElementById("songbo_pwd").value
    );

    songbo_btn.disabled = false; songbo_btn.textContent = "登 录";
    if (songbo_res.ok) {
        songbo_toast("登录成功，正在跳转…");
        setTimeout(() => location.href = songbo_from, 800);
    } else {
        songbo_toast(songbo_res.msg, 3000);
    }
}

document.getElementById("songbo_login_btn").addEventListener("click", songbo_do_login);
/* 回车键提交（键盘交互） */
document.addEventListener("keydown", e => { if (e.key === "Enter") songbo_do_login(); });
