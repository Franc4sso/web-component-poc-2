(() => {
  // Mock fetch used in the preview to simulate backend validation
  const originalFetch = window.fetch;
  window.fetch = (url, options = {}) => {
    if (url === "/api/secure-data") {
      const token = options.headers?.Authorization?.replace("Bearer ", "") || "";
      console.log("\uD83C\uDFAF Chiamata mock a /api/secure-data con token:", token);

      if (token.includes("EXPIRED")) {
        return Promise.resolve(new Response(null, { status: 401 }));
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({ message: `Accesso autorizzato con token: ${token}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    }
    return originalFetch(url, options);
  };

  // Funzione globale di verifica JWT
  window.ensureJwtValid = async function ensureJwtValid() {
    const token = document.querySelector('meta[name="jwt"]')?.getAttribute('content');
    if (!token) {
      window.dispatchEvent(new CustomEvent('jwt:expired'));
      throw new Error('JWT mancante');
    }

    const res = await fetch('/api/secure-data', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('jwt:expired'));
      throw new Error('JWT scaduto');
    }

    return res.json();
  };

  class ConceptMapLoader extends HTMLElement {
    constructor() {
      super();
      this._handleRequest = this._handleRequest.bind(this);
      this._handleExpired = this._handleExpired.bind(this);
    }

    connectedCallback() {
      this._dispatchToken();
      window.addEventListener('jwt:request', this._handleRequest);
      window.addEventListener('jwt:expired', this._handleExpired);
    }

    disconnectedCallback() {
      window.removeEventListener('jwt:request', this._handleRequest);
      window.removeEventListener('jwt:expired', this._handleExpired);
    }

    _readToken() {
      return document.querySelector('meta[name="jwt"]')?.getAttribute('content') || null;
    }

    _dispatchToken() {
      const token = this._readToken();
      if (token) {
        window.dispatchEvent(new CustomEvent('jwt:refreshed', { detail: { token } }));
      } else {
        window.dispatchEvent(new CustomEvent('jwt:expired'));
      }
    }

    _handleRequest() {
      this._dispatchToken();
    }

    _handleExpired() {
      this._dispatchToken();
    }
  }

  if (!customElements.get('concept-map-loader')) {
    customElements.define('concept-map-loader', ConceptMapLoader);
  }
})();
