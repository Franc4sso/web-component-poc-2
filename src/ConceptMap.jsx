import React, { useEffect, useState, useRef } from "react";

const ConceptMap = ({ mapId, timestamp, hostElement }) => {
  const [visible, setVisible] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const tokenRef = useRef(null);

  // 🔁 Carica o ricarica JWT da <meta>
  const loadTokenFromMeta = () => {
    const jwt = document.querySelector('meta[name="jwt"]')?.getAttribute("content");
    if (jwt && !jwt.includes("EXPIRED")) {
      tokenRef.current = jwt;
      setTokenReady(true);
      console.log(`[${mapId}] ✅ JWT valido caricato:`, jwt);
    } else {
      console.warn(`[${mapId}] 🔒 JWT mancante o scaduto. Richiedo nuovo...`);
      setLoadingToken(true);
      setTokenReady(false);
      window.dispatchEvent(new CustomEvent("jwt:expired", { detail: { source: mapId } }));
    }
  };

  // 🎯 Setup
  useEffect(() => {
    loadTokenFromMeta();

    const toggle = () => setVisible(v => !v);
    hostElement?.addEventListener("concept-map:toggleEditor", toggle);

    const handleJwtRefresh = (e) => {
      const newToken = e.detail?.token;
      if (newToken) {
        tokenRef.current = newToken;
        setLoadingToken(false);
        setTokenReady(true);
        console.log(`[${mapId}] 🔄 Nuovo JWT ricevuto:`, newToken);
      }
    };

    window.addEventListener("jwt:refreshed", handleJwtRefresh);

    return () => {
      hostElement?.removeEventListener("concept-map:toggleEditor", toggle);
      window.removeEventListener("jwt:refreshed", handleJwtRefresh);
    };
  }, []);

  return (
    <div style={{ border: "1px solid #555", padding: "1rem", marginTop: "1rem" }}>
      <h4>🧠 Mappa ID: {mapId}</h4>
      <p>⏱️ Timestamp: {timestamp}</p>

      {visible && (
        <>
          {loadingToken && (
            <div style={{ marginTop: "1rem", color: "#0af" }}>
              🔄 Autenticazione in corso...
              <span className="spinner" style={{
                display: "inline-block",
                marginLeft: "0.5rem",
                width: "1rem",
                height: "1rem",
                border: "2px solid #0af",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }}></span>
            </div>
          )}

          {tokenReady && (
            <p style={{ color: "#0f0" }}>🔓 Editor attivo con token valido</p>
          )}
        </>
      )}
    </div>
  );
};

export default ConceptMap;
