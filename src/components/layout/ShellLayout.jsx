import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function ShellLayout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-main)",
        padding: 16,
        gap: 16,
      }}
    >
      {/* 左侧栏 */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      {/* 右侧内容区 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <TopBar />
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
