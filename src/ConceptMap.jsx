import React, { useEffect, useState, useRef } from "react";
const ConceptMap = () => {
  const [showEditor, setShowEditor] = useState(false);

  const [nodes, setNodes] = useState([
    { id: "1", label: "Concetto iniziale", fx: null, fy: null },
  ]);


  useEffect(() => {
    const el = document.getElementById("conceptMap");
    const openEditorHandler = () => setShowEditor(true);
    el?.addEventListener("concept-map:openEditor", openEditorHandler);
    return () =>
      el?.removeEventListener("concept-map:openEditor", openEditorHandler);
  }, []);


  if(!showEditor) {
    return null;
  }

  return (
    <div
    >
      {showEditor && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <h3>Ho avviato la mappa</h3>
          </div>  
        </>
      )}
    </div>
  );
};

export default ConceptMap;