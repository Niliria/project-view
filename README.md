# 数据地图前端（project-view）

数仓表元数据展示页面，数据来自 Supabase。

## 技术栈

- 原生 HTML / CSS / JavaScript（零构建、零依赖）
- supabase-js（CDN 引入，固定版本 + SRI 完整性校验）
- 数据源：Supabase REST API，表 `dw_tables`

## 本地运行

```bash
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 部署

静态站点，直接部署到 Vercel（无需构建命令）。

## 目录结构

```
├── index.html      # 页面骨架
├── css/style.css   # 样式
└── js/app.js       # 数据加载与渲染逻辑
```

## 说明

- 前端使用的是 Supabase anon 公开密钥（设计上允许暴露），
  数据库通过 RLS 策略限制为只读。
- 数据更新只需写入 Supabase，页面刷新即可看到最新内容，无需重新部署。
