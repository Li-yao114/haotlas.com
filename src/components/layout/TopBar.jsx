import React from "react";
import ThemeToggle from "../theme/ThemeToggle";

export default function TopBar() {
  return (
    <div
      className="card"
      style={{
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600 }}>Haotlas · Home</div>
      <ThemeToggle />
    </div>
  );
}
