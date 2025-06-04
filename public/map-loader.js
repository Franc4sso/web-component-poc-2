      const originalFetch = window.fetch;
      window.fetch = (url, options = {}) => {
        if (url === "/api/secure-data") {
          const token = options.headers?.Authorization?.replace("Bearer ", "") || "";
          console.log("🎯 Chiamata mock a /api/secure-data con token:", token);

          if (token.includes("EXPIRED")) {
            return Promise.resolve(new Response(null, { status: 401 }));
          }

          return Promise.resolve(
            new Response(JSON.stringify({ message: `Accesso autorizzato con token: ${token}` }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            })
          );
        }

        return originalFetch(url, options);
      };

      const container = document.getElementById("lesson-content");
      const spinner = document.getElementById("cm-spinner");

      const data = [
        { type: "map", id: "101", timestamp: "00:03:20", title: "Mappa A" },
        { type: "map", id: "102", timestamp: "00:01:10", title: "Mappa B" },
        { type: "map", id: "103", timestamp: "00:04:50", title: "Mappa C" }
      ];
      let mapId = 1000, noteId = 2000;

      window.addEventListener("jwt:expired", () => {
        if (window.__jwtRefreshing) return;
        window.__jwtRefreshing = true;
        spinner.style.display = "block";

        setTimeout(() => {
          const token = "FAKE-JWT-" + Math.random().toString(36).slice(2);
          document.querySelector('meta[name="jwt"]').setAttribute("content", token);
          window.dispatchEvent(new CustomEvent("jwt:refreshed", { detail: { token } }));
          spinner.style.display = "none";
          window.__jwtRefreshing = false;
        }, 1000);
      });

      async function ensureJwtValid() {
        const token = document.querySelector('meta[name="jwt"]')?.getAttribute("content");

        if (!token) {
          window.dispatchEvent(new CustomEvent("jwt:expired"));
          throw new Error("JWT mancante");
        }

        const res = await fetch("/api/secure-data", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent("jwt:expired"));
          throw new Error("JWT scaduto");
        }

        return await res.json();
      }

      document.body.addEventListener("click", async (e) => {
        const action = e.target.getAttribute("data-cm-action");
        if (!action) return;

        if (action === "expire") {
          document.querySelector('meta[name="jwt"]').setAttribute("content", "EXPIRED-TOKEN");
          window.dispatchEvent(new CustomEvent("jwt:expired"));
          return;
        }

        spinner.style.display = "block";

        try {
          await ensureJwtValid();

          if (action === "create") {
            const type = prompt("Tipo contenuto (mappa / nota)", "mappa")?.toLowerCase();
            if (!['mappa','nota'].includes(type)) throw new Error("Tipo non valido");

            const timestamp = prompt("Timestamp (HH:MM:SS)", "00:05:00");
            if (!/^\d{2}:\d{2}:\d{2}$/.test(timestamp)) throw new Error("Timestamp non valido");

            const content = prompt("Contenuto:", type === "mappa" ? "Nuova mappa" : "Nota del docente");
            if (!content) throw new Error("Contenuto vuoto");

            const id = type === "mappa" ? `m-${mapId++}` : `n-${noteId++}`;
            data.push({
              type: type === "mappa" ? "map" : "note",
              id,
              timestamp,
              ...(type === "mappa" ? { title: content } : { content })
            });
            render();
          }

          if (action === "toggle") {
            const mapId = e.target.dataset.mapId;
            document.querySelector(`concept-map[map-id="${mapId}"]`)
              ?.dispatchEvent(new CustomEvent("concept-map:toggleEditor", { bubbles: true }));
          }

        } catch (err) {
          console.warn("❌ Azione annullata:", err.message);
        } finally {
          spinner.style.display = "none";
        }
      });

      function parseTimestamp(t) {
        const [h, m, s] = t.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      }

      function render() {
        container.querySelectorAll('[data-cm-type="map"], [data-cm-type="note"]').forEach(el => el.remove());

        const ordered = [...data].sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
        ordered.forEach(item => {
          if (item.type === "map") {
            const wrapper = document.createElement("div");
            wrapper.setAttribute("data-cm-type", "map");
            wrapper.dataset.mapId = item.id;

            const label = document.createElement("p");
            label.textContent = `🧠 ${item.title} | ${item.timestamp}`;

            const btn = document.createElement("button");
            btn.textContent = "Visualizza mappa";
            btn.setAttribute("data-cm-action", "toggle");
            btn.setAttribute("data-map-id", item.id);

            const map = document.createElement("concept-map");
            map.setAttribute("map-id", item.id);
            map.setAttribute("data-timestamp", item.timestamp);

            wrapper.append(label, btn, map);
            container.appendChild(wrapper);
          }

          if (item.type === "note") {
            const note = document.createElement("div");
            note.setAttribute("data-cm-type", "note");
            note.textContent = `📝 ${item.content} (${item.timestamp})`;
            container.appendChild(note);
          }
        });
      }

      render();