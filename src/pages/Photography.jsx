// src/pages/Photography.jsx
import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  loadPhotographyIndex,
  loadMarkdown,
} from "../lib/content";
import PhotoMap from "../components/PhotoMap";

// 轮播
function PhotoCarousel({ photos, activeSlug, onSelect }) {
  const stripRef = useRef(null);

  useEffect(() => {
    if (!stripRef.current || !activeSlug) return;
    const index = photos.findIndex((p) => p.slug === activeSlug);
    if (index === -1) return;
    const node = stripRef.current.children[index];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSlug, photos]);

  const scrollBy = (delta) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="photo-carousel">
      <button
        type="button"
        className="photo-nav photo-nav-prev"
        onClick={() => scrollBy(-320)}
      >
        ‹
      </button>

      <div className="photo-strip" ref={stripRef}>
        {photos.map((p) => (
          <div
            key={p.slug}
            className={
              "photo-item" +
              (p.slug === activeSlug ? " photo-item-active" : "")
            }
            onClick={() => onSelect(p)}
          >
            <img src={p.cover} alt={p.title} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="photo-nav photo-nav-next"
        onClick={() => scrollBy(320)}
      >
        ›
      </button>
    </div>
  );
}

// 放大弹窗
function Lightbox({ photo, onClose }) {
  if (!photo) return null;
  return (
    <div className="lightbox" onClick={onClose}>
      <img
        src={photo.cover}
        alt={photo.title}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function Photography() {
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBody, setLoadingBody] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // 加载索引
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const index = await loadPhotographyIndex();

        // 按日期排序：旧 -> 新
        index.sort((a, b) => new Date(a.date) - new Date(b.date));

        setPosts(index);
        if (index.length) {
          setCurrent(index[index.length - 1]); // 默认选最新一组
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // 加载当前作品正文（md）
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
        setBody("加载作品介绍失败，请稍后再试。");
      } finally {
        setLoadingBody(false);
      }
    }

    loadBody();
  }, [current]);

  if (loading) {
    return <div style={{ padding: 24 }}>正在加载摄影作品...</div>;
  }

  if (!posts.length) {
    return <div style={{ padding: 24 }}>还没有摄影作品。</div>;
  }

  return (
    <>
      <div className="doc-layout">
        {/* 左侧列表 */}
        <aside className="doc-sidebar">
          <div className="doc-sidebar-title">摄影</div>
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

        {/* 中间：轮播 + 文案 */}
        <article className="doc-main">
          <div className="doc-tag">PHOTOGRAPHY</div>
          <h1 className="doc-title">{current.title}</h1>
          <div className="doc-meta">{current.date}</div>

          <PhotoCarousel
            photos={posts}
            activeSlug={current.slug}
            onSelect={(p) => {
              setCurrent(p);
              setLightboxPhoto(p); // 点击时顺便放大
            }}
          />

          {loadingBody ? (
            <div style={{ marginTop: 12 }}>正在加载作品介绍...</div>
          ) : (
            <div className="markdown-body" style={{ marginTop: 16 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {body}
              </ReactMarkdown>
            </div>
          )}
        </article>

        {/* 右侧：地图占位 */}
        <aside className="doc-right">
          <div className="doc-right-card">
            <div className="doc-right-title">拍摄地点</div>
            <div className="doc-right-content">
              {current.lat && current.lng ? (
                <p>
                  坐标：{current.lat}, {current.lng}
                  <br />
                  地图标记见下方。
                </p>
              ) : (
                <p>这组照片还没有记录坐标。</p>
              )}
            </div>
          </div>
          {/* 下面是真正的地图 */}
          <PhotoMap photos={posts} activePhoto={current} />
        </aside>
      </div>

      {/* 放大图层 */}
      <Lightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </>
  );
}
