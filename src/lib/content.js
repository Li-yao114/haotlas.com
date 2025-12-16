// 读取 JSON 文件
export async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }
  
  // 读取 Markdown 文件，并简单去掉 front-matter（不做复杂解析）
  export async function loadMarkdown(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const text = await res.text();
    return stripFrontMatter(text);
  }
  
  // 简单裁掉最前面的 --- ... ---，meta 暂时不用
  function stripFrontMatter(text) {
    if (!text.startsWith("---")) {
      return { body: text };
    }
  
    const endIndex = text.indexOf("\n---");
    if (endIndex === -1) {
      return { body: text };
    }
  
    const body = text.slice(endIndex + 4).trim();
    return { body };
  }
  
  // 文稿索引
  export async function loadWritingIndex() {
    return loadJson("/content/writing/index.json");
  }
  
  // 摄影索引
  export async function loadPhotographyIndex() {
    return loadJson("/content/photography/index.json");
  }
  