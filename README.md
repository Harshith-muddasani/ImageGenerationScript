# 🖼️ Fashion Image Generator

**Clean, focused image generation with any AI service. No fluff - just images.**

## 🚀 Quick Start

### 1. Add your API key to `.env`:
```bash
# Any of these will work:
OPENAI_API_KEY=sk-your_key           # DALL-E (best quality)
STABILITY_API_KEY=sk-your_key        # Stable Diffusion
REPLICATE_API_TOKEN=r8_your_token    # Multiple models + free credits
HUGGINGFACE_API_KEY=hf_your_token    # Free tier
GEMINI_API_KEY=AIza_your_key         # Google Imagen models
```

### 2. Generate images:
```bash
npm start
```

**That's it.** The system detects your API service and generates images.

## 🎯 Supported Services

| Service | Cost | Quality | Get API Key |
|---------|------|---------|-------------|
| **OpenAI DALL-E** | $0.02-0.08/image | Highest | https://platform.openai.com/api-keys |
| **Stability AI** | $0.01/image | High | https://platform.stability.ai/account/keys |
| **Replicate** | Free $5 credits | High | https://replicate.com/account/api-tokens |
| **Hugging Face** | Free (limited) | Good | https://huggingface.co/settings/tokens |
| **Google Gemini** | $0.03-0.04/image | High | https://aistudio.google.com/app/apikey |

## 📁 Project Structure

```
wearattraction-image-gen/
├── .env                    # Your API key goes here
├── generateImage.js        # Main program
├── src/
│   ├── APIManager.js       # Detects and manages APIs
│   ├── FileManager.js      # Saves images
│   ├── PromptBuilder.js    # Creates fashion prompts
│   └── generators/         # API implementations
└── generated_images/       # Your images save here
```

## 🔧 How It Works

1. **Scans .env** for any image generation API key
2. **Prioritizes** best available service (OpenAI > Stability > Replicate > HuggingFace > Gemini)  
3. **Generates images** using the selected service
4. **Saves** with smart filenames and timestamps
5. **Fallback** to next service if one fails

## 💡 Example

```
Input: "red evening dress"
↓
System detects: REPLICATE_API_TOKEN  
↓
Generates: Professional fashion photo
↓
Saves: red_evening_dress_2025-01-15T10-30-45.png
```

## ⚙️ Configuration

Optional settings in `.env`:
```bash
OUTPUT_DIRECTORY=./my_images     # Custom output folder
DEFAULT_IMAGE_SIZE=1024x1024     # Default dimensions  
DEFAULT_IMAGE_QUALITY=hd         # Quality setting
```

## 🚨 Troubleshooting

**"No API keys found"**
- Add any image generation API key to `.env`

**"Service failed"**  
- Check API key validity
- Verify account has credits
- System will try backup services automatically

**"Generation timeout"**
- Some services are slower, increase timeout if needed

## 🎉 Ready!

1. Add API key to `.env`
2. Run `npm start` 
3. Generate fashion images

The system handles everything else - detection, fallbacks, file management, and error recovery.

**Focus: Generate images. Nothing else.**