# Lumen

*Illuminate what's stored · Your metadata partner for the modern data warehouse*

数仓表元数据展示系统（原「数据地图」）· 内部使用 · 数据来自 Supabase。

## 技术栈

- Vue 3（组合式 API）+ Vite + Vue Router
- Element Plus + 自定义 Apple / Notion 风格样式
- supabase-js（Auth 邮箱密码登录 + REST 数据读取）
- 部署：Vercel

## 账号

- 不开放注册，账号由管理员分配
- 两步式登录：邮箱或用户名 → 密码
- 管理员：Yuanwdii（yuanwdii@gmail.com），读 + 写权限

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填入 Supabase URL 与 anon key
npm run dev                  # http://localhost:5173
```

## 部署

`npm run build` 产物在 `dist/`，直接部署到 Vercel。

## 目录结构

```
├── index.html            # Vite 入口
├── src/
│   ├── main.js           # 应用入口（Element Plus / Router）
│   ├── App.vue           # 根组件（路由过渡动画）
│   ├── lib/supabase.js   # Supabase 客户端单例
│   ├── router/index.js   # 路由 + 登录守卫
│   ├── styles/global.css # Apple 风格全局变量
│   └── views/
│       ├── AuthView.vue  # 两步式登录页
│       └── MapView.vue   # 数据地图首页（阶段二重设计）
└── docs/产品文档.md       # 产品决策 / 功能 / 安全设计记录
```

## 安全说明

- anon key 存放于 `.env.local`（不入库），数据权限由 RLS 策略控制
- 详见 [docs/产品文档.md](./docs/产品文档.md)
