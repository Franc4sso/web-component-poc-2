import React, { useEffect, useState, useRef } from "react";

const ConceptMap = ({ mapId, timestamp, hostElement }) => {
  const [visible, setVisible] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenReady, setTokenReady] = useState(false);
  const tokenRef = useRef(null);

  // 🎯 Setup
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("jwt:request"));

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
