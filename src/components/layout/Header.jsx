import React from "react";
import ThemeToggle from "../theme/ThemeToggle";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-logo">
        <span className="site-logo-dot" />
        <span className="site-logo-text">Haotlas</span>
      </div>

      <nav className="site-nav">
        <a href="#about">About</a>
        <a href="#notes">Notes</a>
        <a href="#projects">Projects</a>
      </nav>

      <ThemeToggle />
    </header>
  );
}
