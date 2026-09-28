# fill-poem-api

填字组诗后端（Go）。入口：`./cmd/server`。

## 本地端口

| 服务 | 端口 |
|---|---|
| API | `17073` |
| Postgres（compose 宿主机） | `11004` |
| Adminer | `19299` |

## 命令

```bash
make dev      # 加载 .env 后运行
make run
make build    # 输出到 build/fill-poem-api
make test
make tidy
```

健康检查：

```bash
curl http://127.0.0.1:17073/healthz
```

监听地址由 `.env` 中的 `APP_HOST` / `APP_PORT` 控制。
