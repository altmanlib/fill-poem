
## 前端导入别名

- `fill-poem-web` 中跨目录导入一律用 `#/`（指向 `src/`），如 `import { h } from '#/lib/dom.ts'`；不再写 `../`
- 同目录导入仍用 `./`
- 别名需在 `tsconfig.json`（`paths`）与 `vite.config.ts`（`resolve.alias`）两处同步配置

## Git 工作流

- 开发分支使用 `dev`, 所有开发提交都在 `dev` 上, 不存在时从 `main` 创建
- 提交与推送的时机由 agent 自行判断: 一个任务或子步骤完成且验证通过后即提交并推送 `dev`, 无需确认
- 合并到 `main` 须用户明确要求
- 推送被拒绝（远端有新提交且无法快进）时停下来告知用户, 不强推、不擅自 merge / rebase
