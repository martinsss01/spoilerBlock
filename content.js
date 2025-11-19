console.log("SpoilerBlock content script loaded (DEBUG MODE)");

let cachedSettings = {
    monitoredMovies: [],
    isEnabled: true,
    sensitivity: "medium"
};

// Cargar settings
chrome.storage.sync.get(["monitoredMovies", "isEnabled", "sensitivity"], (data) => {
    cachedSettings = {
        monitoredMovies: data.monitoredMovies || [],
        isEnabled: data.isEnabled !== false,
        sensitivity: data.sensitivity || "medium"
    };

    console.log("[⚙️ SETTINGS LOADED]", cachedSettings);
});

// Actualización desde popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "updateSettings") {
        cachedSettings = msg.settings;
        console.log("[⚙️ SETTINGS UPDATED]", cachedSettings);
        scanComments();
    }
});

// Observador DOM
const observer = new MutationObserver(() => scanComments());
observer.observe(document.body, { childList: true, subtree: true });

scanComments();

async function scanComments() {
    if (!cachedSettings.isEnabled) {
        console.log("⛔ SpoilerBlock disabled");
        return;
    }

    const candidates = document.querySelectorAll("span:not([data-spoiler-checked])");
    if (candidates.length === 0) return;

    console.log(`🔍 Encontrados ${candidates.length} spans nuevos para analizar`);

    const movieIds = cachedSettings.monitoredMovies.map(m => m.movie_id);
    if (movieIds.length === 0) {
        console.warn("⚠️ No hay películas configuradas, no se analiza nada");
        return;
    }

    for (const span of candidates) {
        const text = span.innerText?.trim();

        if (!text) continue;

        span.setAttribute("data-spoiler-checked", "1");

        console.log("🟦 [SCAN] Texto detectado:", text);

        checkForSpoiler(span, text, movieIds);
    }
}

async function checkForSpoiler(span, text, movieIds) {
    console.log("📤 [API REQUEST] Enviando texto al backend:", text);

    try {
        const res = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/match_movies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, movie_ids: movieIds })
        });

        const data = await res.json();

        console.log("📩 [API RESPONSE]", data);

        let threshold = 0.65;
        if (cachedSettings.sensitivity === "low") threshold = 0.5;
        if (cachedSettings.sensitivity === "high") threshold = 0.8;

        const similarities = data.map(
            d => `${d.movie_id}: ${d.similarity?.toFixed(3)}`
        );

        console.log("📊 [SIMILARITY CHECK]", similarities, "threshold =", threshold);

        const isSpoiler = data.some(d => d.similarity >= threshold);

        if (isSpoiler) {
            console.warn("🚫 SPOILER DETECTADO:", text);
            hideSpoilerComment(span);
        } else {
            console.log("✅ No es spoiler:", text);
        }

    } catch (err) {
        console.error("❌ Error en API:", err);
    }
}

function hideSpoilerComment(span) {
    console.log("🟥 Ocultando comentario:", span.innerText);

    const hiddenBox = document.createElement("div");

    hiddenBox.classList.add("spoiler-blocker");
    hiddenBox.innerText = "⚠️ Spoiler oculto — clic para mostrar";

    hiddenBox.style.background = "#3a3a3a";
    hiddenBox.style.color = "#fff";
    hiddenBox.style.padding = "8px 12px";
    hiddenBox.style.borderRadius = "8px";
    hiddenBox.style.cursor = "pointer";
    hiddenBox.style.fontSize = "14px";
    hiddenBox.style.margin = "4px 0";

    hiddenBox.addEventListener("click", () => {
        console.log("🔓 Comentario revelado");
        hiddenBox.replaceWith(span);
        span.style.display = "inline";
    });

    span.replaceWith(hiddenBox);
    span.style.display = "none";
}
