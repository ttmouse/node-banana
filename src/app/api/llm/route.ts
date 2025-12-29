// [IN]: next/server, @google/genai, @/types
// [OUT]: POST handler (NextResponse<LLMGenerateResponse>)
// [POS]: LLM text generation API (Google/OpenAI) / LLM 文本生成 API 端点
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { LLMGenerateRequest, LLMGenerateResponse, LLMModelType } from "@/types";

export const maxDuration = 60; // 1 minute timeout

// Map model types to actual API model IDs
const GOOGLE_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-3-pro-preview": "gemini-3-pro-preview",
};

const OPENAI_MODEL_MAP: Record<string, string> = {
  "gpt-4.1-mini": "gpt-4.1-mini",
  "gpt-4.1-nano": "gpt-4.1-nano",
};

const GOOGLE_MAX_OUTPUT_TOKENS = 8192;

interface ExtractedGoogleResult {
  text: string;
  meta?: string;
  finishReason?: string;
  blockReason?: string;
}

const extractGoogleText = (response: any): ExtractedGoogleResult => {
  const rootResponse = response?.response ?? response;
  const candidates = rootResponse?.candidates ?? [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];
    if (!Array.isArray(parts)) continue;

    const combined = parts
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (combined) {
      return { text: combined };
    }
  }

  const directText = typeof response?.text === "string" ? response.text.trim() : "";
  if (directText) {
    return { text: directText };
  }

  const finishReason = candidates?.[0]?.finishReason;
  const blockReason = rootResponse?.promptFeedback?.blockReason;
  const metaParts = [
    finishReason ? `finish reason: ${finishReason}` : null,
    blockReason ? `prompt blocked: ${blockReason}` : null,
  ].filter(Boolean);

  return {
    text: "",
    finishReason: finishReason || undefined,
    blockReason: blockReason || undefined,
    meta: metaParts.length ? metaParts.join("; ") : undefined,
  };
};

async function generateWithGoogle(
  prompt: string,
  images: string[] | undefined,
  model: LLMModelType,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = GOOGLE_MODEL_MAP[model];
  let targetTokens = Math.min(maxTokens, GOOGLE_MAX_OUTPUT_TOKENS);

  // Prepare content parts - images first logic
  const parts: any[] = [];

  // Add images if present
  if (images && images.length > 0) {
    console.log(`[LLM] Processing ${images.length} images for generation`);

    images.forEach((image, index) => {
      let mimeType = "image/png";
      let data = image;

      if (image.includes("base64,")) {
        const [header, base64Data] = image.split("base64,");
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        data = base64Data;
      }

      console.log(`[LLM] Image ${index + 1}: ${mimeType}, size=${(data.length / 1024).toFixed(2)}KB`);

      parts.push({
        inlineData: {
          mimeType,
          data
        }
      });
    });
  }

  // Add text prompt last to ensure it's treated as the question/instruction about the context
  parts.push({ text: prompt });

  console.log(`[LLM] Final parts structure: ${parts.length} items (images + 1 text)`);

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      config: {
        temperature,
        maxOutputTokens: targetTokens,
      },
    });

    const { text, meta, finishReason, blockReason } = extractGoogleText(response);
    if (text) {
      return text;
    }

    if (finishReason === "MAX_TOKENS" && targetTokens < GOOGLE_MAX_OUTPUT_TOKENS) {
      targetTokens = Math.min(GOOGLE_MAX_OUTPUT_TOKENS, targetTokens * 2);
      continue;
    }

    if (process.env.NODE_ENV !== "production") {
      try {
        console.warn("Google AI empty response:", JSON.stringify(response, null, 2));
      } catch {
        console.warn("Google AI empty response (unserializable):", response);
      }
    }

    if (blockReason) {
      throw new Error(`Google AI blocked the request (${blockReason})`);
    }

    throw new Error(meta ? `No text in Google AI response (${meta})` : "No text in Google AI response");
  }

  throw new Error("No text in Google AI response (exhausted retries)");
}

async function generateWithOpenAI(
  prompt: string,
  model: LLMModelType,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const modelId = OPENAI_MODEL_MAP[model];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No text in OpenAI response");
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body: LLMGenerateRequest = await request.json();
    const {
      prompt,
      images,
      provider,
      model,
      temperature = 0.7,
      maxTokens = 1024
    } = body;

    if (!prompt) {
      return NextResponse.json<LLMGenerateResponse>(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    let text: string;

    if (provider === "google") {
      text = await generateWithGoogle(prompt, images, model, temperature, maxTokens);
    } else if (provider === "openai") {
      // OpenAI implementation now supports images roughly via this helper if updated
      // but for now let's just use text or throw if image presence needs distinct handling
      // For simplicity, we just pass through to generateWithOpenAI which currently is text-only in this implemented function
      // If we wanted to support GPT-4V, we'd need to update generateWithOpenAI too.
      // Keeping the check for now:
      if (images && images.length > 0) {
        // GPT-4o supports images natively, but our generateWithOpenAI helper needs update.
        // For this task, we focus on Google fix. 
        // Let's relax the check for gpt-4o but warn/error if the helper isn't ready.
        // Actually, let's keep it safe:
        return NextResponse.json<LLMGenerateResponse>(
          { success: false, error: "Image input currently optimized for Google Gemini models only." },
          { status: 400 }
        );
      }
      text = await generateWithOpenAI(prompt, model, temperature, maxTokens);
    } else {
      return NextResponse.json<LLMGenerateResponse>(
        { success: false, error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    return NextResponse.json<LLMGenerateResponse>({
      success: true,
      text,
    });
  } catch (error) {
    console.error("LLM generation error:", error);

    // Handle rate limiting
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json<LLMGenerateResponse>(
        { success: false, error: "Rate limit reached. Please wait and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json<LLMGenerateResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "LLM generation failed",
      },
      { status: 500 }
    );
  }
}
