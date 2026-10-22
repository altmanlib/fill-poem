/**
 * Every bundled image asset URL, collected eagerly via Vite's import.meta.glob.
 * Consumed by the splash loading page to warm the browser's image cache
 * up front, so quiz/blindbox/result screens later in the flow never pop in
 * unstyled or blank artwork.
 */
const modules = import.meta.glob<string>('../assets/images/**/*.{png,jpg,jpeg,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default'
});

export const imageManifest: string[] = Object.values(modules);
