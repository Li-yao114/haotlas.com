import { build } from 'vite';
await build({ configFile: false, build: { outDir: 'dist', emptyOutDir: false, target: 'es2022', copyPublicDir: false, rolldownOptions: { input: 'admin/location/index.html' } } });
