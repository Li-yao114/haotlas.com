import React, { useState } from "react";
import "./index.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Writing from "./pages/Writing";
import Photography from "./pages/Photography";
import About from "./pages/About";
import Landing from "./pages/Landing";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/typography.css";
import "./styles/theme.css";
import "./styles/transitions.css";

const PAGES = {
  HOME: "home",
  WRITING: "writing",
  PHOTOGRAPHY: "photography",
  ABOUT: "about",
};

function App() {
  const [page, setPage] = useState(PAGES.HOME);
  const [entered, setEntered] = useState(false); // 是否已经进站
  const [isTransitioning, setIsTransitioning] = useState(false);

  const changePage = (next) => {
    if (next === page) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setPage(next);
      setIsTransitioning(false);
    }, 260); // 和 CSS 动画时间对齐
  };

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
        <div className="app-root">
          <div className="site-shell">
            <Header
              currentPage={page}
              onChangePage={changePage}
              onBackLanding={() => setEntered(false)}
            />
            <main className="site-main">{renderPage()}</main>
            <Footer />
          </div>

          {isTransitioning && (
            <div className="page-transition-overlay">
              <div className="page-transition-spinner" />
            </div>
          )}
        </div>
      ) : (
        <Landing onEnter={() => setEntered(true)} />
      )}
    </ThemeProvider>
  );
}

export default App;
