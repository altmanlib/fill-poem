# 字体子集

展示用字体「方正小标宋简体」FZXiaoBiaoSong（PostScript 名 `FZXiaoBiaoSong-B05S`），由 Vite 以相对路径打包（见 `src/styles/fonts.css`），随 `base` 正确解析。

## 生成子集

1. 将原始字体放到本目录：`FZXiaoBiaoSong-B05S.ttf`
2. 维护 `chars.txt`：页面用到的全部文案字符（`src/` 与 `index.html`），`#` 开头的行为注释
   - 文案变动后需重新生成
   - 空格不写入 `chars.txt`，脚本会自动补充
3. 在 `fill-poem-web/` 下执行：

   ```bash
   uv run src/assets/fonts/subset-font.py \
     src/assets/fonts/FZXiaoBiaoSong-B05S.ttf \
     src/assets/fonts/chars.txt \
     src/assets/fonts/FZXiaoBiaoSong.subset.woff2
   ```

原始 `.ttf` 不入库（已在 `.gitignore` 中排除）。

## 缺失时

子集文件不存在时，`@font-face` 加载失败，`--font-display` 回退到宋体栈，页面不报错。
