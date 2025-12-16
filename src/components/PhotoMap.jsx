// src/components/PhotoMap.jsx
import React, { useEffect, useRef } from "react";
import { loadAmap } from "../lib/amap";

const FALLBACK_CENTER = [104, 35];
const FALLBACK_ZOOM = 5;

// 把经纬度安全解析成 [lng, lat]
function parseLngLat(rawLng, rawLat) {
  if (rawLng == null || rawLat == null) return null;

  const lng =
    typeof rawLng === "string" ? Number(rawLng.trim()) : Number(rawLng);
  const lat =
    typeof rawLat === "string" ? Number(rawLat.trim()) : Number(rawLat);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

export default function PhotoMap({ photos, activePhoto }) {
  const mapElRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // 初始化地图 & 所有点
  useEffect(() => {
    if (!mapElRef.current) return;
    let destroyed = false;

    loadAmap()
      .then((AMap) => {
        if (destroyed || !mapElRef.current) return;

        let map;
        try {
          // 默认 2D 底图（不加 mapStyle）
          map = new AMap.Map(mapElRef.current, {
            zoom: FALLBACK_ZOOM,
            center: FALLBACK_CENTER,
            viewMode: "2D",
          });
        } catch (e) {
          console.error("[PhotoMap] 创建地图失败：", e);
          return;
        }

        mapInstanceRef.current = map;
        markersRef.current = [];

        const markerOverlays = [];

        photos.forEach((p) => {
          const coord = parseLngLat(p.lng, p.lat);
          if (!coord) {
            console.warn(
              "[PhotoMap] 跳过无效坐标：",
              p.slug || p.title,
              p.lng,
              p.lat
            );
            return;
          }

          try {
            const marker = new AMap.Marker({
              position: coord,
              title: p.title,
            });

            markerOverlays.push(marker);
            markersRef.current.push({ slug: p.slug, marker });
            map.add(marker);
          } catch (e) {
            console.error("[PhotoMap] 创建 marker 失败：", p, e);
          }
        });

        if (markerOverlays.length) {
          try {
            map.setFitView(markerOverlays, false, [40, 40, 40, 40]);
          } catch (e) {
            console.error("[PhotoMap] setFitView 失败：", e);
          }
        }
      })
      .catch((err) => {
        console.error("[PhotoMap] 加载高德失败：", err);
      });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, [photos]);

  // 当前作品变化：地图跟随 + 高亮
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activePhoto) return;

    const coord = parseLngLat(activePhoto.lng, activePhoto.lat);
    if (!coord) {
      console.warn("[PhotoMap] 当前作品坐标无效，跳过居中：", activePhoto);
      return;
    }

    const [lng, lat] = coord;

    try {
      map.setZoomAndCenter(13, [lng, lat]); // 稍微拉近一点
    } catch (e) {
      console.error("[PhotoMap] setZoomAndCenter 失败：", e);
    }

    markersRef.current.forEach(({ slug, marker }) => {
      try {
        if (slug === activePhoto.slug) {
          marker.setzIndex(200);
          marker.setIcon(
            new window.AMap.Icon({
              size: new window.AMap.Size(32, 32),
              imageSize: new window.AMap.Size(32, 32),
              image:
                "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png",
            })
          );
        } else {
          marker.setzIndex(100);
          marker.setIcon(null);
        }
      } catch (e) {
        console.error("[PhotoMap] 更新 marker 样式失败：", slug, e);
      }
    });
  }, [activePhoto]);

  return (
    <div className="photo-map-container">
      <div ref={mapElRef} className="photo-map-inner" />
    </div>
  );
}
