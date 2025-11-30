import React from "react";

export default function Sidebar() {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff375f, #0a84ff)",
          }}
        />
        <div>
          <div style={{ fontWeight: 600 }}>Haotlas</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            haotlas.com
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14 }}>
        {/* 后面可以改成可点击的菜单 */}
        <div style={{ padding: "8px 4px" }}>🏠 首页</div>
        <div style={{ padding: "8px 4px" }}>📝 博客</div>
      </div>
    </div>
  );
}
