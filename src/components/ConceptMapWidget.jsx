import React from "react";
import ReactDOM from "react-dom/client";
import ConceptMap from "./ConceptMap";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

async function fetchMapDetails(mapId, jwt) {
  const etagKey = `mapETag_${mapId}`;
  const dataKey = `mapData_${mapId}`;

  const savedETag = localStorage.getItem(etagKey);
  const cachedData = localStorage.getItem(dataKey);

  const headers = {
    Authorization: `Bearer ${jwt}`,
    Accept: "application/json",
  };

  if (savedETag) {
    headers["If-None-Match"] = savedETag;
  }

  const response = await fetch(
    `https://concept-maps-api.onrender.com/api/concept-maps/${mapId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (response.status === 401) {
    console.warn("JWT scaduto, richiesta nuovo token...");
    return "token-expired";
  }

  if (response.status === 304 && cachedData) {
    console.log(
      `[ETag] Mappa ${mapId} non modificata. Uso dati da cache Cache Hit'`
    );
    return JSON.parse(cachedData);
  }

  // Se errore
  if (!response.ok) {
    console.error(
      `Errore nel recupero della mappa ${mapId}:`,
      response.statusText
    );
    return null;
  }

  const newData = await response.json();

  const newETag = response.headers.get("etag");

  if (newETag) {
    localStorage.setItem(etagKey, newETag);
    localStorage.setItem(dataKey, JSON.stringify(newData));
  }

  return newData;
}

class ConceptMapWebComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._mount = document.createElement("div");
    this.shadowRoot.appendChild(this._mount);
    this._mapId = this.getAttribute("map-id");
  }

  static get observedAttributes() {
    return ["map-id"];
  }

  connectedCallback() {
    this._loadDataAndRender();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "map-id" && oldValue !== newValue) {
      this._mapId = newValue;
      this._loadDataAndRender();
    }
  }

  _render(mapDetails) {
  const root = ReactDOM.createRoot(this._mount);
  root.render(<ConceptMap {...mapDetails} />);
}

  async _loadDataAndRender() {
    const jwt = getCookie("jwt");
    if (!jwt || !this._mapId) return;

    let details = await fetchMapDetails(this._mapId, jwt);

    if (details === "token-expired") {
      this.dispatchEvent(
        new CustomEvent("requestJwt", {
          bubbles: true,
          composed: true,
          detail: {
            callback: async (newJwt) => {
              const retried = await fetchMapDetails(this._mapId, newJwt);
              this._render(retried);
            },
          },
        })
      );
      return;
    }

    this._render(details);
  }
}

customElements.define("concept-map-widget", ConceptMapWebComponent);
