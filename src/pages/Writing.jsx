// src/pages/Writing.jsx
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const WRITING_POSTS = [
  {
    id: "python-crawler",
    section: "TECHNOLOGY",
    title: "Python 爬虫入门学习",
    description: "实验室需要大量文本数据支撑，用 Python 写爬虫抓取网页信息的记录。",
    date: "2024-01-01",
    file: "/writing/python-crawler.md", // ← 对应 public/writing/python-crawler.md
  },
  // 以后新增一篇，只要再加一条对象即可
];

export default function Writing() {
  const [currentId, setCurrentId] = useState(
    WRITING_POSTS.length ? WRITING_POSTS[0].id : null
  );
  const [content, setContent] = useState("");

  const current =
    WRITING_POSTS.find((p) => p.id === currentId) || WRITING_POSTS[0];

  useEffect(() => {
    if (!current || !current.file) return;

    fetch(current.file)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => setContent("加载文章失败，请稍后再试。"));
  }, [current]);

  if (!current) {
    return <div style={{ padding: 24 }}>还没有文稿，可以在 WRITING_POSTS 中添加。</div>;
  }

  return (
    <div className="doc-layout">
      <aside className="doc-sidebar">
        <div className="doc-sidebar-title">文稿</div>
        <ul className="doc-list">
          {WRITING_POSTS.map((post) => (
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

      <article className="doc-main">
        {current.section && <div className="doc-tag">{current.section}</div>}
        <h1 className="doc-title">{current.title}</h1>
        {current.date && <div className="doc-meta">{current.date}</div>}

        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </article>

      <aside className="doc-right">
        <div className="doc-right-card">
          <div className="doc-right-title">当前文稿</div>
          <div className="doc-right-content">
            <p>{current.description}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
