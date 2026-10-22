/**
 * Wait for a font family to be usable, resolving false on failure or timeout.
 * A missing font is non-fatal: CSS falls back to the next family in the stack.
 */
export async function loadFont(family: string, sampleText: string, timeoutMs: number): Promise<boolean> {
  const fonts = typeof document === 'undefined' ? undefined : document.fonts;
  if (!fonts?.load) return true;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  const load = fonts.load(`1em "${family}"`, sampleText).then(
    (faces) => faces.length > 0,
    () => false
  );
  try {
    return await Promise.race([load, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
