import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components/navigation.css";
import "./styles/components/devices.css";
import "./styles/components/rooms.css";
import "./styles/components/panels.css";
import "./styles/views/operations.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
