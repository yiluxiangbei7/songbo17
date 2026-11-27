/**
 * 文件名: songbo_dashboard.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-27
 * 功能说明: 仪表盘逻辑——从 Supabase 接口拉取真实数据（news/topics/comments），
 *           前端聚合统计后交给 ECharts 渲染：饼图（分类占比）、条形图（话题关注）、
 *           折线图（阅读量对比）。图表数据全部来自接口返回，无写死数据。
 */

/* ---------- 0. 鉴权拦截 ---------- */
if (!songbo_require_login()) {
    throw new Error("未登录，仪表盘终止加载");
}

/* ---------- 1. 拉取全量真实数据 ---------- */
async function songbo_load_all() {
    const [songbo_news, songbo_topics, songbo_cmts] = await Promise.all([
        songbo_rest_get("news", "select=id,title,category,views&order=views.desc"),
        songbo_rest_get("topics", "select=id,name,followers&order=followers.desc"),
        songbo_rest_get("comments", "select=id,likes&order=id.asc")
    ]);
    return { news: songbo_news, topics: songbo_topics, comments: songbo_cmts };
}

/* ---------- 2. 统计卡片 ---------- */
function songbo_render_stats(d) {
    document.getElementById("songbo_stat_news").textContent = d.news.length;
    document.getElementById("songbo_stat_views").textContent =
        d.news.reduce((s, n) => s + (n.views || 0), 0).toLocaleString();
    document.getElementById("songbo_stat_comments").textContent = d.comments.length;
    document.getElementById("songbo_stat_topics").textContent = d.topics.length;
}

/* ---------- 3. 图表：分类新闻占比（饼图） ---------- */
function songbo_draw_pie(d) {
    // 按 category 聚合
    const songbo_map = {};
    d.news.forEach(n => { songbo_map[n.category] = (songbo_map[n.category] || 0) + 1; });
    const songbo_data = Object.entries(songbo_map).map(([name, value]) => ({ name, value }));

    echarts.init(document.getElementById("songbo_chart_pie")).setOption({
        tooltip: { trigger: "item", formatter: "{b}：{c} 条（{d}%）" },
        legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
        color: ["#0084ff", "#ff8a3d", "#00a854", "#7c5cff", "#f1403c"],
        series: [{
            type: "pie",
            radius: ["38%", "62%"],
            center: ["50%", "44%"],
            label: { formatter: "{b}\n{c} 条", fontSize: 12 },
            data: songbo_data
        }]
    });
}

/* ---------- 4. 图表：话题关注度（条形图） ---------- */
function songbo_draw_bar(d) {
    echarts.init(document.getElementById("songbo_chart_bar")).setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: "{b}：{c} 万关注" },
        grid: { left: 90, right: 30, top: 16, bottom: 28 },
        xAxis: { type: "value", name: "万", splitLine: { lineStyle: { color: "#f0f0f0" } } },
        yAxis: {
            type: "category",
            data: d.topics.map(t => t.name).reverse(),
            axisLabel: { fontSize: 12 }
        },
        series: [{
            type: "bar",
            data: d.topics.map(t => t.followers).reverse(),
            barWidth: 14,
            itemStyle: { borderRadius: [0, 7, 7, 0], color: "#0084ff" },
            label: { show: true, position: "right", fontSize: 11, color: "#646464" }
        }]
    });
}

/* ---------- 5. 图表：新闻阅读量（折线图） ---------- */
function songbo_draw_line(d) {
    echarts.init(document.getElementById("songbo_chart_line")).setOption({
        tooltip: { trigger: "axis" },
        grid: { left: 60, right: 40, top: 30, bottom: 70 },
        xAxis: {
            type: "category",
            data: d.news.map(n => n.title.length > 10 ? n.title.slice(0, 10) + "…" : n.title),
            axisLabel: { fontSize: 11, rotate: 24, color: "#646464" }
        },
        yAxis: { type: "value", name: "阅读量", splitLine: { lineStyle: { color: "#f0f0f0" } } },
        dataZoom: [{ type: "inside" }],
        series: [{
            name: "阅读量",
            type: "line",
            data: d.news.map(n => n.views),
            smooth: true,
            symbolSize: 8,
            lineStyle: { width: 3, color: "#0084ff" },
            itemStyle: { color: "#0084ff" },
            areaStyle: { color: "rgba(0,132,255,.12)" }
        }]
    });
}

/* ---------- 启动 ---------- */
(async () => {
    const songbo_data = await songbo_load_all();
    if (songbo_data.news.length === 0) {
        document.getElementById("songbo_stat_row").insertAdjacentHTML("afterend",
            '<div class="songbo_status">接口未返回数据，请检查数据库是否已建表</div>');
        return;
    }
    songbo_render_stats(songbo_data);
    songbo_draw_pie(songbo_data);
    songbo_draw_bar(songbo_data);
    songbo_draw_line(songbo_data);
})();
