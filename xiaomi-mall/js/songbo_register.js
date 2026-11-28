/**
 * 文件名: songbo_register.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 注册页——邮箱格式/密码强度/两次一致 三重正则校验 → Supabase
 *           Auth signup 注册（密码自动 bcrypt 加密存储，高阶功能项）→
 *           注册成功自动登录 → 跳转首页。
 */

function songbo_check_reg_form() {
    let songbo_ok = true;
    const songbo_email = document.getElementById("songbo_reg_email").value.trim();
    const songbo_pwd = document.getElementById("songbo_reg_pwd").value;
    const songbo_pwd2 = document.getElementById("songbo_reg_pwd2").value;

    document.getElementById("songbo_reg_email_err").textContent =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(songbo_email) ? "" : "邮箱格式不正确";
    document.getElementById("songbo_reg_pwd_err").textContent =
        (songbo_pwd.length >= 6 && /[A-Za-z]/.test(songbo_pwd)) ? "" : "密码需至少 6 位且包含字母";
    document.getElementById("songbo_reg_pwd2_err").textContent =
        songbo_pwd === songbo_pwd2 ? "" : "两次输入的密码不一致";

    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(songbo_email)) songbo_ok = false;
    if (!(songbo_pwd.length >= 6 && /[A-Za-z]/.test(songbo_pwd))) songbo_ok = false;
    if (songbo_pwd !== songbo_pwd2) songbo_ok = false;
    return songbo_ok;
}

document.getElementById("songbo_reg_btn").addEventListener("click", async () => {
    if (!songbo_check_reg_form()) return;
    const songbo_btn = document.getElementById("songbo_reg_btn");
    songbo_btn.disabled = true; songbo_btn.textContent = "注册中…";

    const songbo_res = await songbo_register(
        document.getElementById("songbo_reg_email").value.trim(),
        document.getElementById("songbo_reg_pwd").value
    );

    songbo_btn.disabled = false; songbo_btn.textContent = "注 册";
    if (songbo_res.ok) {
        songbo_toast("注册成功，已自动登录！");
        setTimeout(() => location.href = "index.html", 800);
    } else {
        songbo_toast(songbo_res.msg, 3000);
    }
});
