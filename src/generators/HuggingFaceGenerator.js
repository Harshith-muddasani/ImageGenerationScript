const axios = require('axios');

class HuggingFaceGenerator {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api-inference.huggingface.co/models';
        this.timeout = config.timeout || 120000;
        
        if (!this.apiKey) {
            throw new Error('Hugging Face API key is required');
        }
    }

    async generateImage(options = {}) {
        const {
            prompt,
            model = 'runwayml/stable-diffusion-v1-5',
            width = 1024,
            height = 1024,
            num_inference_steps = 50,
            guidance_scale = 7.5
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        // Try multiple models in order of preference
        const models = [
            'runwayml/stable-diffusion-v1-5',
            'CompVis/stable-diffusion-v1-4',
            'stabilityai/stable-diffusion-2-1'
        ];

        let lastError = null;

        for (const modelToTry of models) {
            try {
                const response = await axios.post(
                    `${this.baseUrl}/${modelToTry}`,
                    {
                        inputs: prompt,
                        parameters: {
                            width,
                            height,
                            num_inference_steps,
                            guidance_scale
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        responseType: 'arraybuffer',
                        timeout: this.timeout
                    }
                );

                if (response.data && response.data.length > 0) {
                    return {
                        format: 'buffer',
                        data: response.data,
                        service: 'huggingface',
                        model: modelToTry
                    };
                }

            } catch (error) {
                lastError = error;
                
                if (error.response?.status === 401) {
                    throw new Error('Invalid Hugging Face API key');
                } else if (error.response?.status === 503) {
                    console.log(`⏳ Model ${modelToTry} is loading, trying next model...`);
                    continue;
                } else if (error.response?.status === 400) {
                    console.log(`❌ Model ${modelToTry} rejected request, trying next model...`);
                    continue;
                }
                
                // If it's not a model-specific error, break and throw
                if (error.response?.status !== 503 && error.response?.status !== 400) {
                    break;
                }
            }
        }

        // If we get here, all models failed
        if (lastError?.response?.status === 503) {
            throw new Error('All Hugging Face models are currently loading. Please wait a few minutes and try again.');
        } else if (lastError?.response?.status === 429) {
            throw new Error('Hugging Face rate limit exceeded - wait and try again');
        }
        
        throw new Error(`Hugging Face generation failed: ${lastError?.message || 'Unknown error'}`);
    }
}

module.exports = HuggingFaceGenerator;