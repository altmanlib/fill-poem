# 填字组诗

移动端 H5 填字组诗互动页 Monorepo。

## 目录

| 路径 | 说明 |
|---|---|
| `fill-poem-web` | 前端（Vite） |
| `fill-poem-api` | 后端（Go） |
| `docs` | 设计与说明文档 |
| `prototype` | 早期原型，仅供参考 |

## 本地端口

| 服务 | 端口 |
|---|---|
| 前端 Vite | `17327` |
| API | `17073` |
| Postgres（compose 宿主机） | `11004` |
| Adminer | `19299` |

## 前端

```bash
cd fill-poem-web
bun install
bun run dev
bun run build
```

## 后端

```bash
cd fill-poem-api
make run       # 默认 :17073
make build
```
