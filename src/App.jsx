import React from "react";
import "./index.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Header from "./components/layout/Header";
import Home from "./pages/Home";

function App() {
  return (
    <ThemeProvider>
      <div className="app-root">
        <div className="site-shell">
          <Header />
          <main>
            <Home />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
