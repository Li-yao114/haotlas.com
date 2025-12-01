import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PHOTO_POSTS = [
  {
    id: "street-sample",
    section: "PHOTOGRAPHY",
    title: "街拍示例 · 夜色",
    description: "用 A7M4 和 24-70 GM2 拍的一组夜景街拍示例。",
    date: "2024-01-02",
    content: `
> 下面这张是示例，你可以把自己的原图放在 \`public/photos\` 目录里。

![街拍示例](/photos/street-1.jpg)

## 拍摄记录

- 机身：Sony A7M4
- 镜头：24–70 GM2
- 光圈：F2.8
- 快门：1/160s
- ISO：3200

也可以在这里写一些拍摄思路、参数记录或者后期笔记。
`,
  },
];

export default function Photography() {
  const [currentId, setCurrentId] = useState(
    PHOTO_POSTS.length ? PHOTO_POSTS[0].id : null
  );

  const current =
    PHOTO_POSTS.find((p) => p.id === currentId) || PHOTO_POSTS[0];

  if (!current) {
    return (
      <div style={{ padding: 24 }}>
        还没有摄影作品，可以在 PHOTO_POSTS 中添加。
      </div>
    );
  }

  return (
    <div className="doc-layout">
      {/* 左侧：作品列表 */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-title">摄影</div>
        <ul className="doc-list">
          {PHOTO_POSTS.map((post) => (
            <li key={post.id}>
              <button
                type="button"
                className={
                  "doc-list-item" +
                  (post.id === current.id ? " doc-list-item-active" : "")
                }
                onClick={() => setCurrentId(post.id)}
              >
                <div className="doc-list-title">{post.title}</div>
                {post.description && (
                  <div className="doc-list-desc">{post.description}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* 中间：大图 + 文案 */}
      <article className="doc-main">
        {current.section && <div className="doc-tag">{current.section}</div>}
        <h1 className="doc-title">{current.title}</h1>
        {current.date && <div className="doc-meta">{current.date}</div>}
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {current.content}
          </ReactMarkdown>
        </div>
      </article>

      {/* 右侧：备注区，可以写拍摄参数等 */}
      <aside className="doc-right">
        <div className="doc-right-card">
          <div className="doc-right-title">拍摄信息</div>
          <div className="doc-right-content">
            <p>{current.description}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
