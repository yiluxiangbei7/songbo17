-- ============================================================
-- 文件名: songbo_supabase_schema.sql
-- 作者: 宋博 (24001011017)
-- 说明: 小米商城（三级项目 · 题库34号）Supabase 数据库完整重建脚本。
--       三张表：categories(分类) / products(商品) / orders(订单)
--       RLS 行级安全：分类与商品匿名只读、登录可写；订单仅登录读写。
--       执行位置: Supabase Dashboard → SQL Editor，或 Management API /database/query
-- ============================================================

-- ---------- 1. 建表 ----------
CREATE TABLE public.categories (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(30)  NOT NULL UNIQUE,          -- 分类名
    icon       VARCHAR(120) NOT NULL DEFAULT '',      -- 分类图标（本地SVG路径）
    sort       INT          NOT NULL DEFAULT 0,       -- 排序号
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE public.products (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL,                 -- 商品名
    category_id BIGINT       NOT NULL REFERENCES public.categories(id),  -- 所属分类
    price       NUMERIC(10,2) NOT NULL,                -- 现价
    old_price   NUMERIC(10,2),                         -- 原价（划线价，可空）
    stock       INT          NOT NULL DEFAULT 0,       -- 库存
    sales       INT          NOT NULL DEFAULT 0,       -- 销量
    cover       VARCHAR(120) NOT NULL DEFAULT '',      -- 商品图（本地SVG路径）
    brief       VARCHAR(200) NOT NULL DEFAULT '',      -- 卖点简介
    hot         BOOLEAN      NOT NULL DEFAULT FALSE,   -- 是否爆款
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE public.orders (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_name VARCHAR(80)  NOT NULL,                 -- 商品名（下单时快照）
    qty          INT          NOT NULL DEFAULT 1,       -- 数量
    total        NUMERIC(10,2) NOT NULL,                -- 总金额
    status       VARCHAR(12)  NOT NULL DEFAULT '已支付',-- 已支付/待发货/已发货/已完成/已取消
    receiver     VARCHAR(30)  NOT NULL,                 -- 收货人
    phone        VARCHAR(20)  NOT NULL,                 -- 手机号
    address      VARCHAR(150) NOT NULL DEFAULT '',      -- 收货地址
    user_id      UUID,                                  -- 下单用户（auth.users.id）
    user_email   VARCHAR(120),                          -- 下单用户邮箱
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------- 2. RLS 行级安全（评分项） ----------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders     ENABLE ROW LEVEL SECURITY;

-- 分类/商品：匿名可读（商品浏览无需登录）
CREATE POLICY allow_anon_read_categories ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY allow_anon_read_products   ON public.products   FOR SELECT TO anon USING (true);
-- 分类/商品：登录用户可写（后台管理 CRUD）
CREATE POLICY allow_auth_write_categories ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth_write_products   ON public.products   FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- 订单：仅登录用户读写（匿名写返回 42501/401 被拦截；匿名读不到任何行）
CREATE POLICY allow_auth_orders ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ---------- 3. 种子数据 ----------
INSERT INTO public.categories (name, icon, sort) VALUES
('手机',   'images/songbo_cat_1.svg', 1),
('电视',   'images/songbo_cat_2.svg', 2),
('笔记本', 'images/songbo_cat_3.svg', 3),
('平板',   'images/songbo_cat_4.svg', 4),
('穿戴',   'images/songbo_cat_5.svg', 5),
('家电',   'images/songbo_cat_6.svg', 6),
('影音',   'images/songbo_cat_7.svg', 7),
('配件',   'images/songbo_cat_8.svg', 8);

INSERT INTO public.products (name, category_id, price, old_price, stock, sales, cover, brief, hot) VALUES
('小米15 Ultra',              1, 6499, 6999, 128,  3562, 'images/songbo_p1.svg',  '徕卡四摄 · 2K屏 · 骁龙8至尊版 · 6000mAh',  TRUE),
('小米15',                    1, 4499, 4699,  96,  5210, 'images/songbo_p2.svg',  '徕卡光学 · 小米澎湃OS2 · 5400mAh',         TRUE),
('Redmi K80 Pro',             1, 2999, 3299, 154,  8930, 'images/songbo_p3.svg',  '骁龙8 Gen3 · 2K直屏 · 120W秒充',           TRUE),
('Redmi Turbo 4 Pro',         1, 1999, NULL, 210, 12040, 'images/songbo_p4.svg',  '天玑9400+ · 7000mAh大电池',                FALSE),
('小米电视 Mini LED 55英寸',  2, 2799, 3299,  66,  2310, 'images/songbo_p5.svg',  'Mini LED背光 · 144Hz · 杜比视界',          TRUE),
('Redmi 智能电视 A32',        2,  699,  899, 180, 15600, 'images/songbo_p6.svg',  '32英寸高清 · 智能语音 · 60Hz',             FALSE),
('RedmiBook 16 2025',         3, 3699, 3999,  87,  1980, 'images/songbo_p7.svg',  '酷睿Ultra5 · 16英寸2.8K · 轻薄本',         TRUE),
('小米平板7 Pro',             4, 2599, 2799, 132,  3450, 'images/songbo_p8.svg',  '骁龙8s Gen3 · 3.2K 144Hz · 手写笔',        FALSE),
('小米Watch S4',              5,  999, 1099,  78,  4230, 'images/songbo_p9.svg',  '1.43英寸AMOLED · 百表盘 · 血氧监测',       TRUE),
('小米手环9',                 5,  249,  269, 320, 21050, 'images/songbo_p10.svg', '21天续航 · 150+运动模式 · 睡眠监测',       FALSE),
('米家空调 1.5匹 新一级能效', 6, 2299, 2599,  45,  1670, 'images/songbo_p11.svg', '新一级能效 · 智能自清洁 · 30s速冷',        TRUE),
('小米Buds 5 Pro',            7, 1299, 1499, 110,  2870, 'images/songbo_p12.svg', '55dB降噪 · LDAC · 40h续航',                FALSE),
('小米净水器 1200G',          6, 2999, NULL,  33,   890, 'images/songbo_p13.svg', '1200G大通量 · 6级精滤 · 双出水',           FALSE),
('小米充电宝 10000mAh 33W',   8,  129,  149, 500, 31200, 'images/songbo_p14.svg', '33W快充 · 双口输出 · 金属外壳',            FALSE);

INSERT INTO public.orders (product_name, qty, total, status, receiver, phone, address, user_id, user_email) VALUES
('小米15 Ultra',             1, 6499, '已支付', '宋博',   '13800000001', '北京市海淀区学院路1号',      NULL, 'songbo17@test.com'),
('小米手环9',                2,  498, '已支付', '宋博',   '13800000001', '北京市海淀区学院路1号',      NULL, 'songbo17@test.com'),
('Redmi K80 Pro',            1, 2999, '已发货', '宋博',   '13800000001', '北京市海淀区学院路1号',      NULL, 'songbo17@test.com'),
('小米电视 Mini LED 55英寸', 1, 2799, '已支付', '王雨欣', '13800000002', '上海市浦东新区世纪大道100号', NULL, 'demo@songbo.com'),
('RedmiBook 16 2025',        1, 3699, '已完成', '李强',   '13800000003', '杭州市西湖区文一路2号',      NULL, 'demo@songbo.com'),
('小米Watch S4',             1,  999, '待发货', '张伟',   '13800000004', '广州市天河区珠江新城3号',    NULL, 'demo@songbo.com'),
('米家空调 1.5匹 新一级能效',1, 2299, '已取消', '陈晨',   '13800000005', '南京市江宁区科学园4号',      NULL, 'demo2@songbo.com'),
('小米Buds 5 Pro',           1, 1299, '已支付', '赵磊',   '13800000006', '成都市武侯区天府大道5号',    NULL, 'demo2@songbo.com');
