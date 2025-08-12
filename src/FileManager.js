const fs = require('fs');
const path = require('path');

class FileManager {
    constructor(outputDirectory = './generated_images') {
        this.outputDirectory = path.resolve(outputDirectory);
        this.ensureDirectoryExists();
    }

    ensureDirectoryExists() {
        if (!fs.existsSync(this.outputDirectory)) {
            fs.mkdirSync(this.outputDirectory, { recursive: true });
            console.log(`📁 Created output directory: ${this.outputDirectory}`);
        }
    }

    generateFileName(description, extension = 'png') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const sanitizedDesc = description
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);
        
        return `${sanitizedDesc}_${timestamp}.${extension}`;
    }

    async saveImage(imageData, fileName) {
        const filePath = path.join(this.outputDirectory, fileName);
        
        try {
            let buffer;
            
            if (imageData.format === 'base64') {
                buffer = Buffer.from(imageData.data, 'base64');
            } else if (imageData.format === 'buffer') {
                buffer = Buffer.from(imageData.data);
            } else {
                throw new Error('Unsupported image data format');
            }

            await fs.promises.writeFile(filePath, buffer);
            
            const stats = await fs.promises.stat(filePath);
            console.log(`💾 Image saved: ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);
            
            return filePath;
        } catch (error) {
            throw new Error(`Failed to save image: ${error.message}`);
        }
    }

    async saveImageFromUrl(imageUrl, fileName) {
        const axios = require('axios');
        
        try {
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            const imageData = {
                format: 'buffer',
                data: response.data
            };
            
            return await this.saveImage(imageData, fileName);
        } catch (error) {
            throw new Error(`Failed to download and save image from URL: ${error.message}`);
        }
    }

    listGeneratedImages() {
        try {
            const files = fs.readdirSync(this.outputDirectory)
                .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
                .map(file => {
                    const filePath = path.join(this.outputDirectory, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        created: stats.birthtime
                    };
                })
                .sort((a, b) => b.created - a.created);
            
            return files;
        } catch (error) {
            console.error('Error listing generated images:', error.message);
            return [];
        }
    }

    getOutputDirectory() {
        return this.outputDirectory;
    }

    cleanup(keepLastN = 10) {
        try {
            const files = this.listGeneratedImages();
            
            if (files.length > keepLastN) {
                const filesToDelete = files.slice(keepLastN);
                
                filesToDelete.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`🗑️ Deleted old image: ${file.name}`);
                    } catch (error) {
                        console.error(`Failed to delete ${file.name}:`, error.message);
                    }
                });
                
                console.log(`🧹 Cleanup completed. Kept ${keepLastN} most recent images.`);
            } else {
                console.log(`📊 Only ${files.length} images found. No cleanup needed.`);
            }
        } catch (error) {
            console.error('Cleanup failed:', error.message);
        }
    }
}

module.exports = FileManager;