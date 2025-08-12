const axios = require('axios');

class GeminiGenerator {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.timeout = config.timeout || 120000;
        
        if (!this.apiKey) {
            throw new Error('Gemini API key is required');
        }
    }

    async generateImage(options = {}) {
        const {
            prompt,
            model = 'gemini-2.0-flash-exp',
            width = 1024,
            height = 1024
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        try {
            // Use Gemini 2.0 Flash for image generation
            const response = await axios.post(
                `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: `Generate a high-quality fashion image: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1000,
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                }
            );

            // Check if we got image data
            const candidate = response.data?.candidates?.[0];
            if (!candidate) {
                throw new Error('No response received from Gemini');
            }

            // Look for image data in the response
            const parts = candidate.content?.parts || [];
            const imagePart = parts.find(part => part.inlineData && part.inlineData.mimeType?.startsWith('image/'));
            
            if (imagePart && imagePart.inlineData.data) {
                const imageData = imagePart.inlineData.data;
                const buffer = Buffer.from(imageData, 'base64');

                return {
                    format: 'buffer',
                    data: buffer,
                    service: 'gemini',
                    model: model
                };
            }

            // If no image found, try Imagen through Gemini API
            return await this.generateWithImagen(prompt);

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid Gemini API key');
            } else if (error.response?.status === 429) {
                throw new Error('Gemini rate limit exceeded - wait and try again');
            } else if (error.response?.status === 400) {
                // Try Imagen fallback
                console.log('Gemini 2.0 Flash not available, trying Imagen...');
                return await this.generateWithImagen(prompt);
            }
            
            throw new Error(`Gemini image generation failed: ${error.message}`);
        }
    }

    async generateWithImagen(prompt) {
        try {
            // Try Imagen 4 first, then Imagen 3
            const models = ['imagen-3.0-generate-001', 'imagegeneration@006'];
            
            for (const model of models) {
                try {
                    const response = await axios.post(
                        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
                        {
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.7,
                                seed: Math.floor(Math.random() * 1000000),
                                responseModalities: ["IMAGE"]
                            }
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: this.timeout
                        }
                    );

                    const candidate = response.data?.candidates?.[0];
                    const parts = candidate?.content?.parts || [];
                    const imagePart = parts.find(part => part.inlineData?.mimeType?.startsWith('image/'));
                    
                    if (imagePart?.inlineData?.data) {
                        const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
                        return {
                            format: 'buffer',
                            data: buffer,
                            service: 'gemini',
                            model: `gemini-${model}`
                        };
                    }
                } catch (modelError) {
                    console.log(`Model ${model} failed, trying next...`);
                    continue;
                }
            }
            
            throw new Error('All Gemini image models failed');
            
        } catch (error) {
            throw new Error(`Gemini Imagen generation failed: ${error.message}`);
        }
    }
}

module.exports = GeminiGenerator;