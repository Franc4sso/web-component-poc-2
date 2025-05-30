import React from "react";
import ReactDOM from "react-dom/client";
import ConceptMap from "./ConceptMap";

class ConceptMapElement extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement("div");
    this.appendChild(mountPoint);

    const mapId = this.getAttribute("map-id") || null;
    const timestamp = this.getAttribute("data-timestamp") || null;

    const root = ReactDOM.createRoot(mountPoint);
    root.render(<ConceptMap mapId={mapId} timestamp={timestamp} hostElement={this} />);
  }
}

if (!customElements.get("concept-map")) {
  customElements.define("concept-map", ConceptMapElement);
}

export default ConceptMapElement;
