/**
 * AI Integration Module for SpoilerBlock Extension
 * 
 * This module provides the foundation for integrating AI-powered spoiler detection
 * with the SpoilerBlock extension. It includes interfaces for different AI providers
 * and a pluggable architecture for future enhancements.
 */

class AISpoilerDetector {
    constructor(config = {}) {
        this.config = {
            enabled: false,
            provider: 'none', // 'openai', 'huggingface', 'custom', 'none'
            apiKey: null,
            model: 'gpt-3.5-turbo',
            confidence_threshold: 0.7,
            fallback_to_rules: true,
            ...config
        };
        
        this.providers = {
            'openai': new OpenAISpoilerDetector(this.config),
            'huggingface': new HuggingFaceSpoilerDetector(this.config),
            'custom': new CustomAISpoilerDetector(this.config)
        };
    }

    async detectSpoiler(text, movieList) {
        if (!this.config.enabled || this.config.provider === 'none') {
            // Fall back to rule-based detection
            return this.ruleBasedDetection(text, movieList);
        }

        try {
            const provider = this.providers[this.config.provider];
            if (!provider) {
                console.warn(`AI provider '${this.config.provider}' not found, falling back to rules`);
                return this.ruleBasedDetection(text, movieList);
            }

            const result = await provider.analyze(text, movieList);
            
            // If AI confidence is too low and fallback is enabled, use rule-based detection
            if (result.confidence < this.config.confidence_threshold && this.config.fallback_to_rules) {
                const ruleResult = this.ruleBasedDetection(text, movieList);
                return {
                    ...result,
                    isSpoiler: result.isSpoiler || ruleResult.isSpoiler,
                    confidence: Math.max(result.confidence, ruleResult.confidence),
                    method: 'hybrid'
                };
            }

            return result;
        } catch (error) {
            console.error('AI spoiler detection failed:', error);
            
            if (this.config.fallback_to_rules) {
                return this.ruleBasedDetection(text, movieList);
            }
            
            return { isSpoiler: false, confidence: 0, error: error.message };
        }
    }

    ruleBasedDetection(text, movieList) {
        // This would call the existing rule-based logic from content.js
        // For now, it's a placeholder that returns a basic structure
        return {
            isSpoiler: false,
            confidence: 0.5,
            movies: [],
            method: 'rules',
            reasoning: 'Rule-based detection'
        };
    }

    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Save to Chrome storage
        try {
            await chrome.storage.sync.set({ aiConfig: this.config });
        } catch (error) {
            console.error('Failed to save AI config:', error);
        }
    }
}

/**
 * OpenAI GPT-based spoiler detection
 */
class OpenAISpoilerDetector {
    constructor(config) {
        this.config = config;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    }

    async analyze(text, movieList) {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const prompt = this.buildPrompt(text, movieList);
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a spoiler detection system. Analyze text for spoilers and respond with JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        try {
            const result = JSON.parse(aiResponse);
            return {
                isSpoiler: result.is_spoiler,
                confidence: result.confidence,
                movies: result.related_movies || [],
                reasoning: result.reasoning,
                method: 'ai-openai'
            };
        } catch (parseError) {
            throw new Error('Failed to parse AI response');
        }
    }

    buildPrompt(text, movieList) {
        return `
Analyze this text for spoilers related to these movies/shows: ${movieList.join(', ')}

Text to analyze: "${text}"

Respond with JSON in this exact format:
{
    "is_spoiler": boolean,
    "confidence": number (0.0-1.0),
    "related_movies": array of mentioned movies,
    "reasoning": string explaining the decision
}

Consider spoilers to be: plot reveals, character deaths, endings, major plot twists, episode-specific details.
        `.trim();
    }
}

/**
 * HuggingFace model-based spoiler detection
 */
class HuggingFaceSpoilerDetector {
    constructor(config) {
        this.config = config;
        this.apiUrl = 'https://api-inference.huggingface.co/models/';
    }

    async analyze(text, movieList) {
        if (!this.config.apiKey) {
            throw new Error('HuggingFace API key not configured');
        }

        // Example using a classification model
        const modelUrl = `${this.apiUrl}${this.config.model || 'cardiffnlp/twitter-roberta-base-sentiment-latest'}`;
        
        const response = await fetch(modelUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: text
            })
        });

        if (!response.ok) {
            throw new Error(`HuggingFace API error: ${response.status}`);
        }

        const data = await response.json();
        
        // This is a placeholder - you'd need a model specifically trained for spoiler detection
        return {
            isSpoiler: false, // Would be determined by the model
            confidence: 0.5,
            movies: movieList.filter(movie => text.toLowerCase().includes(movie.toLowerCase())),
            method: 'ai-huggingface'
        };
    }
}

/**
 * Custom AI model integration
 */
class CustomAISpoilerDetector {
    constructor(config) {
        this.config = config;
    }

    async analyze(text, movieList) {
        // Placeholder for custom AI model integration
        // This could connect to your own trained model, local inference, etc.
        
        const customEndpoint = this.config.customEndpoint;
        if (!customEndpoint) {
            throw new Error('Custom AI endpoint not configured');
        }

        const response = await fetch(customEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.customHeaders || {})
            },
            body: JSON.stringify({
                text,
                movies: movieList,
                sensitivity: this.config.sensitivity
            })
        });

        if (!response.ok) {
            throw new Error(`Custom API error: ${response.status}`);
        }

        return await response.json();
    }
}

/**
 * AI Configuration Manager
 */
class AIConfigManager {
    static async loadConfig() {
        try {
            const data = await chrome.storage.sync.get(['aiConfig']);
            return data.aiConfig || {
                enabled: false,
                provider: 'none'
            };
        } catch (error) {
            console.error('Failed to load AI config:', error);
            return { enabled: false, provider: 'none' };
        }
    }

    static async saveConfig(config) {
        try {
            await chrome.storage.sync.set({ aiConfig: config });
            return true;
        } catch (error) {
            console.error('Failed to save AI config:', error);
            return false;
        }
    }

    static validateApiKey(provider, apiKey) {
        if (!apiKey) return false;
        
        switch (provider) {
            case 'openai':
                return apiKey.startsWith('sk-') && apiKey.length > 20;
            case 'huggingface':
                return apiKey.startsWith('hf_') && apiKey.length > 10;
            case 'custom':
                return apiKey.length > 0; // Basic validation
            default:
                return false;
        }
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AISpoilerDetector, AIConfigManager };
}

// Make available globally in extension context
if (typeof window !== 'undefined') {
    window.AISpoilerDetector = AISpoilerDetector;
    window.AIConfigManager = AIConfigManager;
}