// Content script for detecting and censoring spoilers on Instagram
class SpoilerDetector {
    constructor() {
        this.movies = [];
        this.isEnabled = true;
        this.sensitivity = 'medium';
        this.observer = null;
        this.processedElements = new WeakSet();
        
        // Initialize settings and start monitoring
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupMessageListener();
        this.startMonitoring();
        console.log('SpoilerBlock: Initialized on Instagram');
    }

    async loadSettings() {
        try {
            const data = await chrome.storage.sync.get(['movies', 'isEnabled', 'sensitivity']);
            this.movies = data.movies || [];
            this.isEnabled = data.isEnabled !== false;
            this.sensitivity = data.sensitivity || 'medium';
        } catch (error) {
            console.error('SpoilerBlock: Error loading settings:', error);
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'updateSettings') {
                this.movies = message.settings.movies || [];
                this.isEnabled = message.settings.isEnabled;
                this.sensitivity = message.settings.sensitivity;
                
                // Re-process all text elements with new settings
                this.processAllTextElements();
                sendResponse({success: true});
            }
        });
    }

    startMonitoring() {
        // Process existing content
        this.processAllTextElements();

        // Set up observer for new content
        this.observer = new MutationObserver((mutations) => {
            if (!this.isEnabled) return;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processElement(node);
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    processAllTextElements() {
        if (!this.isEnabled) return;

        // Instagram comment selectors
        const commentSelectors = [
            '[data-testid="comment"] span',  // Comments
            'article span',                   // Post captions
            '[role="textbox"]',              // Comment input areas
            '.C4VMK span',                   // Legacy comment selector
            '._a9zs span'                    // Legacy span selector
        ];

        commentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => this.processElement(element));
        });
    }

    processElement(element) {
        if (!this.isEnabled || this.processedElements.has(element)) return;

        // Find text-containing elements
        const textElements = this.findTextElements(element);
        
        textElements.forEach(textElement => {
            if (!this.processedElements.has(textElement)) {
                this.checkAndCensorText(textElement);
                this.processedElements.add(textElement);
            }
        });
    }

    findTextElements(element) {
        const textElements = [];
        
        if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
            textElements.push(element);
        } else if (element.nodeType === Node.ELEMENT_NODE) {
            // Check if element contains direct text
            const hasDirectText = Array.from(element.childNodes).some(
                child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()
            );
            
            if (hasDirectText) {
                textElements.push(element);
            }
            
            // Recursively check child elements
            Array.from(element.children).forEach(child => {
                textElements.push(...this.findTextElements(child));
            });
        }
        
        return textElements;
    }

    checkAndCensorText(element) {
        const text = element.textContent || element.innerText || '';
        if (!text.trim()) return;

        const spoilerInfo = this.detectSpoiler(text);
        if (spoilerInfo.isSpoiler) {
            this.censorElement(element, spoilerInfo);
        }
    }

    detectSpoiler(text) {
        if (this.movies.length === 0) {
            return { isSpoiler: false };
        }

        const lowerText = text.toLowerCase();
        
        // Check if text mentions any of the monitored movies
        const mentionedMovies = this.movies.filter(movie => 
            lowerText.includes(movie.toLowerCase())
        );

        if (mentionedMovies.length === 0) {
            return { isSpoiler: false };
        }

        // Define spoiler keywords based on sensitivity level
        const spoilerKeywords = this.getSpoilerKeywords();
        
        // Check for spoiler patterns
        const containsSpoilerKeywords = spoilerKeywords.some(keyword => 
            lowerText.includes(keyword.toLowerCase())
        );

        // Additional patterns that might indicate spoilers
        const spoilerPatterns = [
            /spoiler/i,
            /dies?/i,
            /killed?/i,
            /ending/i,
            /plot twist/i,
            /finale/i,
            /season \d+ episode \d+/i,
            /s\d+e\d+/i,
            /don't read if/i,
            /warning:/i
        ];

        const hasPattern = spoilerPatterns.some(pattern => pattern.test(text));
        
        const isSpoiler = containsSpoilerKeywords || hasPattern;
        
        return {
            isSpoiler,
            movies: mentionedMovies,
            confidence: this.calculateConfidence(text, mentionedMovies, containsSpoilerKeywords, hasPattern)
        };
    }

    getSpoilerKeywords() {
        const baseKeywords = ['dies', 'death', 'killed', 'ending', 'finale', 'twist'];
        
        switch (this.sensitivity) {
            case 'high':
                return [
                    ...baseKeywords,
                    'happens', 'reveals', 'turns out', 'discovers', 'finds out',
                    'episode', 'season', 'chapter', 'part', 'scene'
                ];
            case 'low':
                return ['dies', 'killed', 'ending', 'major spoiler'];
            default: // medium
                return [...baseKeywords, 'reveals', 'plot', 'twist', 'spoiler'];
        }
    }

    calculateConfidence(text, movies, hasSpoilerKeywords, hasPattern) {
        let confidence = 0;
        
        if (movies.length > 0) confidence += 0.3;
        if (hasSpoilerKeywords) confidence += 0.4;
        if (hasPattern) confidence += 0.3;
        
        // Boost confidence for explicit spoiler warnings
        if (/spoiler/i.test(text)) confidence += 0.2;
        
        return Math.min(confidence, 1.0);
    }

    censorElement(element, spoilerInfo) {
        // Don't censor if already censored
        if (element.classList && element.classList.contains('spoiler-blocked')) {
            return;
        }

        // Create spoiler overlay
        const originalText = element.textContent || element.innerText || '';
        
        // Create wrapper if element is text node
        let targetElement = element;
        if (element.nodeType === Node.TEXT_NODE) {
            const wrapper = document.createElement('span');
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
            targetElement = wrapper;
        }

        // Add censoring styles and overlay
        targetElement.classList.add('spoiler-blocked');
        targetElement.style.position = 'relative';
        
        // Create blur overlay
        const overlay = document.createElement('div');
        overlay.className = 'spoiler-overlay';
        overlay.innerHTML = `
            <div class="spoiler-warning">
                <span class="spoiler-icon">⚠️</span>
                <span class="spoiler-text">Potential Spoiler Detected</span>
                <div class="spoiler-movies">${spoilerInfo.movies ? spoilerInfo.movies.join(', ') : ''}</div>
                <button class="spoiler-reveal-btn">Click to reveal</button>
            </div>
        `;

        targetElement.appendChild(overlay);

        // Add click handler to reveal content
        const revealBtn = overlay.querySelector('.spoiler-reveal-btn');
        revealBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
            targetElement.classList.remove('spoiler-blocked');
            targetElement.classList.add('spoiler-revealed');
        });

        // Blur the original content
        targetElement.style.filter = 'blur(5px)';
        targetElement.style.userSelect = 'none';
        
        console.log(`SpoilerBlock: Censored potential spoiler for: ${spoilerInfo.movies ? spoilerInfo.movies.join(', ') : 'unknown'}`);
    }
}

// Initialize spoiler detector when page loads
let spoilerDetector;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        spoilerDetector = new SpoilerDetector();
    });
} else {
    spoilerDetector = new SpoilerDetector();
}

// Handle navigation changes (Instagram is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Reinitialize on navigation
        setTimeout(() => {
            if (spoilerDetector) {
                spoilerDetector.processAllTextElements();
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true });