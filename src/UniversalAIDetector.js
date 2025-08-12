class UniversalAIDetector {
    constructor() {
        this.imageGenerationServices = new Map([
            // Primary Image Generation Services
            ['OPENAI_API_KEY', { 
                service: 'openai', 
                priority: 1,
                description: 'OpenAI DALL-E (Premium Image Generation)',
                cost: '$0.02-0.08 per image'
            }],
            ['STABILITY_API_KEY', { 
                service: 'stability', 
                priority: 2,
                description: 'Stability AI (Stable Diffusion)',
                cost: '$0.01 per image'
            }],
            ['REPLICATE_API_TOKEN', { 
                service: 'replicate', 
                priority: 3,
                description: 'Replicate (Multiple Models + Free Credits)',
                cost: 'Free $5 credits, then paid'
            }],
            ['HUGGINGFACE_API_KEY', { 
                service: 'huggingface', 
                priority: 4,
                description: 'Hugging Face (Free Tier Available)',
                cost: 'Free (rate limited)'
            }],
            ['GEMINI_API_KEY', { 
                service: 'gemini', 
                priority: 5,
                description: 'Google Gemini (Imagen Models)',
                cost: '$0.03-0.04 per image'
            }]
        ]);

        // Common AI service key patterns for unknown services
        this.keyPatterns = [
            { pattern: /^sk-[a-zA-Z0-9]+$/, service: 'openai_like', description: 'OpenAI-style Key' },
            { pattern: /^r8_[a-zA-Z0-9]+$/, service: 'replicate', description: 'Replicate Token' },
            { pattern: /^hf_[a-zA-Z0-9]+$/, service: 'huggingface', description: 'Hugging Face Token' },
            { pattern: /^AIza[a-zA-Z0-9-_]+$/, service: 'google', description: 'Google AI Key' },
            { pattern: /^[a-zA-Z0-9]{32,}$/, service: 'generic', description: 'Generic AI Key' }
        ];
    }

    detectImageGenerationAPIs() {
        const detectedAPIs = [];
        const env = process.env;

        // Check known image generation services first
        for (const [keyName, config] of this.imageGenerationServices.entries()) {
            const apiKey = env[keyName];
            if (this.isValidKey(apiKey)) {
                detectedAPIs.push({
                    keyName,
                    service: config.service,
                    priority: config.priority,
                    description: config.description,
                    cost: config.cost,
                    apiKey: apiKey.trim(),
                    detected: 'known_service'
                });
            }
        }

        // Check for unknown image generation keys using patterns
        for (const [keyName, keyValue] of Object.entries(env)) {
            if (this.looksLikeImageGenerationKey(keyName) && this.isValidKey(keyValue)) {
                // Skip if already detected as known service
                if (!this.imageGenerationServices.has(keyName)) {
                    const pattern = this.identifyKeyPattern(keyValue);
                    detectedAPIs.push({
                        keyName,
                        service: pattern.service,
                        priority: 50, // Lower priority for unknown
                        description: `Unknown Image Generation Service (${pattern.description})`,
                        cost: 'Unknown',
                        apiKey: keyValue.trim(),
                        detected: 'pattern_match'
                    });
                }
            }
        }

        // Sort by priority (lower number = higher priority)
        return detectedAPIs.sort((a, b) => a.priority - b.priority);
    }

    isValidKey(key) {
        return key && 
               typeof key === 'string' && 
               key.trim().length > 0 && 
               !key.includes('your_') && 
               !key.includes('here') &&
               !key.includes('example') &&
               key.trim().length >= 10; // Minimum reasonable key length
    }

    looksLikeImageGenerationKey(keyName) {
        const imageKeywords = [
            'api_key', 'api_token', 'token', 'key',
            'openai', 'dall_e', 'dalle', 'stability', 'stable_diffusion',
            'replicate', 'huggingface', 'midjourney', 'gemini', 'imagen'
        ];
        
        const lowerKey = keyName.toLowerCase();
        return imageKeywords.some(keyword => lowerKey.includes(keyword));
    }

    identifyKeyPattern(keyValue) {
        for (const pattern of this.keyPatterns) {
            if (pattern.pattern.test(keyValue)) {
                return pattern;
            }
        }
        return { service: 'unknown', description: 'Unknown Format' };
    }

    getBestImageGenerator(detectedAPIs) {
        return detectedAPIs.length > 0 ? detectedAPIs[0] : null;
    }
}

module.exports = UniversalAIDetector;