// Popup functionality for managing spoiler block settings
class SpoilerBlockPopup {
    constructor() {
        this.movies = [];
        this.isEnabled = true;
        this.sensitivity = 'medium';
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadSettings() {
        try {
            const data = await chrome.storage.sync.get(['movies', 'isEnabled', 'sensitivity']);
            this.movies = data.movies || [];
            this.isEnabled = data.isEnabled !== false; // default to true
            this.sensitivity = data.sensitivity || 'medium';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({
                movies: this.movies,
                isEnabled: this.isEnabled,
                sensitivity: this.sensitivity
            });
            
            // Notify content script of changes
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'updateSettings',
                        settings: {
                            movies: this.movies,
                            isEnabled: this.isEnabled,
                            sensitivity: this.sensitivity
                        }
                    });
                }
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    setupEventListeners() {
        // Enable/disable toggle
        const enableToggle = document.getElementById('enableToggle');
        enableToggle.addEventListener('click', () => {
            this.isEnabled = !this.isEnabled;
            this.updateToggle();
            this.saveSettings();
        });

        // Add movie button
        const addMovieBtn = document.getElementById('addMovieBtn');
        const movieInput = document.getElementById('movieInput');
        
        addMovieBtn.addEventListener('click', () => {
            this.addMovie();
        });

        movieInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addMovie();
            }
        });

        // Sensitivity selector
        const sensitivitySelect = document.getElementById('sensitivitySelect');
        sensitivitySelect.addEventListener('change', (e) => {
            this.sensitivity = e.target.value;
            this.saveSettings();
        });
    }

    addMovie() {
        const movieInput = document.getElementById('movieInput');
        const movieName = movieInput.value.trim();
        
        if (movieName && !this.movies.includes(movieName)) {
            this.movies.push(movieName);
            movieInput.value = '';
            this.updateMovieList();
            this.saveSettings();
            this.updateStatus(`Added "${movieName}" to watchlist`);
        } else if (this.movies.includes(movieName)) {
            this.updateStatus('Movie already in list');
        }
    }

    removeMovie(movieName) {
        this.movies = this.movies.filter(movie => movie !== movieName);
        this.updateMovieList();
        this.saveSettings();
        this.updateStatus(`Removed "${movieName}" from watchlist`);
    }

    updateUI() {
        this.updateToggle();
        this.updateMovieList();
        this.updateSensitivity();
    }

    updateToggle() {
        const enableToggle = document.getElementById('enableToggle');
        if (this.isEnabled) {
            enableToggle.classList.add('active');
        } else {
            enableToggle.classList.remove('active');
        }
    }

    updateMovieList() {
        const movieList = document.getElementById('movieList');
        
        if (this.movies.length === 0) {
            movieList.innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e8e;">No movies added yet</div>';
            return;
        }

        movieList.innerHTML = this.movies.map(movie => `
            <div class="movie-item">
                <span>${this.escapeHtml(movie)}</span>
                <button class="remove-btn" onclick="popup.removeMovie('${this.escapeHtml(movie)}')">Remove</button>
            </div>
        `).join('');
    }

    updateSensitivity() {
        const sensitivitySelect = document.getElementById('sensitivitySelect');
        sensitivitySelect.value = this.sensitivity;
    }

    updateStatus(message) {
        const status = document.getElementById('status');
        status.textContent = message;
        setTimeout(() => {
            status.textContent = 'Ready to protect you from spoilers!';
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize popup when DOM is loaded
let popup;
document.addEventListener('DOMContentLoaded', () => {
    popup = new SpoilerBlockPopup();
});