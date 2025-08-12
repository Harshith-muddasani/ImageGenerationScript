const OpenAIGenerator = require('./generators/OpenAIGenerator');
const StabilityGenerator = require('./generators/StabilityGenerator');
const ReplicateGenerator = require('./generators/ReplicateGenerator');
const HuggingFaceGenerator = require('./generators/HuggingFaceGenerator');
const GeminiGenerator = require('./generators/GeminiGenerator');
const UniversalAIDetector = require('./UniversalAIDetector');

class APIManager {
    constructor() {
        this.generators = new Map();
        this.activeGenerator = null;
        this.detector = new UniversalAIDetector();
        this.generatorClasses = new Map([
            ['openai', OpenAIGenerator],
            ['stability', StabilityGenerator],
            ['replicate', ReplicateGenerator],
            ['huggingface', HuggingFaceGenerator],
            ['gemini', GeminiGenerator]
        ]);
        
        this.initializeGenerators();
    }

    initializeGenerators() {
        console.log('🔍 Scanning for image generation APIs...');
        
        const detectedAPIs = this.detector.detectImageGenerationAPIs();

        if (detectedAPIs.length === 0) {
            throw new Error('No image generation API keys found. Please add at least one API key to your .env file:\n' +
                '• OPENAI_API_KEY=sk-... (DALL-E)\n' +
                '• STABILITY_API_KEY=sk-... (Stable Diffusion)\n' +
                '• REPLICATE_API_TOKEN=r8_... (Multiple models + free credits)\n' +
                '• HUGGINGFACE_API_KEY=hf_... (Free tier)\n' +
                '• GEMINI_API_KEY=AIza... (Imagen models)');
        }

        console.log('\n🖼️ Found Image Generation Services:');
        console.log('===================================');

        // Display all detected services
        detectedAPIs.forEach((api, index) => {
            const status = index === 0 ? '🎯' : '⚙️';
            const priority = index === 0 ? '(PRIMARY)' : '(BACKUP)';
            console.log(`${status} ${api.description} ${priority}`);
            console.log(`   Key: ${api.keyName} (${api.apiKey.substring(0, 10)}...)`);
            console.log(`   Cost: ${api.cost}`);
        });

        // Initialize all detected services
        detectedAPIs.forEach(api => {
            this.initializeGenerator(api);
        });

        this.selectBestGenerator(detectedAPIs);
    }

    initializeGenerator(api) {
        const GeneratorClass = this.generatorClasses.get(api.service);
        
        if (!GeneratorClass) {
            console.log(`⚠️ No generator available for ${api.service} yet (will attempt generic approach)`);
            return;
        }

        try {
            const generator = new GeneratorClass({ apiKey: api.apiKey });
            this.generators.set(api.service, {
                instance: generator,
                config: api,
                priority: api.priority
            });
        } catch (error) {
            console.log(`   ❌ ${api.service.toUpperCase()} initialization failed: ${error.message}`);
        }
    }

    selectBestGenerator(detectedAPIs) {
        // Select the highest priority (lowest number) available generator
        for (const api of detectedAPIs) {
            const generator = this.generators.get(api.service);
            if (generator) {
                this.activeGenerator = { name: api.service, ...generator };
                console.log(`\n🎯 Ready to generate images with ${api.service.toUpperCase()}!`);
                return;
            }
        }

        throw new Error('No compatible image generation service could be initialized');
    }

    async generateImage(options = {}) {
        if (!this.activeGenerator) {
            throw new Error('No active image generator available');
        }

        console.log(`🚀 Generating image with ${this.activeGenerator.name.toUpperCase()}...`);
        
        try {
            return await this.activeGenerator.instance.generateImage(options);
        } catch (error) {
            console.error(`❌ ${this.activeGenerator.name.toUpperCase()} failed: ${error.message}`);
            
            // Try fallback to next available generator
            const fallback = this.findFallbackGenerator();
            if (fallback) {
                console.log(`🔄 Trying fallback: ${fallback.name.toUpperCase()}...`);
                return await fallback.instance.generateImage(options);
            }
            
            throw error;
        }
    }

    findFallbackGenerator() {
        let nextBest = null;
        let nextPriority = 999;

        for (const [name, config] of this.generators.entries()) {
            if (name !== this.activeGenerator.name && config.priority < nextPriority) {
                nextPriority = config.priority;
                nextBest = { name, ...config };
            }
        }

        return nextBest;
    }

    getActiveGeneratorInfo() {
        if (!this.activeGenerator) return null;

        return {
            name: this.activeGenerator.name,
            description: this.activeGenerator.config.description,
            cost: this.activeGenerator.config.cost,
            capabilities: this.getGeneratorCapabilities(this.activeGenerator.name)
        };
    }

    getGeneratorCapabilities(name) {
        const capabilities = {
            openai: {
                models: ['dall-e-2', 'dall-e-3'],
                sizes: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'],
                quality: ['standard', 'hd'],
                maxImages: 4
            },
            stability: {
                models: ['stable-diffusion-xl', 'stable-diffusion-2.1'],
                sizes: ['512x512', '1024x1024'],
                quality: ['standard'],
                maxImages: 10
            },
            replicate: {
                models: ['sdxl', 'stable-diffusion-v1.5'],
                sizes: ['512x512', '1024x1024'],
                quality: ['standard'],
                maxImages: 4
            },
            huggingface: {
                models: ['stable-diffusion-xl', 'stable-diffusion-2.1'],
                sizes: ['512x512', '1024x1024'],
                quality: ['standard'],
                maxImages: 1
            },
            gemini: {
                models: ['gemini-2.0-flash-exp', 'imagen-3', 'imagen-4'],
                sizes: ['512x512', '1024x1024', '1024x1792', '1792x1024'],
                quality: ['standard'],
                maxImages: 4
            }
        };

        return capabilities[name] || { note: 'Unknown capabilities' };
    }

    listAvailableGenerators() {
        const available = [];
        for (const [name, config] of this.generators.entries()) {
            available.push({
                name: name.toUpperCase(),
                priority: config.priority,
                description: config.config.description,
                cost: config.config.cost,
                capabilities: this.getGeneratorCapabilities(name)
            });
        }
        return available.sort((a, b) => a.priority - b.priority);
    }
}

module.exports = APIManager;