import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MotionConfig } from "framer-motion";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/500.css";
import "@fontsource/ubuntu/700.css";
import "@fontsource/ubuntu-mono/400.css";
import "@fontsource/ubuntu-mono/700.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components/navigation.css";
import "./styles/components/devices.css";
import "./styles/components/rooms.css";
import "./styles/components/panels.css";
import "./styles/views/operations.css";
import "./styles/refinements.css";
import "./styles/motion.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user"><App /></MotionConfig>
  </React.StrictMode>,
);
