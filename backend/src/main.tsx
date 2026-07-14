import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import Router from "./routes";
import { ApiUrlProvider } from "./hooks/useApiUrl";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <ApiUrlProvider>
      <Router />
    </ApiUrlProvider>
  </React.StrictMode>
);
