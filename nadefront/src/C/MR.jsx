import { useEffect, useState } from "react";
import Maintenance from "../pages/maintenance";

export default function MR({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        // check config flag
        const res = await fetch("/config.json", { cache: "no-store" });
        const data = await res.json();

        if (!data.maintenanceMode) {
          setAuthorized(true);
          return;
        }

        const apiBase = import.meta.env.VITE_API_URL;

        // if ?access= exists, send it to backend to create session
        const params = new URLSearchParams(window.location.search);
        const access = params.get("access");

        if (access) {
          const loginRes = await fetch(`${apiBase}/maintenance/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ access }),
          });

          // remove secret from URL no matter what
          params.delete("access");
          const newQuery = params.toString();
          const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${window.location.hash || ""}`;
          window.history.replaceState({}, document.title, newUrl);

          // if login failed, fall through to /maintenance/me check
          // (don’t early return here)
        }

        const meRes = await fetch(`${apiBase}/maintenance/me`, {
          credentials: "include",
        });

        if (!meRes.ok) {
          setAuthorized(false);
          return;
        }

        const me = await meRes.json();
        setAuthorized(!!me.ok);
      } catch (err) {
        console.error("MR error:", err);
        setAuthorized(true);
      } finally {
        setChecking(false);
      }
    };

    run();
  }, []);

  if (checking) return null;
  return authorized ? children : <Maintenance />;
}