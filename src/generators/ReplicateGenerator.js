const axios = require('axios');

class ReplicateGenerator {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.replicate.com/v1';
        this.timeout = config.timeout || 300000; // 5 minutes
        
        if (!this.apiKey) {
            throw new Error('Replicate API token is required');
        }
    }

    async generateImage(options = {}) {
        const {
            prompt,
            model = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
            width = 1024,
            height = 1024,
            num_inference_steps = 50,
            guidance_scale = 7.5,
            num_outputs = 1
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        try {
            // Create prediction
            const predictionResponse = await axios.post(
                `${this.baseUrl}/predictions`,
                {
                    version: model.includes(':') ? model.split(':')[1] : model,
                    input: {
                        prompt,
                        width,
                        height,
                        num_inference_steps,
                        guidance_scale,
                        num_outputs
                    }
                },
                {
                    headers: {
                        'Authorization': `Token ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const predictionId = predictionResponse.data.id;
            
            // Poll for completion
            let prediction = predictionResponse.data;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                
                const statusResponse = await axios.get(
                    `${this.baseUrl}/predictions/${predictionId}`,
                    {
                        headers: {
                            'Authorization': `Token ${this.apiKey}`
                        }
                    }
                );
                
                prediction = statusResponse.data;
                attempts++;
                
                if (attempts % 6 === 0) { // Every 30 seconds
                    console.log(`⏳ Still processing... (${attempts * 5}s elapsed)`);
                }
            }

            if (prediction.status === 'succeeded') {
                const imageUrl = prediction.output[0];
                
                // Download the image
                const imageResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                return {
                    format: 'buffer',
                    data: imageResponse.data,
                    url: imageUrl,
                    service: 'replicate',
                    model: model
                };
                
            } else if (prediction.status === 'failed') {
                throw new Error(`Generation failed: ${prediction.error || 'Unknown error'}`);
            } else {
                throw new Error('Generation timed out after 5 minutes');
            }

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid Replicate API token');
            } else if (error.response?.status === 402) {
                throw new Error('Insufficient credits - add credits to your Replicate account');
            } else if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded - wait and try again');
            }
            
            throw new Error(`Replicate generation failed: ${error.message}`);
        }
    }
}

module.exports = ReplicateGenerator;