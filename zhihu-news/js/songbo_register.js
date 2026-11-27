/**
 * 文件名: songbo_register.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 注册页逻辑——邮箱正则、密码强度正则（6位以上且必须同时含字母和数字）、
 *           两次密码一致性校验（JS效果⑤表单校验），调用 songbo_register()
 *           （Supabase Auth 自动 bcrypt 加密存储，注册成功即自动登录）
 */

/* ---------- 1. 三项正则校验 ---------- */
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
    // 6 位以上且必须同时包含字母与数字
    const songbo_ok = songbo_val.length >= 6 && /[A-Za-z]/.test(songbo_val) && /\d/.test(songbo_val);
    const songbo_msg = document.getElementById("songbo_pwd_msg");
    songbo_msg.textContent = songbo_val === "" ? "" : (songbo_ok ? "" : "密码需 6 位以上且同时包含字母和数字");
    document.getElementById("songbo_pwd").classList.toggle("songbo_err", songbo_val !== "" && !songbo_ok);
    songbo_check_pwd2();   // 密码变化时联动校验确认框
    return songbo_ok;
}

function songbo_check_pwd2() {
    const songbo_val2 = document.getElementById("songbo_pwd2").value;
    const songbo_ok = songbo_val2 !== "" && songbo_val2 === document.getElementById("songbo_pwd").value;
    const songbo_msg = document.getElementById("songbo_pwd2_msg");
    songbo_msg.textContent = songbo_val2 === "" ? "" : (songbo_ok ? "" : "两次输入的密码不一致");
    document.getElementById("songbo_pwd2").classList.toggle("songbo_err", songbo_val2 !== "" && !songbo_ok);
    return songbo_ok;
}

/* ---------- 2. 提交注册 ---------- */
async function songbo_submit() {
    const songbo_tip = document.getElementById("songbo_tip");
    if (!songbo_check_email() || !songbo_check_pwd() || !songbo_check_pwd2()) {
        songbo_tip.textContent = "请先修正表单中标红的错误";
        songbo_tip.className = "songbo_form_tip songbo_bad";
        return;
    }
    const songbo_email = document.getElementById("songbo_email").value.trim();
    const songbo_pwd = document.getElementById("songbo_pwd").value;

    document.getElementById("songbo_btn_reg").disabled = true;
    songbo_tip.textContent = "正在注册…";
    songbo_tip.className = "songbo_form_tip";

    const songbo_ret = await songbo_register(songbo_email, songbo_pwd);
    document.getElementById("songbo_btn_reg").disabled = false;

    if (songbo_ret.ok) {
        songbo_tip.textContent = "注册成功，自动登录并跳转…";
        songbo_tip.className = "songbo_form_tip songbo_ok";
        songbo_toast("注册成功");
        setTimeout(() => location.href = "index.html", 900);
    } else {
        songbo_tip.textContent = songbo_ret.msg;
        songbo_tip.className = "songbo_form_tip songbo_bad";
    }
}

/* ---------- 启动：输入即校验 ---------- */
document.getElementById("songbo_email").addEventListener("blur", songbo_check_email);
document.getElementById("songbo_pwd").addEventListener("input", songbo_check_pwd);
document.getElementById("songbo_pwd2").addEventListener("input", songbo_check_pwd2);
document.getElementById("songbo_btn_reg").addEventListener("click", songbo_submit);
