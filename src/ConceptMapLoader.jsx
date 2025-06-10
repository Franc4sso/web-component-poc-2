import { useEffect } from "react";

const ConceptMapLoader = ({ hostElement }) => {
  useEffect(() => {
    const token = document.querySelector('meta[name="jwt"]')?.getAttribute("content");

    const handleNewMap = (e) => {
      const el = e.detail?.element;
      if (!el || el.tagName !== "CONCEPT-MAP") return;

      // Simula validazione token con una fetch
      fetch("/api/secure-data", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401) {
            window.dispatchEvent(new CustomEvent("jwt:expired"));
            throw new Error("JWT scaduto");
          }
          return res.json();
        })
        .then(() => {
          el.dispatchEvent(new CustomEvent("concept-map:setToken", {
            detail: { token },
            bubbles: true,
          }));
        });
    };

    window.addEventListener("concept-map-loader:new-map", handleNewMap);
    return () => {
      window.removeEventListener("concept-map-loader:new-map", handleNewMap);
    };
  }, [hostElement]);

  return null;
};

export default ConceptMapLoader;
