import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/theme";

import "@fontsource/barlow-semi-condensed/400.css";
import "@fontsource/barlow-semi-condensed/500.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "@fontsource/google-sans-flex/200.css";
import "@fontsource/google-sans-flex/300.css";
import "@fontsource/google-sans-flex/400.css";
import "@fontsource/google-sans-flex/500.css";
import "@fontsource/google-sans-flex/600.css";
import "@fontsource/google-sans-flex/700.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
