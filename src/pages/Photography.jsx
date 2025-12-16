import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadPhotographyIndex, loadMarkdown } from "../lib/content";
import PhotoMap from "../components/PhotoMap";
import "./Photography.css";

function PhotoCarousel({ images, activeIndex, onChangeIndex, onClickImage }) {
  const stripRef = useRef(null);
  const suppressCenterRef = useRef(false);

  const hasImages = Array.isArray(images) && images.length > 0;
  const total = hasImages ? images.length : 0;

  // activeIndex 变化时，把当前图滚到中间（除非是滚动触发的）
  useEffect(() => {
    if (!hasImages || !stripRef.current) return;

    if (suppressCenterRef.current) {
      suppressCenterRef.current = false;
      return;
    }

    const node = stripRef.current.children[activeIndex];
    if (!node) return;

    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeIndex, hasImages, images]);

  // 监听水平滚动，根据“谁最靠近容器中线”更新 activeIndex
  useEffect(() => {
    if (!hasImages || !stripRef.current) return;

    const strip = stripRef.current;
    let frameId = 0;

    const handleScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const { left, width } = strip.getBoundingClientRect();
        const centerX = left + width / 2;

        let nearestIdx = 0;
        let minDist = Infinity;

        Array.from(strip.children).forEach((child, idx) => {
          const rect = child.getBoundingClientRect();
          const childCenter = rect.left + rect.width / 2;
          const dist = Math.abs(childCenter - centerX);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = idx;
          }
        });

        if (nearestIdx !== activeIndex) {
          suppressCenterRef.current = true;
          onChangeIndex(nearestIdx);
        }
      });
    };

    strip.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      strip.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(frameId);
    };
  }, [activeIndex, hasImages, onChangeIndex]);

  if (!hasImages) return null;

  // 根据和当前索引的“距离”给不同 class，实现中间大、两边小
  const getItemClass = (idx) => {
    const rawDiff = Math.abs(idx - activeIndex);
    const diff = total > 0 ? Math.min(rawDiff, total - rawDiff) : rawDiff;
    if (diff === 0) return "photo-item photo-item-active";
    if (diff === 1) return "photo-item photo-item-near";
    return "photo-item photo-item-far";
  };

  // 左右按钮：索引循环
  const go = (dir) => {
    if (!hasImages) return;
    const next = (activeIndex + dir + total) % total;
    onChangeIndex(next);
  };

  return (
    <div className="photo-carousel">
      <button
        type="button"
        className="photo-nav photo-nav-prev"
        onClick={() => go(-1)}
      >
        ‹
      </button>

      <div className="photo-strip" ref={stripRef}>
        {images.map((img, idx) => {
          const src = typeof img === "string" ? img : img.src;
          const caption = typeof img === "string" ? "" : img.caption;

          return (
            <div
              key={idx}
              className={getItemClass(idx)}
              onClick={() => {
                onChangeIndex(idx);
                onClickImage?.(idx);
              }}
            >
              <img src={src} alt={caption || `photo-${idx + 1}`} />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="photo-nav photo-nav-next"
        onClick={() => go(1)}
      >
        ›
      </button>
    </div>
  );
}

/**
 * 放大图层
 */
function Lightbox({ images, activeIndex, open, onClose }) {
  if (!open || !images || !images.length) return null;

  const img = images[activeIndex] ?? images[0];
  const src = typeof img === "string" ? img : img.src;
  const caption = typeof img === "string" ? "" : img.caption;

  return (
    <div className="lightbox" onClick={onClose}>
      <img
        src={src}
        alt={caption || `photo-${activeIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/**
 * 主组件：摄影页面
 */
export default function Photography() {
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingBody, setLoadingBody] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 初始化：加载摄影索引
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const index = await loadPhotographyIndex();

        index.sort((a, b) => new Date(a.date) - new Date(b.date));

        setPosts(index);
        if (index.length) {
          setCurrent(index[index.length - 1]); // 默认选最新一组
        }
      } catch (e) {
        console.error("[Photography] 加载索引失败：", e);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // 当前作品变化：重置轮播索引
  useEffect(() => {
    setActiveImageIndex(0);
  }, [current]);

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
        console.error("[Photography] 加载正文失败：", e);
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

  // ---------- 计算图片 & 地图点位 ----------

  const images =
    current?.images && current.images.length
      ? current.images
      : current?.cover
      ? [current.cover]
      : [];

  const activeImage = images[activeImageIndex];
  const activeCaption =
    activeImage && typeof activeImage === "object"
      ? activeImage.caption
      : "";

  const mapPoints = images.length
    ? images.map((img, idx) => {
        const obj = typeof img === "string" ? {} : img;
        return {
          slug: `${current.slug}-${idx}`,
          title: obj.caption || current.title,
          lng: obj.lng ?? current.lng,
          lat: obj.lat ?? current.lat,
        };
      })
    : current && current.lat && current.lng
    ? [
        {
          slug: current.slug,
          title: current.title,
          lng: current.lng,
          lat: current.lat,
        },
      ]
    : [];

  const activePoint = mapPoints[activeImageIndex] || mapPoints[0] || null;

  // ⭐ 当前这张图的拍摄参数（优先用图片对象上的字段，没有就用当前作品上的）
  const activeObj =
    activeImage && typeof activeImage === "object" ? activeImage : null;
  const exifSource = activeObj || current || {};
  const exif = {
    camera: exifSource.camera,
    lens: exifSource.lens,
    aperture: exifSource.aperture || exifSource.f,
    shutter: exifSource.shutter,
    iso: exifSource.iso,
  };
  const hasExif =
    exif.camera || exif.lens || exif.aperture || exif.shutter || exif.iso;

  // ---------- 渲染 ----------

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

        {/* 中间：标题 + 轮播 + 文案 */}
        <article className="doc-main">
          <div className="doc-tag">PHOTOGRAPHY</div>
          <h1 className="doc-title">{current.title}</h1>
          <div className="doc-meta">{current.date}</div>

          <div className="doc-main-divider" />

          <PhotoCarousel
            images={images}
            activeIndex={activeImageIndex}
            onChangeIndex={(idx) => setActiveImageIndex(idx)}
            onClickImage={() => setLightboxOpen(true)}
          />

          {activeCaption && (
            <div className="photo-caption">{activeCaption}</div>
          )}

          {loadingBody ? (
            <div style={{ marginTop: 12 }}>正在加载作品介绍...</div>
          ) : (
            <div
              className="markdown-body photo-article-body"
              style={{ marginTop: 24 }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {body}
              </ReactMarkdown>
            </div>
          )}
        </article>

        {/* 右侧：拍摄信息 + 拍摄地点 + 地图 */}
        <aside className="doc-right">
          {/* ⭐ 新增：拍摄信息卡片，跟随 activeImage 变化 */}
          <div className="doc-right-card">
            <div className="doc-right-title">拍摄信息</div>
            <div className="doc-right-content">
              {hasExif ? (
                <ul style={{ paddingLeft: "1.1rem", margin: 0 }}>
                  {exif.camera && <li>机身：{exif.camera}</li>}
                  {exif.lens && <li>镜头：{exif.lens}</li>}
                  {exif.aperture && <li>光圈：{exif.aperture}</li>}
                  {exif.shutter && <li>快门：{exif.shutter}</li>}
                  {exif.iso && <li>ISO：{exif.iso}</li>}
                </ul>
              ) : (
                <p>这张照片还没有记录拍摄参数。</p>
              )}
            </div>
          </div>

          {/* 原来的拍摄地点卡片，下移到“拍摄信息”下面，并继续跟随当前图片 */}
          <div className="doc-right-card">
            <div className="doc-right-title">拍摄地点</div>
            <div className="doc-right-content">
              {activePoint && activePoint.lat && activePoint.lng ? (
                <p>
                  坐标：{activePoint.lat.toFixed(6)},{" "}
                  {activePoint.lng.toFixed(6)}
                  <br />
                  地图标记见下方。
                </p>
              ) : (
                <p>这张照片还没有记录坐标。</p>
              )}
            </div>
          </div>

          {/* 地图本体仍然使用 mapPoints + activePoint */}
          <PhotoMap photos={mapPoints} activePhoto={activePoint} />
        </aside>
      </div>

      {/* 放大图层 */}
      <Lightbox
        images={images}
        activeIndex={activeImageIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
