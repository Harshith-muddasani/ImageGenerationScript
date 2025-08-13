require('dotenv').config();

const APIManager = require('./src/APIManager');
const FileManager = require('./src/FileManager');
const PromptBuilder = require('./src/PromptBuilder');
const ImageProcessor = require('./src/ImageProcessor');
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
        const imageProcessor = new ImageProcessor();

        console.log('\n' + '='.repeat(50));
        console.log('🖼️  Let\'s generate your fashion image!');
        console.log('='.repeat(50) + '\n');

        // Get user input
        const initialPrompt = await askQuestion(rl, '✏️  Enter your initial prompt/description: ');
        if (!initialPrompt) {
            console.log('❌ Prompt is required!');
            process.exit(1);
        }

        // Prompt enhancement workflow
        console.log('\n🔧 PROMPT ENHANCEMENT STAGE');
        console.log('==========================\n');

        // Show enhancement options
        console.log('📋 Available enhancement types:');
        console.log('   1. auto - Automatic quality enhancements');
        console.log('   2. fashion - Fashion photography focused');
        console.log('   3. professional - Commercial/professional quality');
        console.log('   4. artistic - Creative/artistic style');
        console.log('   5. detailed - Ultra-detailed rendering');
        console.log('   6. none - Skip enhancement');

        const enhancementType = (await askQuestion(rl, '\n🎯 Select enhancement type (1-6, default: 1): ')) || '1';
        
        const enhancementMap = {
            '1': 'auto',
            '2': 'fashion', 
            '3': 'professional',
            '4': 'artistic',
            '5': 'detailed',
            '6': 'none'
        };

        let finalPrompt = initialPrompt;
        
        if (enhancementMap[enhancementType] !== 'none') {
            const selectedType = enhancementMap[enhancementType] || 'auto';
            console.log(`\n🚀 Enhancing prompt with ${selectedType} enhancement...`);
            
            try {
                finalPrompt = promptBuilder.enhancePrompt(initialPrompt, selectedType);
            } catch (error) {
                console.log(`⚠️  Enhancement failed: ${error.message}`);
                console.log('📝 Using original prompt...');
                finalPrompt = initialPrompt;
            }
        }

        // Display enhanced prompt for confirmation
        console.log('\n📝 ENHANCED PROMPT:');
        console.log('==================');
        console.log(`"${finalPrompt}"`);
        
        console.log('\n🔍 PROMPT CONFIRMATION');
        console.log('=====================');
        
        const confirmPrompt = await askQuestion(rl, '✅ Use this enhanced prompt? (y/N/edit): ');
        
        if (confirmPrompt.toLowerCase() === 'edit' || confirmPrompt.toLowerCase() === 'e') {
            const additionalWords = await askQuestion(rl, '✏️  Add words to enhance further: ');
            if (additionalWords.trim()) {
                finalPrompt = `${finalPrompt}, ${additionalWords.trim()}`;
                console.log(`\n📝 Final prompt: "${finalPrompt}"`);
            }
        } else if (confirmPrompt.toLowerCase() !== 'y' && confirmPrompt.toLowerCase() !== 'yes') {
            console.log('🔄 Using original prompt instead...');
            finalPrompt = initialPrompt;
        }

        // Validate the final prompt
        const validation = promptBuilder.validatePrompt(finalPrompt);
        if (!validation.valid) {
            console.log('❌ Prompt validation failed:');
            validation.issues.forEach(issue => console.log(`   • ${issue}`));
            process.exit(1);
        }

        // Check for reference images
        console.log('\n🖼️  REFERENCE IMAGES STAGE');
        console.log('=========================\n');
        
        const availableImages = imageProcessor.scanInputDirectory();
        let selectedImages = [];
        let referenceType = 'none';
        let influenceStrength = 0.7;

        if (availableImages.length === 0) {
            console.log('📁 No images found in input_images/ directory');
            console.log('💡 To use reference images, place them in: input_images/');
            console.log('   Supported formats: JPG, PNG, WEBP, GIF, BMP');
        } else {
            console.log(`📸 Found ${availableImages.length} reference image(s):`);
            availableImages.forEach((img, index) => {
                console.log(`   ${index + 1}. ${img.filename} (${img.size.readable})`);
            });

            const useImages = await askQuestion(rl, '\n🎯 Use reference images? (y/N): ');
            
            if (useImages.toLowerCase() === 'y' || useImages.toLowerCase() === 'yes') {
                // Check API compatibility
                const compatibility = imageProcessor.getCompatibleGenerators(true);
                const currentAPI = apiManager.getActiveGeneratorInfo().name;
                
                if (compatibility.none.includes(currentAPI)) {
                    console.log(`⚠️  ${currentAPI.toUpperCase()} doesn't support image-to-image generation.`);
                    console.log(`🔄 Compatible APIs: ${compatibility.excellent.concat(compatibility.good).join(', ').toUpperCase()}`);
                    
                    const switchAPI = await askQuestion(rl, '🔄 Switch to compatible API automatically? (y/N): ');
                    if (switchAPI.toLowerCase() !== 'y' && switchAPI.toLowerCase() !== 'yes') {
                        console.log('📝 Continuing with text-only generation...');
                    } else {
                        // Switch to best compatible API
                        const fallback = apiManager.findFallbackGenerator();
                        if (fallback && (compatibility.excellent.includes(fallback.name) || compatibility.good.includes(fallback.name))) {
                            apiManager.activeGenerator = fallback;
                            console.log(`✅ Switched to ${fallback.name.toUpperCase()} for image-to-image generation`);
                        }
                    }
                }

                if (compatibility.excellent.includes(apiManager.getActiveGeneratorInfo().name) || 
                    compatibility.good.includes(apiManager.getActiveGeneratorInfo().name)) {
                    
                    // Select images to use (using all by default as requested)
                    selectedImages = availableImages.map(img => img.path);
                    console.log(`✅ Using all ${selectedImages.length} reference images`);

                    // Choose reference type
                    console.log('\n📋 How should reference images be used?');
                    console.log('   1. Style reference - Influence overall aesthetic/style');
                    console.log('   2. Composition guide - Influence layout/pose/structure');
                    console.log('   3. Transformation base - Direct image-to-image transformation');
                    console.log('   4. Combined - Use all influence types');

                    const typeChoice = await askQuestion(rl, '\n🎨 Select reference type (1-4, default: 1): ') || '1';
                    const typeMap = {
                        '1': 'style',
                        '2': 'composition', 
                        '3': 'transformation',
                        '4': 'combined'
                    };
                    referenceType = typeMap[typeChoice] || 'style';

                    // Set influence strength
                    const strengthInput = await askQuestion(rl, '\n⚡ Set influence strength (0.1-1.0, default: 0.7): ');
                    const parsedStrength = parseFloat(strengthInput);
                    if (!isNaN(parsedStrength) && parsedStrength >= 0.1 && parsedStrength <= 1.0) {
                        influenceStrength = parsedStrength;
                    }

                    console.log(`\n✅ Reference setup complete:`);
                    console.log(`   📸 Images: ${selectedImages.length}`);
                    console.log(`   🎨 Type: ${referenceType}`);
                    console.log(`   ⚡ Strength: ${influenceStrength}`);
                }
            }
        }
        
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

        console.log('\n📝 Using final prompt:', finalPrompt);
        console.log('\n🚀 Starting image generation...');
        console.log('⏳ This may take 30 seconds to 3 minutes depending on the service...\n');

        // Prepare generation parameters
        const generationParams = {
            prompt: finalPrompt,
            size: imageSize,
            quality: imageQuality,
            width: parseInt(imageSize.split('x')[0]),
            height: parseInt(imageSize.split('x')[1])
        };

        // Add reference images if selected
        if (selectedImages.length > 0) {
            try {
                const processedImages = await imageProcessor.processReferenceImages(
                    selectedImages, 
                    referenceType, 
                    influenceStrength
                );
                
                if (processedImages.length > 0) {
                    generationParams.referenceImages = processedImages;
                    generationParams.imageToImage = true;
                    generationParams.strength = influenceStrength;
                    generationParams.referenceType = referenceType;
                    
                    console.log(`📸 Processed ${processedImages.length} reference images`);
                } else {
                    console.log('⚠️  No reference images could be processed, using text-only generation');
                }
            } catch (error) {
                console.log(`⚠️  Error processing reference images: ${error.message}`);
                console.log('📝 Falling back to text-only generation...');
            }
        }

        // Generate image
        const startTime = Date.now();
        const imageData = await apiManager.generateImage(generationParams);

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        // Save image
        const fileName = fileManager.generateFileName(finalPrompt, 'png');
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