/**
 * 作者：宋博
 * 建立时间：2026-11-23
 * 使用模型：GLM-5.3-Flash
 * 功能名称：AI 聊天助手逻辑（frontend/js/chat.js）
 * 简介：维护多轮对话上下文（messages 数组，含 system 角色），调用后端 /api/ai/chat
 *       完成与大模型的交互；键盘发送与接收到的数据全部打印到浏览器控制台作为实验证据。
 */

// ===== 全局状态 =====
// sjs_context：完整的 messages 数组（含 system 设定与全部历史），每轮对话整体发给后端，
// 大模型据此记住之前的聊天内容——这就是"多轮对话上下文"的实现方式
var sjs_context = [
    {
        role: "system",
        content: "你是宋博的课堂 AI 助手「小宋」。请使用简体中文回答，语气友好简洁。" +
                 "请记住用户在对话中告诉你的信息（如姓名、喜好），后续提问要结合之前的上下文作答。"
    }
];

// sjs_round：当前对话轮次计数（第 1 轮、第 2 轮…），用于在界面上标出轮次
var sjs_round = 0;

// sjs_busy：是否正在等待大模型回复，防止重复发送
var sjs_busy = false;

// ===== DOM 引用 =====
var sjs_elMessages = document.getElementById("sjs_messages");
var sjs_elInput = document.getElementById("sjs_input");
var sjs_elSend = document.getElementById("sjs_send");
var sjs_elClear = document.getElementById("sjs_clearbtn");
var sjs_elWelcome = document.getElementById("sjs_welcome");
var sjs_elChat = document.getElementById("sjs_chat");

/**
 * 转义 HTML 特殊字符
 * 功能：把用户/模型返回文本中的 < > & " 转义，防止注入破坏页面结构
 * @param {string} sjs_text 原始文本
 * @returns {string} 转义后的安全文本
 */
function sjs_escapeHtml(sjs_text) {
    return sjs_text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * 追加一条消息到界面
 * 功能：按角色（user / assistant / error）生成气泡行，插入消息列表并滚动到底部
 * @param {string} sjs_role 消息角色："user" 用户、"assistant" 模型、"error" 错误提示
 * @param {string} sjs_text 消息文本
 * @returns {HTMLElement} 新建的气泡元素（供加载动画更新使用）
 */
function sjs_addBubble(sjs_role, sjs_text) {
    // 首次对话时移除欢迎卡片
    if (sjs_elWelcome && sjs_elWelcome.parentNode) { sjs_elWelcome.parentNode.removeChild(sjs_elWelcome); }

    // 行容器：用户靠右、模型靠左
    var sjs_row = document.createElement("div");
    sjs_row.className = "sjs_row sjs_" + (sjs_role === "user" ? "user" : "bot");

    // 头像：用户"宋"，模型"AI"
    var sjs_avatar = document.createElement("div");
    sjs_avatar.className = "sjs_avatar";
    sjs_avatar.textContent = sjs_role === "user" ? "宋" : "AI";
    sjs_row.appendChild(sjs_avatar);

    // 气泡：文本按纯文本 + 换行渲染
    var sjs_bubble = document.createElement("div");
    sjs_bubble.className = "sjs_bubble" + (sjs_role === "error" ? " sjs_error" : "");
    sjs_bubble.innerHTML = sjs_escapeHtml(sjs_text).replace(/\n/g, "<br>");
    sjs_row.appendChild(sjs_bubble);

    sjs_elMessages.appendChild(sjs_row);

    // 每轮结束后在下方标注轮次，界面上能直接看出多轮对话
    if (sjs_role !== "error") {
        var sjs_tag = document.createElement("p");
        sjs_tag.className = "sjs_roundtag";
        sjs_tag.textContent = "—— 第 " + sjs_round + " 轮 · 上下文共 " + sjs_context.length + " 条消息 ——";
        sjs_elMessages.appendChild(sjs_tag);
    }

    // 滚动到底部，保证最新消息可见
    sjs_elChat.scrollTop = sjs_elChat.scrollHeight;
    return sjs_bubble;
}

/**
 * 显示加载动画气泡
 * 功能：在消息列表末尾插入"正在思考"的三点动画，返回气泡元素用于结束后移除
 * @returns {HTMLElement} 加载气泡元素
 */
function sjs_addLoading() {
    var sjs_row = document.createElement("div");
    sjs_row.className = "sjs_row sjs_bot";
    sjs_row.innerHTML =
        '<div class="sjs_avatar">AI</div>' +
        '<div class="sjs_bubble"><span class="sjs_loading"><i></i><i></i><i></i></span></div>';
    sjs_elMessages.appendChild(sjs_row);
    sjs_elChat.scrollTop = sjs_elChat.scrollHeight;
    return sjs_row;
}

/**
 * 发送一轮对话
 * 功能：读取输入框文本 → 追加进上下文 → console 打印发送数据 → 请求后端 /api/ai/chat
 *       → console 打印接收数据 → 渲染回复；全程维护 sjs_busy 状态
 * @returns {Promise<void>}
 */
async function sjs_sendMessage() {
    // 忙碌中或输入为空时直接忽略
    var sjs_text = sjs_elInput.value.trim();
    if (sjs_busy || !sjs_text) { return; }

    sjs_busy = true;
    sjs_elSend.disabled = true;
    sjs_round++; // 进入新一轮

    // 1. 用户消息入列上下文并渲染
    sjs_context.push({ role: "user", content: sjs_text });
    sjs_addBubble("user", sjs_text);
    sjs_elInput.value = "";
    sjs_elInput.style.height = "auto";

    // 2. 【实验证据】打印"键盘发送"的数据：本轮输入 + 完整上下文（F12 控制台可见）
    console.log("%c[键盘发送] 第 " + sjs_round + " 轮 · 用户输入：", "color:#c14a33;font-weight:bold;", sjs_text);
    console.log("[键盘发送] 完整上下文 messages（发给后端）：", JSON.parse(JSON.stringify(sjs_context)));

    // 3. 显示加载动画
    var sjs_loadingRow = sjs_addLoading();

    try {
        // 4. 请求后端中间层（前端不接触 API Key，由后端转发大模型服务）
        var sjs_resp = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: sjs_context })
        });

        // 5. 【实验证据】打印"接收到的数据"（后端统一格式 {code, msg, data}）
        var sjs_data = await sjs_resp.json();
        console.log("%c[接收到数据] 第 " + sjs_round + " 轮 · 后端返回：", "color:#2e6b4f;font-weight:bold;", sjs_data);

        // 移除加载动画
        if (sjs_loadingRow.parentNode) { sjs_loadingRow.parentNode.removeChild(sjs_loadingRow); }

        // 6. 按 code 判断成功失败并渲染
        if (sjs_data.code === 0 && sjs_data.data && sjs_data.data.reply) {
            sjs_context.push({ role: "assistant", content: sjs_data.data.reply }); // 模型回复同样入列上下文
            sjs_addBubble("assistant", sjs_data.data.reply);
        } else {
            sjs_addBubble("error", "出错了：" + (sjs_data.msg || "未知错误"));
        }
    } catch (sjs_err) {
        // 网络中断、超时等异常
        console.error("[接收到数据] 请求失败：", sjs_err);
        if (sjs_loadingRow.parentNode) { sjs_loadingRow.parentNode.removeChild(sjs_loadingRow); }
        sjs_addBubble("error", "网络异常：" + sjs_err.message);
    } finally {
        sjs_busy = false;
        sjs_elSend.disabled = false;
        sjs_elInput.focus();
    }
}

/**
 * 清空对话
 * 功能：重置上下文数组与轮次计数，恢复欢迎卡片，并打印重置记录
 * @returns {void}
 */
function sjs_clearChat() {
    sjs_context = [sjs_context[0]]; // 只保留 system 设定
    sjs_round = 0;
    console.log("[清空对话] 上下文已重置，仅保留 system 角色设定");
    sjs_elMessages.innerHTML = "";
    sjs_elWelcome = document.createElement("div");
    sjs_elWelcome.className = "sjs_welcome";
    sjs_elWelcome.id = "sjs_welcome";
    sjs_elWelcome.innerHTML =
        '<p class="sjs_welcome_title">已清空，开始新对话 🤖</p>' +
        '<p class="sjs_welcome_text">按 <kbd>Enter</kbd> 发送，<kbd>Shift</kbd> + <kbd>Enter</kbd> 换行。</p>';
    sjs_elMessages.appendChild(sjs_elWelcome);
}

/**
 * 自适应输入框高度
 * 功能：输入内容变多时自动增高，上限由 CSS max-height 控制
 * @returns {void}
 */
function sjs_autosize() {
    sjs_elInput.style.height = "auto";
    sjs_elInput.style.height = Math.min(sjs_elInput.scrollHeight, 140) + "px";
}

// ===== 事件绑定 =====
// Enter 发送、Shift+Enter 换行
sjs_elInput.addEventListener("keydown", function (sjs_e) {
    if (sjs_e.key === "Enter" && !sjs_e.shiftKey) {
        sjs_e.preventDefault(); // 阻止换行，改为发送
        sjs_sendMessage();
    }
});

// 输入时自适应高度
sjs_elInput.addEventListener("input", sjs_autosize);

// 点击发送按钮
sjs_elSend.addEventListener("click", sjs_sendMessage);

// 清空按钮
sjs_elClear.addEventListener("click", sjs_clearChat);

// 页面加载后聚焦输入框
sjs_elInput.focus();
