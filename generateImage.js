require('dotenv').config();

const APIManager = require('./src/APIManager');
const FileManager = require('./src/FileManager');
const PromptBuilder = require('./src/PromptBuilder');
const readline = require('readline');
const path = require('path');

async function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function displayAPIStatus(apiManager) {
    console.log('🔍 API Status Check:');
    console.log('==================');
    
    const generators = apiManager.listAvailableGenerators();
    
    if (generators.length === 0) {
        console.log('❌ No API keys found in .env file');
        console.log('\n💡 Please add at least one API key to your .env file:');
        console.log('   • OPENAI_API_KEY=your_key (Premium quality)');
        console.log('   • STABILITY_API_KEY=your_key (Good quality, lower cost)');
        console.log('   • REPLICATE_API_TOKEN=your_token (Free $5 credits)');
        console.log('   • HUGGINGFACE_API_KEY=your_token (Free tier available)');
        return false;
    }

    generators.forEach((gen, index) => {
        const icon = index === 0 ? '🎯' : '⚙️';
        const status = index === 0 ? '(ACTIVE)' : '(BACKUP)';
        console.log(`${icon} ${gen.name} ${status}`);
        console.log(`   Cost: ${gen.capabilities.cost}`);
        console.log(`   Models: ${gen.capabilities.models?.join(', ') || 'Various'}`);
    });

    const activeInfo = apiManager.getActiveGeneratorInfo();
    console.log(`\n✅ Ready to generate images with ${activeInfo.name.toUpperCase()}!`);
    return true;
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        console.log('🎨 Universal Fashion Image Generator');
        console.log('==================================\n');

        // Initialize API Manager
        const apiManager = new APIManager();
        const hasValidAPI = await displayAPIStatus(apiManager);

        if (!hasValidAPI) {
            process.exit(1);
        }

        // Initialize other components
        const outputDir = process.env.OUTPUT_DIRECTORY || './generated_images';
        const fileManager = new FileManager(outputDir);
        const promptBuilder = new PromptBuilder();

        console.log('\n' + '='.repeat(50));
        console.log('🖼️  Let\'s generate your fashion image!');
        console.log('='.repeat(50) + '\n');

        // Get user input
        const clothingDesc = await askQuestion(rl, '👗 Enter clothing description: ');
        if (!clothingDesc) {
            console.log('❌ Clothing description is required!');
            process.exit(1);
        }

        const style = (await askQuestion(rl, '🎨 Enter style (optional, press enter for default): ')) || 'professional studio photography';
        const model = (await askQuestion(rl, '👤 Enter model preference (optional, press enter for default): ')) || 'young female fashion model';
        
        // Advanced options
        const wantAdvanced = await askQuestion(rl, '\n⚙️  Configure advanced options? (y/N): ');
        let imageSize = process.env.DEFAULT_IMAGE_SIZE || '1024x1024';
        let imageQuality = process.env.DEFAULT_IMAGE_QUALITY || 'standard';

        if (wantAdvanced.toLowerCase().startsWith('y')) {
            const activeGen = apiManager.getActiveGeneratorInfo();
            const availableSizes = activeGen.capabilities.sizes || ['1024x1024'];
            
            console.log(`\n📐 Available sizes: ${availableSizes.join(', ')}`);
            const userSize = await askQuestion(rl, `   Select size (default: ${imageSize}): `);
            if (userSize && availableSizes.includes(userSize)) {
                imageSize = userSize;
            }

            if (activeGen.name === 'openai') {
                const userQuality = await askQuestion(rl, '✨ Quality (standard/hd, default: standard): ');
                if (userQuality && ['standard', 'hd'].includes(userQuality)) {
                    imageQuality = userQuality;
                }
            }
        }

        // Build prompt
        const prompt = promptBuilder.buildFashionPrompt({
            clothing: clothingDesc,
            model: model,
            style: style
        });

        console.log('\n📝 Generated prompt:', prompt);
        console.log('\n🚀 Starting image generation...');
        console.log('⏳ This may take 30 seconds to 3 minutes depending on the service...\n');

        // Generate image
        const startTime = Date.now();
        const imageData = await apiManager.generateImage({
            prompt: prompt,
            size: imageSize,
            quality: imageQuality,
            width: parseInt(imageSize.split('x')[0]),
            height: parseInt(imageSize.split('x')[1])
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        // Save image
        const fileName = fileManager.generateFileName(clothingDesc, 'png');
        const filePath = await fileManager.saveImage(imageData, fileName);

        // Success message
        console.log('\n🎉 SUCCESS! Image generated and saved!');
        console.log('====================================');
        console.log(`📁 File: ${filePath}`);
        console.log(`⚡ Service: ${imageData.service.toUpperCase()}`);
        console.log(`🤖 Model: ${imageData.model}`);
        console.log(`⏱️  Time: ${duration} seconds`);
        
        if (imageData.url) {
            console.log(`🌐 Original URL: ${imageData.url}`);
        }
        
        if (imageData.revised_prompt) {
            console.log(`📝 AI revised prompt: ${imageData.revised_prompt}`);
        }

        console.log(`\n📂 Output directory: ${path.resolve(outputDir)}`);
        console.log('\n✨ Open the image file to see your generated fashion photo!');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        
        if (error.message.includes('API key') || error.message.includes('Invalid')) {
            console.log('\n💡 API Key Issues:');
            console.log('   1. Check that your API key is correct in .env');
            console.log('   2. Verify the API key has proper permissions');
            console.log('   3. Make sure you have sufficient credits/quota');
        } else if (error.message.includes('billing') || error.message.includes('credits')) {
            console.log('\n💳 Billing Issues:');
            console.log('   1. Add credits to your account');
            console.log('   2. Check your billing limits');
            console.log('   3. Verify payment method is valid');
        }
        
        process.exit(1);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };