import React from "react";
import "./index.css";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import ShellLayout from "./components/layout/ShellLayout";
import Home from "./pages/Home";

function App() {
  return (
    <ThemeProvider>
      <ShellLayout>
        {/* 以后这里换成路由 <Router> */}
        <Home />
      </ShellLayout>
    </ThemeProvider>
  );
}

export default App;
