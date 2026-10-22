import '#/styles/fonts.css';
import '#/styles/reset.css';
import '#/styles/vars.css';
import '#/styles/app.css';
import { createApp } from './app.ts';

// iOS Safari only applies `:active` styles when at least one touch listener
// exists in the ancestor chain.
document.addEventListener('touchstart', () => {}, { passive: true });

const root = document.getElementById('app');
if (root) void createApp(root).start();
