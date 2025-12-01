// src/App.jsx
import React, { useState } from "react";
import "./index.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Header from "./components/layout/Header";
import Home from "./pages/Home";
import Writing from "./pages/Writing";
import Photography from "./pages/Photography";
import About from "./pages/About";
import Landing from "./pages/Landing";

const PAGES = {
  HOME: "home",
  WRITING: "writing",
  PHOTOGRAPHY: "photography",
  ABOUT: "about",
};

function App() {
  const [page, setPage] = useState(PAGES.HOME);
  // 是否已经“进站”
  const [entered, setEntered] = useState(false);

  const renderPage = () => {
    switch (page) {
      case PAGES.WRITING:
        return <Writing />;
      case PAGES.PHOTOGRAPHY:
        return <Photography />;
      case PAGES.ABOUT:
        return <About />;
      case PAGES.HOME:
      default:
        return <Home />;
    }
  };

  return (
    <ThemeProvider>
      {entered ? (
        // 进入站点之后的布局
        <div className="app-root">
          <div className="site-shell">
            <Header
              currentPage={page}
              onChangePage={setPage}
              onBackLanding={() => setEntered(false)}
            />
            <main className="site-main">{renderPage()}</main>
          </div>
        </div>
      ) : (
        // 进站页：不再套 app-root，直接全屏
        <Landing onEnter={() => setEntered(true)} />
      )}
    </ThemeProvider>
  );  
}

export default App;
export { PAGES };
