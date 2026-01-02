// [IN]: next/server, @google/genai
// [OUT]: POST handler (NextResponse<ValidateResponse>)
// [POS]: API connection validation endpoint / API 连接验证端点
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ValidateRequest {
  apiKey: string;
  apiEndpoint?: string;
}

interface ValidateResponse {
  success: boolean;
  message?: string;
  error?: string;
  responseType?: "text" | "image";
}

export const maxDuration = 60; // 1 minute timeout for validation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[VALIDATE:${requestId}] ========== VALIDATION REQUEST ==========`);

  try {
    const body: ValidateRequest = await request.json();
    const { apiKey, apiEndpoint } = body;

    if (!apiKey) {
      return NextResponse.json<ValidateResponse>({
        success: false,
        error: "API Key 未提供",
      }, { status: 400 });
    }

    const isCustomEndpoint = !!apiEndpoint;
    console.log(`[VALIDATE:${requestId}] Custom Endpoint: ${isCustomEndpoint ? apiEndpoint : 'No (using official Google API)'}`);
    console.log(`[VALIDATE:${requestId}] API Key (first 8 chars): ${apiKey.substring(0, 8)}...`);

    // Initialize Gemini client
    const aiConfig: { apiKey: string; httpOptions?: { baseUrl: string } } = { apiKey };
    if (isCustomEndpoint) {
      aiConfig.httpOptions = { baseUrl: apiEndpoint };
    }
    const ai = new GoogleGenAI(aiConfig);

    // Use a simple text prompt for validation - this works with both text and image models
    const modelId = isCustomEndpoint ? "gemini-3-pro-image" : "gemini-3-pro-image-preview";
    console.log(`[VALIDATE:${requestId}] Using model: ${modelId}`);

    const startTime = Date.now();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: "user",
          parts: [{ text: "Hello" }],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });
    const duration = Date.now() - startTime;
    console.log(`[VALIDATE:${requestId}] API call completed in ${duration}ms`);

    // Check if we got any response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.error(`[VALIDATE:${requestId}] No candidates in response`);
      return NextResponse.json<ValidateResponse>({
        success: false,
        error: "API 无响应",
      }, { status: 500 });
    }

    const parts = candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      console.error(`[VALIDATE:${requestId}] No parts in response`);
      return NextResponse.json<ValidateResponse>({
        success: false,
        error: "API 响应为空",
      }, { status: 500 });
    }

    // Check what type of response we got - both text and image are valid
    let responseType: "text" | "image" = "text";
    let responsePreview = "";

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        responseType = "image";
        const sizeKB = (part.inlineData.data.length / 1024).toFixed(1);
        responsePreview = `图像 (${sizeKB}KB)`;
        break;
      } else if (part.text) {
        responseType = "text";
        responsePreview = part.text.substring(0, 50);
        break;
      }
    }

    console.log(`[VALIDATE:${requestId}] ✓ Success - Response type: ${responseType}`);
    console.log(`[VALIDATE:${requestId}] Response preview: ${responsePreview}`);

    return NextResponse.json<ValidateResponse>({
      success: true,
      message: `连接成功！响应类型: ${responseType === "image" ? "图像" : "文本"} (${duration}ms)`,
      responseType,
    });

  } catch (error) {
    console.error(`[VALIDATE:${requestId}] ❌ Error:`, error);

    let errorMessage = "验证失败";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle specific error types
      if (errorMessage.includes("fetch failed") || errorMessage.includes("ECONNREFUSED")) {
        errorMessage = "无法连接到 API 端点，请检查网络和端点地址";
      } else if (errorMessage.includes("401") || errorMessage.includes("API key")) {
        errorMessage = "API Key 无效或已过期";
      } else if (errorMessage.includes("403")) {
        errorMessage = "API Key 权限不足";
      } else if (errorMessage.includes("429")) {
        errorMessage = "API 调用频率限制，请稍后重试";
      }
    }

    return NextResponse.json<ValidateResponse>({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
