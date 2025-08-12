require('dotenv').config();
const ImageGenerator = require('../src/ImageGenerator');
const FileManager = require('../src/FileManager');
const PromptBuilder = require('../src/PromptBuilder');

async function basicExample() {
    try {
        console.log('🎨 Basic Image Generation Example');
        console.log('==================================\n');

        // Initialize components
        const imageGenerator = new ImageGenerator();
        const fileManager = new FileManager('./examples/output');
        const promptBuilder = new PromptBuilder();

        // Build a fashion prompt
        const prompt = promptBuilder.buildFashionPrompt({
            clothing: 'elegant red evening dress',
            model: 'sophisticated female model',
            style: 'luxury fashion studio'
        });

        console.log('📝 Generated prompt:', prompt);

        // Generate image
        console.log('\n🔄 Generating image...');
        const imageData = await imageGenerator.generateImage({
            prompt: prompt,
            size: '1024x1024',
            quality: 'hd'
        });

        // Save image
        const fileName = fileManager.generateFileName('red_evening_dress');
        const filePath = await fileManager.saveImage(imageData, fileName);

        console.log(`\n✅ Success! Image saved to: ${filePath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function multipleVariationsExample() {
    try {
        console.log('\n🎨 Multiple Variations Example');
        console.log('===============================\n');

        const imageGenerator = new ImageGenerator();
        const fileManager = new FileManager('./examples/output');
        const promptBuilder = new PromptBuilder();

        const basePrompt = promptBuilder.buildFashionPrompt({
            clothing: 'casual denim jacket and jeans',
            model: 'young casual model',
            style: 'urban street setting'
        });

        // Generate 3 variations
        const variations = promptBuilder.generateVariations(basePrompt, 3);

        for (let i = 0; i < variations.length; i++) {
            console.log(`🔄 Generating variation ${i + 1}/3...`);
            
            const imageData = await imageGenerator.generateImage({
                prompt: variations[i],
                size: '1024x1024'
            });

            const fileName = fileManager.generateFileName(`denim_variation_${i + 1}`);
            const filePath = await fileManager.saveImage(imageData, fileName);
            
            console.log(`✅ Variation ${i + 1} saved: ${fileName}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function productPhotoExample() {
    try {
        console.log('\n🛍️ Product Photo Example');
        console.log('=========================\n');

        const imageGenerator = new ImageGenerator();
        const fileManager = new FileManager('./examples/output');
        const promptBuilder = new PromptBuilder();

        const prompt = promptBuilder.buildProductPrompt({
            clothing: 'white cotton t-shirt',
            customizations: {
                display_method: 'flat lay arrangement',
                background: 'minimalist white background',
                lighting: 'soft even lighting'
            }
        });

        console.log('📝 Product prompt:', prompt);

        const imageData = await imageGenerator.generateImage({
            prompt: prompt,
            size: '1024x1024',
            quality: 'hd'
        });

        const fileName = fileManager.generateFileName('white_tshirt_product');
        const filePath = await fileManager.saveImage(imageData, fileName);

        console.log(`✅ Product photo saved: ${filePath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run examples
async function runAllExamples() {
    await basicExample();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between requests
    
    await multipleVariationsExample();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await productPhotoExample();
    
    console.log('\n🎉 All examples completed!');
}

if (require.main === module) {
    runAllExamples();
}

module.exports = {
    basicExample,
    multipleVariationsExample,
    productPhotoExample
};