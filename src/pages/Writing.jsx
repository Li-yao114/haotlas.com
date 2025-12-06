import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  loadWritingIndex,
  loadMarkdown,
} from "../lib/content";

export default function Writing() {
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBody, setLoadingBody] = useState(false);

  // 加载索引
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const index = await loadWritingIndex();

        // 按日期排序：旧 -> 新（旧的在上，新文章在下面）
        index.sort((a, b) => new Date(a.date) - new Date(b.date));

        setPosts(index);

        if (index.length) {
          // 默认选最新一篇
          setCurrent(index[index.length - 1]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // 加载当前文章正文
  useEffect(() => {
    if (!current) {
      setBody("");
      return;
    }

    async function loadBody() {
      try {
        setLoadingBody(true);
        const { body } = await loadMarkdown(current.file);
        setBody(body);
      } catch (e) {
        console.error(e);
        setBody("加载文章失败，请稍后再试。");
      } finally {
        setLoadingBody(false);
      }
    }

    loadBody();
  }, [current]);

  if (loading) {
    return <div style={{ padding: 24 }}>正在加载文稿...</div>;
  }

  if (!posts.length) {
    return <div style={{ padding: 24 }}>还没有文稿。</div>;
  }

  return (
    <div className="doc-layout">
      {/* 左侧列表 */}
      <aside className="doc-sidebar">
        <div className="doc-sidebar-title">文稿</div>
        <ul className="doc-list">
          {posts.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                className={
                  "doc-list-item" +
                  (p.slug === current?.slug ? " doc-list-item-active" : "")
                }
                onClick={() => setCurrent(p)}
              >
                <div className="doc-list-title">{p.title}</div>
                {p.summary && (
                  <div className="doc-list-desc">{p.summary}</div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* 中间正文 */}
      <article className="doc-main">
        <div className="doc-tag">WRITING</div>
        <h1 className="doc-title">{current.title}</h1>
        <div className="doc-meta">
          {current.date}
          {current.lang ? ` · ${current.lang}` : null}
        </div>

        {loadingBody ? (
          <div style={{ marginTop: 12 }}>正在加载正文...</div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {body}
            </ReactMarkdown>
          </div>
        )}
      </article>

      {/* 右侧信息 */}
      <aside className="doc-right">
        <div className="doc-right-card">
          <div className="doc-right-title">当前文稿</div>
          <div className="doc-right-content">
            <p>{current.summary || "这篇文稿还没有摘要。"}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
