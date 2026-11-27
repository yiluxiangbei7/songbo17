/**
 * 文件名: songbo_login.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 登录页逻辑——正则校验邮箱格式与密码长度（submit 校验，JS效果⑤），
 *           调用 songbo_login()（Supabase Auth，密码加密存储在数据库侧），
 *           成功后按 ?from= 参数回跳（如后台页登录后直接返回 admin.html）。
 */

/* ---------- 1. 正则校验 ---------- */
function songbo_check_email() {
    const songbo_val = document.getElementById("songbo_email").value.trim();
    const songbo_ok = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(songbo_val);
    const songbo_msg = document.getElementById("songbo_email_msg");
    songbo_msg.textContent = songbo_val === "" ? "" : (songbo_ok ? "" : "邮箱格式不正确");
    document.getElementById("songbo_email").classList.toggle("songbo_err", songbo_val !== "" && !songbo_ok);
    return songbo_ok;
}

function songbo_check_pwd() {
    const songbo_val = document.getElementById("songbo_pwd").value;
    const songbo_ok = songbo_val.length >= 6;
    const songbo_msg = document.getElementById("songbo_pwd_msg");
    songbo_msg.textContent = songbo_val === "" ? "" : (songbo_ok ? "" : "密码长度至少 6 位");
    document.getElementById("songbo_pwd").classList.toggle("songbo_err", songbo_val !== "" && !songbo_ok);
    return songbo_ok;
}

/* ---------- 2. 提交登录 ---------- */
async function songbo_submit() {
    const songbo_tip = document.getElementById("songbo_tip");
    if (!songbo_check_email() || !songbo_check_pwd()) {
        songbo_tip.textContent = "请先修正表单中标红的错误";
        songbo_tip.className = "songbo_form_tip songbo_bad";
        return;
    }
    const songbo_email = document.getElementById("songbo_email").value.trim();
    const songbo_pwd = document.getElementById("songbo_pwd").value;

    document.getElementById("songbo_btn_login").disabled = true;
    songbo_tip.textContent = "正在登录…";
    songbo_tip.className = "songbo_form_tip";

    const songbo_ret = await songbo_login(songbo_email, songbo_pwd);
    document.getElementById("songbo_btn_login").disabled = false;

    if (songbo_ret.ok) {
        songbo_tip.textContent = "登录成功，正在跳转…";
        songbo_tip.className = "songbo_form_tip songbo_ok";
        songbo_toast("登录成功");
        // 支持 ?from=admin.html 登录后直接回跳后台
        const songbo_from = new URLSearchParams(location.search).get("from");
        setTimeout(() => location.href = songbo_from || "index.html", 800);
    } else {
        songbo_tip.textContent = songbo_ret.msg;
        songbo_tip.className = "songbo_form_tip songbo_bad";
    }
}

/* ---------- 启动：输入即校验，失焦再校验 ---------- */
document.getElementById("songbo_email").addEventListener("blur", songbo_check_email);
document.getElementById("songbo_pwd").addEventListener("blur", songbo_check_pwd);
document.getElementById("songbo_btn_login").addEventListener("click", songbo_submit);
