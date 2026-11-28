/**
 * 文件名: songbo_dashboard.js
 * 作者: 宋博 (24001011017)
 * 创建时间: 2026-11-28
 * 功能说明: 数据仪表盘——页面守卫拦截未登录；统计卡片（商品数/库存/订单数/
 *           销售额）与三张 ECharts 图表（分类占比饼图 / 销量TOP条形图 /
 *           价格分布折线图），数据全部来自 Supabase REST 真实接口。
 */

/* 页面守卫（评分项：未登录拦截） */
if (songbo_require_login()) songbo_init_dashboard();

async function songbo_init_dashboard() {
    /* ---------- 1. 拉取真实数据 ---------- */
    const songbo_products = await songbo_rest_get("products", "select=*&order=id.asc");
    const songbo_cats = await songbo_rest_get("categories", "select=*&order=sort.asc");
    const songbo_orders = await songbo_rest_get("orders", "select=*&order=id.asc");
    const songbo_cat_map = {};
    songbo_cats.forEach(c => songbo_cat_map[c.id] = c.name);

    /* ---------- 2. 统计卡片 ---------- */
    const songbo_stock_total = songbo_products.reduce((n, p) => n + p.stock, 0);
    const songbo_sales_total = songbo_orders.filter(o => o.status !== "已取消")
        .reduce((n, o) => n + Number(o.total), 0);
    document.getElementById("songbo_st_products").textContent = songbo_products.length;
    document.getElementById("songbo_st_stock").textContent = songbo_stock_total;
    document.getElementById("songbo_st_orders").textContent = songbo_orders.length;
    document.getElementById("songbo_st_sales").textContent = "¥" + songbo_sales_total.toLocaleString("zh-CN");

    /* ---------- 3. 饼图：各分类商品数量占比 ---------- */
    const songbo_pie_data = songbo_cats.map(c => ({
        name: c.name,
        value: songbo_products.filter(p => p.category_id === c.id).length
    })).filter(x => x.value > 0);
    const songbo_pie = echarts.init(document.getElementById("songbo_chart_pie"));
    songbo_pie.setOption({
        tooltip: { trigger: "item", formatter: "{b}：{c} 款（{d}%）" },
        legend: { bottom: 0, itemWidth: 14, itemHeight: 14 },
        series: [{
            type: "pie", radius: ["42%", "68%"], center: ["50%", "44%"],
            itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
            label: { formatter: "{b}\n{d}%" },
            data: songbo_pie_data,
            color: ["#ff6700", "#ffb35c", "#2b6de8", "#34c38f", "#8f6bff", "#e5544b", "#5b8def", "#c98f1b"]
        }]
    });

    /* ---------- 4. 条形图：销量 TOP 8 ---------- */
    const songbo_top8 = [...songbo_products].sort((a, b) => b.sales - a.sales).slice(0, 8).reverse();
    const songbo_bar = echarts.init(document.getElementById("songbo_chart_bar"));
    songbo_bar.setOption({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: 130, right: 30, top: 20, bottom: 30 },
        xAxis: { type: "value", name: "销量" },
        yAxis: {
            type: "category",
            data: songbo_top8.map(p => p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name),
            axisLabel: { fontSize: 11 }
        },
        series: [{
            type: "bar", barWidth: 14,
            data: songbo_top8.map(p => p.sales),
            itemStyle: {
                borderRadius: [0, 7, 7, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: "#ffb35c" }, { offset: 1, color: "#ff6700" }
                ])
            },
            label: { show: true, position: "right", fontSize: 11, color: "#666" }
        }]
    });

    /* ---------- 5. 折线图：价格分布 ---------- */
    const songbo_sorted = [...songbo_products].sort((a, b) => a.price - b.price);
    const songbo_line = echarts.init(document.getElementById("songbo_chart_line"));
    songbo_line.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: 60, right: 30, top: 30, bottom: 90 },
        xAxis: {
            type: "category",
            data: songbo_sorted.map(p => p.name.length > 10 ? p.name.slice(0, 10) + "…" : p.name),
            axisLabel: { rotate: 35, fontSize: 11 }
        },
        yAxis: { type: "value", name: "价格（元）" },
        series: [{
            type: "line", smooth: true,
            data: songbo_sorted.map(p => Number(p.price)),
            lineStyle: { width: 3, color: "#ff6700" },
            itemStyle: { color: "#ff6700" },
            areaStyle: { color: "rgba(255,103,0,.12)" },
            symbolSize: 7
        }]
    });

    /* 窗口变化时图表自适应 */
    window.addEventListener("resize", () => { songbo_pie.resize(); songbo_bar.resize(); songbo_line.resize(); });
}
