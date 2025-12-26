export const PROMPT_TEMPLATES = [
    {
        id: "reverse_engineer",
        label: "🖼️ 逆向工程 (Image to Prompt)",
        prompt: `Analyze this image and provide a structured description in JSON format with the following keys:
1. "image_analysis": A detailed breakdown containing:
   - "subject": Description of the main subject (appearance, pose, clothing).
   - "environment": Setting, background elements, atmosphere.
   - "lighting": Type, sources, quality of light.
   - "technical_specs": Art style (e.g., photorealistic, 3D render), camera settings, resolution.
   - "colors": Primary and secondary color palettes.
2. "generated_prompt": A highly detailed, robust text prompt derived from the analysis, suitable for generating a similar image.
3. "negative_prompt": A list of elements to avoid (e.g., low quality, blurry, text).

Output ONLY valid JSON without Markdown formatting.`
    },
    {
        id: "meta_prompt",
        label: "🧩 通用模板 (Meta-Prompt)",
        prompt: `Based on the provided image or text description, create a generic "Meta-Prompt" template. 
- Replace specific attributes with placeholders in brackets like [subject], [clothing], [environment], [lighting].
- Maintain the artistic style modifiers and technical keywords.
- The output should be a reusable prompt that retains the aesthetic but allows for subject/context swapping.

Output ONLY valid JSON with a "generated_prompt" field containing the template.`
    },
    {
        id: "subject_variation",
        label: "🎭 主体变换 (Subject Swap)",
        prompt: `[original prompt]
Replace the main subject in the prompt above with [new subject] while keeping the style, lighting, and composition tokens identical.`
    }
];
