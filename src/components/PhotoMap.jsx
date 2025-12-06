import React, { useEffect, useRef } from "react";
import { loadAmap } from "../lib/amap";

export default function PhotoMap({ photos, activePhoto }) {
  const mapElRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapElRef.current) return;
    let destroyed = false;

    loadAmap()
      .then((AMap) => {
        if (destroyed || !mapElRef.current) return;

        const map = new AMap.Map(mapElRef.current, {
          zoom: 4,
          center: [104, 35], // 中国大致中心
          viewMode: "3D",
        });
        mapInstanceRef.current = map;

        const markers = [];

        photos
          .filter((p) => p.lng && p.lat)
          .forEach((p) => {
            const marker = new AMap.Marker({
              position: [Number(p.lng), Number(p.lat)],
              title: p.title,
            });
            marker.on("click", () => {
              // 这里只做地图上的交互，真正切换作品仍由 Photography.jsx 控制
              // 你可以以后加回调 props 告诉父组件
            });
            markers.push({ slug: p.slug, marker });
            map.add(marker);
          });

        markersRef.current = markers;

        if (markers.length) {
          const bounds = markers.map((m) => m.marker.getPosition());
          map.setFitView(bounds, false, [40, 40, 40, 40]);
        }
      })
      .catch((e) => {
        console.error("加载高德地图失败：", e);
      });

    return () => {
      destroyed = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [photos]);

  // 当前作品变化时，地图跟着居中 & 高亮
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activePhoto || !activePhoto.lng || !activePhoto.lat) return;

    const lng = Number(activePhoto.lng);
    const lat = Number(activePhoto.lat);

    // 地图居中到当前作品
    map.setZoomAndCenter(8, [lng, lat]);

    // 简单的“高亮”：把对应 marker 放大一点
    markersRef.current.forEach(({ slug, marker }) => {
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
        marker.setIcon(null); // 恢复默认
      }
    });
  }, [activePhoto]);

  return (
    <div className="photo-map-container">
      <div ref={mapElRef} className="photo-map-inner" />
    </div>
  );
}
