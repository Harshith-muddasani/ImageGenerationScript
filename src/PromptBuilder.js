class PromptBuilder {
    constructor() {
        this.templates = {
            fashion: {
                base: "Full-body photo of {model} wearing {clothing}",
                style: "posing naturally in a {style} setting",
                quality: "with {lighting}, {background}, high detail, 8k resolution, {photography_style}"
            },
            product: {
                base: "Professional product photo of {clothing}",
                style: "displayed on {display_method}",
                quality: "with {lighting}, {background}, commercial photography, high resolution"
            },
            lifestyle: {
                base: "{model} wearing {clothing}",
                style: "in a {setting} environment, {activity}",
                quality: "natural lighting, candid style, high quality photography"
            }
        };

        this.defaults = {
            lighting: "soft studio lighting",
            background: "clean white background",
            photography_style: "realistic photography style",
            display_method: "professional mannequin",
            setting: "urban outdoor",
            activity: "walking casually"
        };
    }

    buildFashionPrompt(options = {}) {
        const {
            clothing,
            model = "young fashion model",
            style = "professional studio",
            template = "fashion",
            customizations = {}
        } = options;

        if (!clothing) {
            throw new Error("Clothing description is required");
        }

        const templateObj = this.templates[template] || this.templates.fashion;
        const settings = { ...this.defaults, ...customizations };

        let prompt = templateObj.base
            .replace('{model}', model)
            .replace('{clothing}', clothing);

        if (templateObj.style) {
            let stylePart = templateObj.style.replace('{style}', style);
            Object.keys(settings).forEach(key => {
                stylePart = stylePart.replace(new RegExp(`{${key}}`, 'g'), settings[key]);
            });
            prompt += `, ${stylePart}`;
        }

        if (templateObj.quality) {
            let qualityPart = templateObj.quality;
            Object.keys(settings).forEach(key => {
                qualityPart = qualityPart.replace(new RegExp(`{${key}}`, 'g'), settings[key]);
            });
            prompt += `, ${qualityPart}`;
        }

        return this.cleanPrompt(prompt);
    }

    buildProductPrompt(options = {}) {
        return this.buildFashionPrompt({
            ...options,
            template: "product",
            model: "",
            customizations: {
                ...this.defaults,
                ...options.customizations
            }
        });
    }

    buildLifestylePrompt(options = {}) {
        return this.buildFashionPrompt({
            ...options,
            template: "lifestyle"
        });
    }

    addQualityModifiers(prompt, quality = "standard") {
        const qualityModifiers = {
            basic: "good quality",
            standard: "high quality, professional photography",
            premium: "ultra-high quality, 8k resolution, professional studio photography, perfect lighting",
            artistic: "artistic photography, creative lighting, professional composition, gallery quality"
        };

        const modifier = qualityModifiers[quality] || qualityModifiers.standard;
        return `${prompt}, ${modifier}`;
    }

    addStyleModifiers(prompt, styleType = "natural") {
        const styleModifiers = {
            natural: "natural pose, authentic expression",
            dramatic: "dramatic lighting, bold composition, striking pose",
            minimalist: "clean composition, minimal background, simple elegant pose",
            vintage: "vintage aesthetic, retro styling, classic pose",
            editorial: "editorial fashion photography, high-fashion pose, magazine quality",
            commercial: "commercial photography style, appealing to consumers"
        };

        const modifier = styleModifiers[styleType] || styleModifiers.natural;
        return `${prompt}, ${modifier}`;
    }

    optimizePrompt(prompt) {
        const optimizations = [
            "photorealistic",
            "detailed textures",
            "professional color grading",
            "sharp focus",
            "well-lit"
        ];

        return `${prompt}, ${optimizations.join(", ")}`;
    }

    cleanPrompt(prompt) {
        return prompt
            .replace(/\s+/g, " ")
            .replace(/,\s*,/g, ",")
            .replace(/^\s*,\s*|\s*,\s*$/g, "")
            .trim();
    }

    generateVariations(basePrompt, count = 3) {
        const variations = [];
        const modifiers = [
            ["warm lighting", "cool lighting", "natural lighting"],
            ["confident pose", "relaxed pose", "elegant pose"],
            ["studio setting", "outdoor setting", "urban setting"],
            ["modern style", "classic style", "trendy style"]
        ];

        for (let i = 0; i < count; i++) {
            let variation = basePrompt;
            
            modifiers.forEach(modifierGroup => {
                const randomModifier = modifierGroup[Math.floor(Math.random() * modifierGroup.length)];
                variation += `, ${randomModifier}`;
            });
            
            variations.push(this.cleanPrompt(variation));
        }

        return variations;
    }

    enhancePrompt(originalPrompt, enhancementType = 'auto') {
        if (!originalPrompt || originalPrompt.trim().length === 0) {
            throw new Error("Original prompt cannot be empty");
        }

        const enhancementStrategies = {
            auto: this.autoEnhancePrompt.bind(this),
            fashion: this.fashionEnhancePrompt.bind(this),
            professional: this.professionalEnhancePrompt.bind(this),
            artistic: this.artisticEnhancePrompt.bind(this),
            detailed: this.detailedEnhancePrompt.bind(this)
        };

        const enhancer = enhancementStrategies[enhancementType] || enhancementStrategies.auto;
        return enhancer(originalPrompt);
    }

    autoEnhancePrompt(prompt) {
        const enhancements = [
            "high quality photography",
            "professional lighting",
            "detailed textures",
            "sharp focus",
            "8k resolution"
        ];

        // Check if prompt already has quality indicators
        const hasQuality = /high quality|professional|8k|4k|detailed|sharp/i.test(prompt);
        const hasLighting = /lighting|light|lit/i.test(prompt);
        
        let enhanced = prompt;
        
        if (!hasQuality) {
            enhanced += ", high quality photography, detailed textures";
        }
        
        if (!hasLighting) {
            enhanced += ", professional lighting, sharp focus";
        }
        
        enhanced += ", photorealistic, 8k resolution";
        
        return this.cleanPrompt(enhanced);
    }

    fashionEnhancePrompt(prompt) {
        const fashionTerms = [
            "fashion photography",
            "studio lighting",
            "professional model pose",
            "high-end fashion",
            "elegant composition",
            "designer clothing",
            "fashion magazine style"
        ];

        let enhanced = prompt;
        
        if (!/fashion|model|clothing|wear/i.test(prompt)) {
            enhanced = `Fashion photography: ${enhanced}`;
        }
        
        enhanced += ", professional studio lighting, high-end fashion photography";
        enhanced += ", elegant pose, designer aesthetic, magazine quality";
        enhanced += ", detailed fabric textures, professional color grading";
        
        return this.cleanPrompt(enhanced);
    }

    professionalEnhancePrompt(prompt) {
        const professionalTerms = [
            "professional photography",
            "commercial quality",
            "studio setup",
            "perfect lighting",
            "crisp details",
            "professional composition"
        ];

        let enhanced = prompt + ", professional commercial photography";
        enhanced += ", studio quality lighting, perfect composition";
        enhanced += ", high-end production value, crisp sharp details";
        enhanced += ", professional color correction, commercial grade";
        
        return this.cleanPrompt(enhanced);
    }

    artisticEnhancePrompt(prompt) {
        const artisticTerms = [
            "artistic photography",
            "creative composition",
            "artistic lighting",
            "fine art style",
            "gallery quality",
            "creative vision"
        ];

        let enhanced = prompt + ", artistic photography, creative composition";
        enhanced += ", dramatic lighting, fine art style";
        enhanced += ", gallery quality, artistic vision, creative framing";
        enhanced += ", sophisticated color palette, artistic excellence";
        
        return this.cleanPrompt(enhanced);
    }

    detailedEnhancePrompt(prompt) {
        let enhanced = prompt + ", ultra-detailed, hyper-realistic";
        enhanced += ", intricate details, perfect textures, fine craftsmanship";
        enhanced += ", meticulous attention to detail, precise rendering";
        enhanced += ", crystal clear, ultra-sharp focus, professional grade";
        enhanced += ", museum quality, masterpiece level detail";
        
        return this.cleanPrompt(enhanced);
    }

    validatePrompt(prompt) {
        const issues = [];
        
        if (!prompt || prompt.trim().length === 0) {
            issues.push("Prompt cannot be empty");
        }
        
        if (prompt.length > 4000) {
            issues.push("Prompt is too long (max 4000 characters)");
        }
        
        const inappropriateTerms = ["nude", "naked", "explicit"];
        const hasInappropriateContent = inappropriateTerms.some(term => 
            prompt.toLowerCase().includes(term)
        );
        
        if (hasInappropriateContent) {
            issues.push("Prompt contains inappropriate content");
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}

module.exports = PromptBuilder;