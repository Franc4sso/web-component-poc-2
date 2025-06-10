function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

async function fetchNewJWT() {
  const response = await fetch("https://concept-maps-api.onrender.com/api/regenerate-jwt", {
    method: "GET", 
    credentials: "include", 
  });

  if (!response.ok) {
    throw new Error("Impossibile rigenerare il JWT");
  }

  const {jwt} = await response.json(); 

  console.log(jwt);
  
  
  document.cookie = `jwt=${jwt}; path=/`;
  return jwt;
}

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

class ConceptMapAssociator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.addEventListener("requestJwt", async (e) => {
      const callback = e.detail?.callback;
      try {
        const newJwt = await fetchNewJWT();
        if (typeof callback === "function") {
          callback(newJwt);
        }
      } catch (err) {
        console.error("Errore nel recupero nuovo JWT:", err);
      }
    });

    this.addEventListener("getMaps", async (e) => {
      const callback = e.detail?.callback;

      try {
        const maps = await this.getOrderedMaps();
        if (typeof callback === "function") {
          callback(maps);
        }
      } catch (err) {
        console.error("Errore nel recupero delle mappe:", err);
      }
    });

    this.addEventListener("createMap", async (e) => {
      const payload = e.detail;
      const callback = payload?.callback;

      const attemptCreate = async (token) => {
        const createRes = await fetch(
          "https://concept-maps-api.onrender.com/api/concept-maps",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            body: JSON.stringify({
              map_data: {
                title: payload.name || "Mappa nuova",
                nodes: [{ id: 1, label: "Concetto A" }],
                edges: [],
              },
               teaching_subject: payload.teaching_subject,
                specific_lesson: payload.lesson,
                timestamp: payload.timestamp,
                lesson_paragraph: payload.lesson_paragraph,
                association_type: payload.indexing_type,
                live_lesson_id: 1,
            }),
          }
        );

        if (createRes.status === 401) {
          console.warn("JWT scaduto in createMap, rigenero...");
          const newJwt = await fetchNewJWT();
          return attemptCreate(newJwt); // retry
        }

        if (!createRes.ok) {
          console.error(
            "Errore nella creazione della mappa:",
            createRes.statusText
          );
          return;
        }

        const created = await createRes.json();
        const conceptMapId = created.id;

        if (typeof callback === "function") {
          callback(conceptMapId);
        }
      };

      try {
        const jwt = await this.getJwtOrFetch();
        await attemptCreate(jwt);
      } catch (err) {
        console.error(
          "Errore durante la creazione o associazione della mappa:",
          err
        );
      }
    });
  }

  async getJwtOrFetch() {
    let jwt = getCookie("jwt");
    if (!jwt) jwt = await fetchNewJWT();
    return jwt;
  }

  async getOrderedMaps() {
    let jwt = await this.getJwtOrFetch();
    let decoded = parseJwt(jwt);
    let userId = decoded?.id;

    const fetchMaps = async (token) => {
      const res = await fetch(
        `https://concept-maps-api.onrender.com/api/users/${userId}/concept-maps?type=lesson`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (res.status === 401) {
        console.warn("JWT scaduto, rigenero...");
        const newJwt = await fetchNewJWT();
        return fetchMaps(newJwt);
      }

      if (!res.ok) {
        throw new Error(
          `Errore nella richiesta delle mappe: ${res.statusText}`
        );
      }

      const data = await res.json();
      return data
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .map((mappa) => mappa.concept_map_id);
    };

    return fetchMaps(jwt);
  }
}

customElements.define("concept-map-associator", ConceptMapAssociator);
