import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from './C/TC';
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./C/AP";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>
);