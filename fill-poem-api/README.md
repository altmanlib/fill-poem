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
make fmt
make lint
make test      # 需要 compose 的 db：`docker compose up -d db`
make tidy
```

提交前 `make fmt`、`make lint`、`make test` 须全部通过。测试使用 `fillpoem_test` 库（`init-db.sql` 创建），不会碰 `fillpoem` 开发库。

## 端点

| 路径 | 说明 |
|---|---|
| `GET /healthz` | 进程存活 |
| `GET /readyz` | 数据库可达才返回 200 |
| `/api/v1/*` | 业务接口，所有路由挂在 `Router.API`；按客户端 IP 限流 |

错误统一为 `{"code":"E_...","message":"..."}`，错误码集中在 `internal/bizerr`。

## 目录

```text
cmd/server/     装配入口与优雅退出
internal/
  config/       .env / 环境变量解析与校验
  store/        gorm + PostgreSQL；未上线阶段用 AutoMigrate
  bizerr/       错误码、HTTP 状态与消息模板
  httpapi/      echo 路由、中间件、统一错误应答
```

配置项见 `.env.example`；进程环境变量优先于 `.env`。
