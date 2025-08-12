const axios = require('axios');

class StabilityGenerator {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.stability.ai/v1';
        this.timeout = config.timeout || 120000;
        
        if (!this.apiKey) {
            throw new Error('Stability API key is required');
        }
    }

    async generateImage(options = {}) {
        const {
            prompt,
            model = 'stable-diffusion-xl-1024-v1-0',
            width = 1024,
            height = 1024,
            steps = 30,
            cfg_scale = 7,
            samples = 1
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/generation/${model}/text-to-image`,
                {
                    text_prompts: [{ text: prompt }],
                    width,
                    height,
                    steps,
                    cfg_scale,
                    samples
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: this.timeout
                }
            );

            if (!response.data.artifacts?.[0]?.base64) {
                throw new Error('No image data received from Stability AI');
            }

            const base64Data = response.data.artifacts[0].base64;
            const imageBuffer = Buffer.from(base64Data, 'base64');

            return {
                format: 'buffer',
                data: imageBuffer,
                service: 'stability',
                model: model,
                seed: response.data.artifacts[0].seed
            };

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid Stability API key');
            } else if (error.response?.status === 402) {
                throw new Error('Insufficient credits - add credits to your Stability account');
            } else if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded - wait and try again');
            } else if (error.response?.status === 400) {
                const errorMsg = error.response.data?.message || 'Bad request';
                throw new Error(`Stability API error: ${errorMsg}`);
            }
            
            throw new Error(`Stability generation failed: ${error.message}`);
        }
    }
}

module.exports = StabilityGenerator;