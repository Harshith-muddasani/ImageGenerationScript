const axios = require('axios');

class OpenAIGenerator {
    constructor(config = {}) {
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        this.timeout = config.timeout || 120000;
        
        if (!this.apiKey) {
            throw new Error('OpenAI API key is required');
        }
    }

    async generateImage(options = {}) {
        const {
            prompt,
            model = 'dall-e-3',
            size = '1024x1024',
            quality = 'standard',
            style = 'natural',
            n = 1
        } = options;

        if (!prompt) {
            throw new Error('Prompt is required');
        }

        this.validateOptions({ model, size, quality, style, n });

        const requestData = {
            model,
            prompt,
            n,
            size,
            response_format: 'url'
        };

        if (model === 'dall-e-3') {
            if (quality) requestData.quality = quality;
            if (style) requestData.style = style;
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/images/generations`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: this.timeout
                }
            );

            if (!response.data.data?.[0]?.url) {
                throw new Error('No image URL received from OpenAI');
            }

            const imageUrl = response.data.data[0].url;
            
            // Download the image
            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: this.timeout
            });

            return {
                format: 'buffer',
                data: imageResponse.data,
                url: imageUrl,
                revised_prompt: response.data.data[0].revised_prompt,
                service: 'openai',
                model: model
            };

        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Invalid OpenAI API key');
            } else if (error.response?.status === 402) {
                throw new Error('OpenAI billing limit reached - add credits to your account');
            } else if (error.response?.status === 429) {
                throw new Error('OpenAI rate limit exceeded - wait and try again');
            } else if (error.response?.status === 400) {
                const errorMsg = error.response.data?.error?.message || 'Bad request';
                throw new Error(`OpenAI API error: ${errorMsg}`);
            }
            
            throw new Error(`OpenAI generation failed: ${error.message}`);
        }
    }

    validateOptions({ model, size, quality, style, n }) {
        const validModels = ['dall-e-2', 'dall-e-3'];
        if (!validModels.includes(model)) {
            throw new Error(`Invalid model. Valid models: ${validModels.join(', ')}`);
        }

        const validSizes = model === 'dall-e-3' 
            ? ['1024x1024', '1024x1792', '1792x1024']
            : ['256x256', '512x512', '1024x1024'];
            
        if (!validSizes.includes(size)) {
            throw new Error(`Invalid size for ${model}. Valid sizes: ${validSizes.join(', ')}`);
        }

        if (model === 'dall-e-3') {
            if (quality && !['standard', 'hd'].includes(quality)) {
                throw new Error('Invalid quality. Valid: standard, hd');
            }
            if (style && !['natural', 'vivid'].includes(style)) {
                throw new Error('Invalid style. Valid: natural, vivid');
            }
            if (n > 1) {
                throw new Error('DALL-E 3 can only generate 1 image at a time');
            }
        }

        if (n < 1 || n > 4) {
            throw new Error('Number of images must be between 1 and 4');
        }
    }
}

module.exports = OpenAIGenerator;