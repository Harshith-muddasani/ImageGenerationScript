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
            samples = 1,
            referenceImages = [],
            imageToImage = false,
            strength = 0.7,
            referenceType = 'style'
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        // Choose endpoint based on whether we have reference images
        const isImageToImage = imageToImage && referenceImages.length > 0;
        let endpoint = `${this.baseUrl}/generation/${model}/text-to-image`;
        let requestBody = {
            text_prompts: [{ text: prompt }],
            width,
            height,
            steps,
            cfg_scale,
            samples
        };

        if (isImageToImage) {
            endpoint = `${this.baseUrl}/generation/${model}/image-to-image`;
            
            // Use the first reference image as the base
            const baseImage = referenceImages[0];
            requestBody = {
                text_prompts: [{ text: prompt }],
                init_image: baseImage.base64,
                image_strength: 1.0 - strength, // Stability uses inverse strength
                cfg_scale,
                samples,
                steps
            };

            // Adjust parameters based on reference type
            if (referenceType === 'style') {
                requestBody.image_strength = 1.0 - (strength * 0.5); // Less influence for style
                requestBody.cfg_scale = Math.min(cfg_scale * 1.2, 15); // Boost CFG for style transfer
            } else if (referenceType === 'transformation') {
                requestBody.image_strength = 1.0 - strength; // Direct transformation
            } else if (referenceType === 'composition') {
                requestBody.image_strength = 1.0 - (strength * 0.7); // Moderate influence for composition
            }
        }

        try {
            const response = await axios.post(
                endpoint,
                requestBody,
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