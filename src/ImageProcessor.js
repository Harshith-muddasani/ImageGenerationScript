const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ImageProcessor {
    constructor(inputDir = './input_images') {
        this.inputDir = inputDir;
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
    }

    scanInputDirectory() {
        try {
            if (!fs.existsSync(this.inputDir)) {
                return [];
            }

            const files = fs.readdirSync(this.inputDir);
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return this.supportedFormats.includes(ext) && file !== 'README.md';
            });

            return imageFiles.map(file => ({
                filename: file,
                path: path.join(this.inputDir, file),
                size: this.getFileSize(path.join(this.inputDir, file)),
                extension: path.extname(file).toLowerCase()
            }));
        } catch (error) {
            console.error('Error scanning input directory:', error.message);
            return [];
        }
    }

    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return {
                bytes: stats.size,
                readable: this.formatFileSize(stats.size)
            };
        } catch (error) {
            return { bytes: 0, readable: 'Unknown' };
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadImageAsBase64(imagePath) {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64 = imageBuffer.toString('base64');
            const extension = path.extname(imagePath).toLowerCase();
            
            // Determine MIME type
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
                '.bmp': 'image/bmp'
            };

            const mimeType = mimeTypes[extension] || 'image/jpeg';
            
            return {
                base64: base64,
                dataUrl: `data:${mimeType};base64,${base64}`,
                mimeType: mimeType,
                size: imageBuffer.length
            };
        } catch (error) {
            throw new Error(`Failed to load image ${imagePath}: ${error.message}`);
        }
    }

    async loadImageAsBuffer(imagePath) {
        try {
            return fs.readFileSync(imagePath);
        } catch (error) {
            throw new Error(`Failed to load image buffer ${imagePath}: ${error.message}`);
        }
    }

    validateImageFile(imagePath) {
        const issues = [];

        if (!fs.existsSync(imagePath)) {
            issues.push('File does not exist');
            return { valid: false, issues };
        }

        const extension = path.extname(imagePath).toLowerCase();
        if (!this.supportedFormats.includes(extension)) {
            issues.push(`Unsupported format ${extension}. Supported: ${this.supportedFormats.join(', ')}`);
        }

        const stats = fs.statSync(imagePath);
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        if (stats.size > maxSize) {
            issues.push(`File too large (${this.formatFileSize(stats.size)}). Maximum: ${this.formatFileSize(maxSize)}`);
        }

        if (stats.size === 0) {
            issues.push('File is empty');
        }

        return {
            valid: issues.length === 0,
            issues: issues
        };
    }

    async processReferenceImages(selectedImages, useType = 'style', strength = 0.7) {
        const processedImages = [];

        for (const imagePath of selectedImages) {
            try {
                const validation = this.validateImageFile(imagePath);
                if (!validation.valid) {
                    console.warn(`Skipping ${imagePath}: ${validation.issues.join(', ')}`);
                    continue;
                }

                const imageData = await this.loadImageAsBase64(imagePath);
                
                processedImages.push({
                    path: imagePath,
                    filename: path.basename(imagePath),
                    base64: imageData.base64,
                    dataUrl: imageData.dataUrl,
                    mimeType: imageData.mimeType,
                    size: imageData.size,
                    useType: useType,
                    strength: strength
                });

            } catch (error) {
                console.error(`Error processing ${imagePath}: ${error.message}`);
            }
        }

        return processedImages;
    }

    getCompatibleGenerators(hasImages = false) {
        if (!hasImages) {
            return ['openai', 'stability', 'replicate', 'huggingface', 'gemini'];
        }

        // Only return generators that support image-to-image
        return {
            excellent: ['stability', 'replicate'], // Best img2img support
            good: ['huggingface'], // Decent img2img support  
            limited: ['gemini'], // Some img2img models
            none: ['openai'] // No img2img support
        };
    }

    optimizeImageForAPI(imageBuffer, targetSize = 1024, apiType = 'stability') {
        // This is a placeholder for image optimization
        // In a real implementation, you'd use a library like sharp or jimp
        // to resize and optimize images for specific API requirements
        
        const optimizationSettings = {
            stability: { maxSize: 1024, format: 'png' },
            replicate: { maxSize: 1024, format: 'jpg' },
            huggingface: { maxSize: 512, format: 'jpg' },
            gemini: { maxSize: 1024, format: 'png' }
        };

        const settings = optimizationSettings[apiType] || optimizationSettings.stability;
        
        return {
            buffer: imageBuffer,
            optimized: false, // Would be true if actual optimization occurred
            originalSize: imageBuffer.length,
            finalSize: imageBuffer.length,
            settings: settings
        };
    }

    generateImageHash(imagePath) {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const crypto = require('crypto');
            return crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 8);
        } catch (error) {
            return Math.random().toString(36).substring(2, 10);
        }
    }
}

module.exports = ImageProcessor;