class SpoilerBlockPopup {
    constructor() {
        this.allMovies = [];         
        this.monitoredMovies = [];   
        this.isEnabled = true;
        this.sensitivity = 'medium';
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadAllMovies(); 
        this.setupEventListeners();
        this.updateUI();
    }

    async loadSettings() {
        try {
            const data = await chrome.storage.sync.get(['monitoredMovies', 'isEnabled', 'sensitivity']);
            this.monitoredMovies = data.monitoredMovies || [];
            this.isEnabled = data.isEnabled !== false;
            this.sensitivity = data.sensitivity || 'medium';
        } catch (err) {
            console.error("Error loading settings", err);
        }
    }

    async loadAllMovies() {
        try {
            const res = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/movies");
            const movies = await res.json();
            this.allMovies = Array.isArray(movies) ? movies : [];
            this.updateMovieSelector();
        } catch (err) {
            console.error("Error al cargar películas:", err);
            this.allMovies = [
                { title: "Coraline", description: "Coraline plot..." },
                { title: "Avengers", description: "Avengers plot..." },
                { title: "Totoro", description: "Totoro plot..." }
            ];
            this.updateMovieSelector();
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({
                monitoredMovies: this.monitoredMovies,
                isEnabled: this.isEnabled,
                sensitivity: this.sensitivity
            });

            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "updateSettings",
                        settings: {
                            monitoredMovies: this.monitoredMovies,
                            isEnabled: this.isEnabled,
                            sensitivity: this.sensitivity
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }

    setupEventListeners() {
        document.getElementById("enableToggle").addEventListener("click", () => {
            this.isEnabled = !this.isEnabled;
            this.updateToggle();
            this.saveSettings();
        });

        document.getElementById("sensitivitySelect").addEventListener("change", (e) => {
            this.sensitivity = e.target.value;
            this.saveSettings();
        });

        document.getElementById("addMovieBtn").addEventListener("click", () => {
            const movieTitle = document.getElementById("movieSelector").value;
            const movieObj = this.allMovies.find(m => m.title === movieTitle);

            if (!this.monitoredMovies.some(m => m.movie_id === movieObj.movie_id)) {
                this.monitoredMovies.push(movieObj);  
                this.updateMovieList();
                this.saveSettings();
                this.updateStatus(`Added "${movieObj.title}"`);
            } else {
                this.updateStatus("Already added");
            }
        });

    }

    updateMovieSelector() {
        const selector = document.getElementById("movieSelector");
        selector.innerHTML = this.allMovies
            .map(m => `<option value="${m.title}">${m.title}</option>`)
            .join("");
    }

    updateMovieList() {
        const list = document.getElementById("movieList");

        if (this.monitoredMovies.length === 0) {
            list.innerHTML = `<div style="padding: 15px; text-align:center; color:#888">
                No movies selected
            </div>`;
            return;
        }

        list.innerHTML = this.monitoredMovies.map(m => `
            <div class="movie-item">
                <span class="movie-title" title="${m.description}">${m.title}</span>
                <button class="remove-btn" data-title="${m.title}">Remove</button>
            </div>
        `).join("");

        // Event listeners para los botones
        list.querySelectorAll(".remove-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const title = btn.getAttribute("data-title");
                this.removeMovie(title);
            });
        });
    }

    removeMovie(title) {
        this.monitoredMovies = this.monitoredMovies.filter(m => m.title !== title);
        this.updateMovieList();
        this.saveSettings();
        this.updateStatus(`Removed "${title}"`);
    }

    updateUI() {
        this.updateToggle();
        this.updateSensitivity();
        this.updateMovieList();
    }

    updateToggle() {
        const t = document.getElementById("enableToggle");
        if (this.isEnabled) t.classList.add("active");
        else t.classList.remove("active");
    }

    updateSensitivity() {
        document.getElementById("sensitivitySelect").value = this.sensitivity;
    }

    updateStatus(msg) {
        const status = document.getElementById("status");
        status.textContent = msg;
        setTimeout(() => status.textContent = "Ready to protect you from spoilers!", 2500);
    }
}

document.getElementById("checkOpenAIOnlyBtn").addEventListener("click", async () => {
    const reviewText = document.getElementById("reviewTextOpenAI").value;
    if (!reviewText) {
        document.getElementById("spoilerResult").textContent = "Debes escribir un texto";
        return;
    }

    // Lista de películas monitoreadas (solo títulos)
    const titlesOnly = popup.monitoredMovies.map(m => m.title);

    if (titlesOnly.length === 0) {
        document.getElementById("spoilerResult").textContent = "No movies selected";
        return;
    }

    try {
        const res = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/predict_openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: reviewText,
                movies: titlesOnly
            })
        });

        const textResponse = await res.text();

        // Ejemplo esperado: "True {/ Coraline"
        document.getElementById("spoilerResult").textContent =
            `🧠 OpenAI Test Directo → ${textResponse}`;

    } catch (err) {
        console.error(err);
        document.getElementById("spoilerResult").textContent =
            "Error al consultar OpenAI";
    }
});


let popup;
document.addEventListener("DOMContentLoaded", () => {
    popup = new SpoilerBlockPopup();
});
document.getElementById("checkSpoilerBtn").addEventListener("click", async () => {
    const reviewText = document.getElementById("reviewText").value;
    if (!reviewText) return;

    const movieIds = popup.monitoredMovies.map(m => m.movie_id);

    if (movieIds.length === 0) {
        document.getElementById("spoilerResult").textContent = "No movies selected";
        return;
    }

    try {
        const res = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/match_movies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reviewText, movie_ids: movieIds })
        });

        const data = await res.json();

        if (!Array.isArray(data)) {
            document.getElementById("spoilerResult").textContent = "Error: backend no respondió correctamente";
            return;
        }

        let threshold;
        switch (popup.sensitivity) {
            case 'low': threshold = 0.4; break;
            case 'medium': threshold = 0.55; break;
            case 'high': threshold = 0.7; break;
            default: threshold = 0.55;
        }

        let resultText = "";
        let isSpoiler = false;

        data.forEach(d => {
            const movie = popup.monitoredMovies.find(m => m.movie_id === d.movie_id);
            const title = movie ? movie.title : d.movie_id; 
            const similarity = d.similarity != null ? d.similarity.toFixed(3) : "N/A";

            resultText += `🎬 ${title} — Similarity: ${similarity}\n`;

            if (d.similarity >= threshold) {
                isSpoiler = true;
            }
        });

        if (!isSpoiler) {
            resultText += `\n⚠ Spoiler detected: NO`;
            document.getElementById("spoilerResult").textContent = resultText;
            return;
        }

        // ===============
        // PASO 2: OpenAI detecta DE QUÉ PELÍCULA ES
        // ===============
        try {
            const titlesOnly = popup.monitoredMovies.map(m => m.title);

            const openaiRes = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/predict_openai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: reviewText,
                    movies: titlesOnly
                })
            });

            const openaiText = await openaiRes.text();  
            // Ej: "True {/ Coraline"

            resultText += `\n🧠 OpenAI Match: ${openaiText}`;

            document.getElementById("spoilerResult").textContent = resultText;

        } catch (err) {
            console.error(err);
            resultText += "\n(OpenAI error)";
            document.getElementById("spoilerResult").textContent = resultText;
        }
    } catch (err) {
        console.error(err);
        document.getElementById("spoilerResult").textContent = "Error al consultar el backend";
    }

    
});

