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
            num_outputs = 1,
            referenceImages = [],
            imageToImage = false,
            strength = 0.7,
            referenceType = 'style'
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        // Prepare input parameters
        let inputParams = {
            prompt,
            width,
            height,
            num_inference_steps,
            guidance_scale,
            num_outputs
        };

        // Use img2img model if reference images are provided
        let selectedModel = model;
        const isImageToImage = imageToImage && referenceImages.length > 0;

        if (isImageToImage) {
            // Switch to an img2img capable model
            selectedModel = 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf';
            
            // Use the first reference image
            const baseImage = referenceImages[0];
            inputParams.image = baseImage.dataUrl;
            inputParams.prompt_strength = strength;

            // Adjust parameters based on reference type
            if (referenceType === 'style') {
                inputParams.prompt_strength = strength * 0.6; // Lighter influence for style
                inputParams.guidance_scale = Math.min(guidance_scale * 1.3, 20);
            } else if (referenceType === 'transformation') {
                inputParams.prompt_strength = strength;
            } else if (referenceType === 'composition') {
                inputParams.prompt_strength = strength * 0.8;
            }
        }

        try {
            // Create prediction
            const predictionResponse = await axios.post(
                `${this.baseUrl}/predictions`,
                {
                    version: selectedModel.includes(':') ? selectedModel.split(':')[1] : selectedModel,
                    input: inputParams
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