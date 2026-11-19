import { watch } from 'node:fs';
import { createServer } from 'vite';
import { buildContent } from './build-content.mjs';

await buildContent();
const server = await createServer();
await server.listen();
server.printUrls();
let timer, running = false, pending = false;
async function rebuild() {
  if (running) { pending = true; return; }
  running = true;
  try { await buildContent(); server.ws.send({ type: 'full-reload' }); }
  catch (error) { console.error('内容未更新，保留上次版本：', error.message); }
  finally { running = false; if (pending) { pending = false; rebuild(); } }
}
const watcher = watch(new URL('../content/', import.meta.url), { recursive: true }, () => {
  clearTimeout(timer); timer = setTimeout(rebuild, 220);
});
async function close() { watcher.close(); clearTimeout(timer); await server.close(); process.exit(0); }
process.once('SIGINT', close); process.once('SIGTERM', close);
