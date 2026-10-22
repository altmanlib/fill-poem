import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

// Guard for the font subset: every CJK character in a string literal (src/**/*.ts) or index.html
// must be listed in src/assets/fonts/chars.txt, otherwise it silently falls back to the system font.

const ROOT = join(import.meta.dirname, '..');
const CJK = /[\u2013\u2014\u3001-\u3011\u4e00-\u9fff\uff01-\uff1f]/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

function literalChars(source: string): string[] {
  const literals = source.match(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g) ?? [];
  return literals.flatMap((lit) => lit.match(CJK) ?? []);
}

test('chars.txt covers every CJK character used in source copy', () => {
  const listed = new Set(
    readFileSync(join(ROOT, 'src/assets/fonts/chars.txt'), 'utf8')
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .join('')
  );
  const used = new Set<string>();
  for (const file of walk(join(ROOT, 'src'))) for (const c of literalChars(readFileSync(file, 'utf8'))) used.add(c);
  for (const c of readFileSync(join(ROOT, 'index.html'), 'utf8').match(CJK) ?? []) used.add(c);

  const missing = [...used].filter((c) => !listed.has(c));
  expect(missing.join('')).toBe('');
});
