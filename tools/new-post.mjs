import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const photography = args[0] === '--photography';
const title = (photography ? args.slice(1) : args).join(' ').trim();
if (!title) { console.error(`用法：npm run ${photography ? 'new:photo' : 'new'} -- "标题"`); process.exit(1); }
const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const slug = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'untitled';
const folder = fileURLToPath(new URL(`../content/${photography ? 'photography' : 'writing'}/`, import.meta.url));
await mkdir(folder, { recursive: true });
const basename = `${now}-${slug}`;
const file = path.join(folder, `${basename}.md`);
const fields = photography ? `folder: ${JSON.stringify(basename)}\nshowLocation: false\n` : '';
try {
  await writeFile(file, `---\ntitle: ${JSON.stringify(title)}\ndate: ${now}\ntags: []\nsummary: ""\n${fields}draft: true\n---\n\n`, { flag: 'wx' });
  if (photography) await mkdir(path.join(folder, basename), { recursive: true });
  console.log(`草稿已创建：${file}${photography ? `\n照片放入：${path.join(folder, basename)}\n在 Markdown 正文中写下感悟，网站会显示在照片下面。` : ''}\n写好后将 draft 改为 false，保存即可在本地预览中收录。`);
} catch (error) { console.error(error.code === 'EEXIST' ? '同名内容已存在，没有覆盖。' : error.message); process.exitCode = 1; }
