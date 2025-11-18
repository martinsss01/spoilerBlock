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
        this.allMovies = ["Coraline", "Avengers", "Totoro"];
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
            const movie = document.getElementById("movieSelector").value;

            if (!this.monitoredMovies.includes(movie)) {
                this.monitoredMovies.push(movie);
                this.updateMovieList();
                this.saveSettings();
                this.updateStatus(`Added "${movie}"`);
            } else {
                this.updateStatus("Already added");
            }
        });
    }


    updateMovieSelector() {
        const selector = document.getElementById("movieSelector");
        selector.innerHTML = this.allMovies
            .map(m => `<option value="${m}">${m}</option>`)
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
                <span>${m}</span>
                <button class="remove-btn" data-movie="${m}">Remove</button>
            </div>
        `).join("");

        list.querySelectorAll(".remove-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const movie = btn.getAttribute("data-movie");
                this.removeMovie(movie);
            });
        });
    }
    
    removeMovie(movie) {
        this.monitoredMovies = this.monitoredMovies.filter(m => m !== movie);
        this.updateMovieList();
        this.saveSettings();
        this.updateStatus(`Removed "${movie}"`);
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


let popup;
document.addEventListener("DOMContentLoaded", () => {
    popup = new SpoilerBlockPopup();
});

document.getElementById("checkSpoilerBtn").addEventListener("click", async () => {
    const reviewText = document.getElementById("reviewText").value;
    if (!reviewText) return;

    try {
        const res = await fetch("https://grupo3.jb.dcc.uchile.cl/spoilerBlock/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reviewText })
        });

        const data = await res.json();
        document.getElementById("spoilerResult").textContent = data.result || data.error;
    } catch (err) {
        console.error(err);
        document.getElementById("spoilerResult").textContent = "Error al consultar el backend";
    }
});
