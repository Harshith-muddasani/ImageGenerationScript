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