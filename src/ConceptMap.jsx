import React, { useEffect, useState } from "react";

const ConceptMap = ({ mapId, timestamp, hostElement }) => {
  const [visible, setVisible] = useState(false);

  // Toggle visibilità
  useEffect(() => {
    const toggle = () => setVisible(v => !v);
    hostElement?.addEventListener("concept-map:toggleEditor", toggle);
    return () => hostElement?.removeEventListener("concept-map:toggleEditor", toggle);
  }, [hostElement]);

  return (
    <div style={{ border: "1px solid #555", padding: "1rem", marginTop: "1rem" }}>
      <h4>Mappa ID: {mapId}</h4>
      <p>Timestamp: {timestamp}</p>
      {visible && <p>Editor attivo</p>}
    </div>
  );
};

export default ConceptMap;
