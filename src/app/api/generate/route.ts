import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, GenerateResponse, ModelType } from "@/types";

export const maxDuration = 300; // 5 minute timeout for Gemini API calls
export const dynamic = 'force-dynamic'; // Ensure this route is always dynamic

// Map model types to Gemini model IDs
const MODEL_MAP: Record<ModelType, string> = {
  "nano-banana": "gemini-2.5-flash-image", // Updated to correct model name
  "nano-banana-pro": "gemini-3-pro-image-preview",
};

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`\n[API:${requestId}] ========== NEW GENERATE REQUEST ==========`);
  console.log(`[API:${requestId}] Timestamp: ${new Date().toISOString()}`);

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(`[API:${requestId}] ❌ No API key configured`);
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "API key not configured. Add GEMINI_API_KEY to .env.local",
        },
        { status: 500 }
      );
    }

    console.log(`[API:${requestId}] Parsing request body...`);
    const body: GenerateRequest = await request.json();
    const { images, prompt, model = "nano-banana-pro", aspectRatio, resolution, useGoogleSearch } = body;

    console.log(`[API:${requestId}] Request parameters:`);
    console.log(`[API:${requestId}]   - Model: ${model} -> ${MODEL_MAP[model]}`);
    console.log(`[API:${requestId}]   - Images count: ${images?.length || 0}`);
    console.log(`[API:${requestId}]   - Prompt length: ${prompt?.length || 0} chars`);
    console.log(`[API:${requestId}]   - Aspect Ratio: ${aspectRatio || 'default'}`);
    console.log(`[API:${requestId}]   - Resolution: ${resolution || 'default'}`);
    console.log(`[API:${requestId}]   - Google Search: ${useGoogleSearch || false}`);

    // Only prompt is required, images are optional
    if (!prompt) {
      console.error(`[API:${requestId}] ❌ Validation failed: missing prompt`);
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "Prompt is required",
        },
        { status: 400 }
      );
    }

    console.log(`[API:${requestId}] Extracting image data...`);
    // Extract base64 data and MIME types from data URLs (if images provided)
    const imageData = images && images.length > 0 ? images.map((image, idx) => {
      if (image.includes("base64,")) {
        const [header, data] = image.split("base64,");
        // Extract MIME type from header (e.g., "data:image/png;" -> "image/png")
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        console.log(`[API:${requestId}]   Image ${idx + 1}: ${mimeType}, ${(data.length / 1024).toFixed(2)}KB base64`);
        return { data, mimeType };
      }
      console.log(`[API:${requestId}]   Image ${idx + 1}: No base64 header, assuming PNG, ${(image.length / 1024).toFixed(2)}KB`);
      return { data: image, mimeType: "image/png" };
    }) : [];

    if (imageData.length === 0) {
      console.log(`[API:${requestId}]   No images provided - text-to-image generation`);
    }

    // Initialize Gemini client
    console.log(`[API:${requestId}] Initializing Gemini client...`);
    const ai = new GoogleGenAI({ apiKey });

    // Build request parts array with prompt and all images (if any)
    console.log(`[API:${requestId}] Building request parts...`);
    const requestParts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt },
      ...imageData.map(({ data, mimeType }) => ({
        inlineData: {
          mimeType,
          data,
        },
      })),
    ];
    console.log(`[API:${requestId}] Request parts count: ${requestParts.length} (1 text + ${imageData.length} images)`);


    // Build config object based on model capabilities
    console.log(`[API:${requestId}] Building generation config...`);
    const config: any = {
      responseModalities: ["IMAGE", "TEXT"],
    };

    // Add imageConfig for both models (both support aspect ratio)
    if (aspectRatio) {
      config.imageConfig = {
        aspectRatio,
      };
      console.log(`[API:${requestId}]   Added aspect ratio: ${aspectRatio}`);
    }

    // Add resolution only for Nano Banana Pro
    if (model === "nano-banana-pro" && resolution) {
      if (!config.imageConfig) {
        config.imageConfig = {};
      }
      config.imageConfig.imageSize = resolution;
      console.log(`[API:${requestId}]   Added resolution: ${resolution}`);
    }

    // Add tools array for Google Search (only Nano Banana Pro)
    const tools = [];
    if (model === "nano-banana-pro" && useGoogleSearch) {
      tools.push({ googleSearch: {} });
      console.log(`[API:${requestId}]   Added Google Search tool`);
    }

    console.log(`[API:${requestId}] Final config:`, JSON.stringify(config, null, 2));
    if (tools.length > 0) {
      console.log(`[API:${requestId}] Tools:`, JSON.stringify(tools, null, 2));
    }

    // Make request to Gemini with retry logic for network errors
    console.log(`[API:${requestId}] Calling Gemini API...`);
    const geminiStartTime = Date.now();
    
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        if (retryCount > 0) {
          console.log(`[API:${requestId}] Retry attempt ${retryCount}/${maxRetries}...`);
          // Exponential backoff: wait 1s, 2s, 4s between retries
          const waitTime = Math.pow(2, retryCount - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        response = await ai.models.generateContent({
          model: MODEL_MAP[model],
          contents: [
            {
              role: "user",
              parts: requestParts,
            },
          ],
          config,
          ...(tools.length > 0 && { tools }),
        });
        
        // If we got here, the request succeeded
        break;
      } catch (fetchError: unknown) {
        retryCount++;
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        console.error(`[API:${requestId}] Attempt ${retryCount} failed:`, errorMessage);
        
        // Check if this is a network/fetch error that might be retriable
        const isNetworkError = errorMessage.includes('fetch failed') || 
                              errorMessage.includes('ECONNRESET') || 
                              errorMessage.includes('ETIMEDOUT') || 
                              errorMessage.includes('ENOTFOUND');
        
        if (retryCount > maxRetries || !isNetworkError) {
          // If we've exhausted retries or this isn't a network error, re-throw
          throw fetchError;
        }
      }
    }

    const geminiDuration = Date.now() - geminiStartTime;
    console.log(`[API:${requestId}] Gemini API call completed in ${geminiDuration}ms`);

    if (!response) {
      throw new Error("Failed to get response from Gemini");
    }

    // Extract image from response
    console.log(`[API:${requestId}] Processing response...`);
    const candidates = response.candidates;
    console.log(`[API:${requestId}] Candidates count: ${candidates?.length || 0}`);

    if (!candidates || candidates.length === 0) {
      console.error(`[API:${requestId}] ❌ No candidates in response`);
      console.error(`[API:${requestId}] Full response:`, JSON.stringify(response, null, 2));
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "No response from AI model",
        },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts;
    console.log(`[API:${requestId}] Parts count in first candidate: ${parts?.length || 0}`);

    if (!parts) {
      console.error(`[API:${requestId}] ❌ No parts in candidate content`);
      console.error(`[API:${requestId}] Candidate:`, JSON.stringify(candidates[0], null, 2));
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "No content in response",
        },
        { status: 500 }
      );
    }

    // Log all parts
    parts.forEach((part, idx) => {
      const partKeys = Object.keys(part);
      console.log(`[API:${requestId}] Part ${idx + 1}: ${partKeys.join(', ')}`);
    });

    // Find image part in response
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || "image/png";
        const imageData = part.inlineData.data;
        const imageSizeKB = (imageData.length / 1024).toFixed(2);
        console.log(`[API:${requestId}] ✓ Found image in response: ${mimeType}, ${imageSizeKB}KB base64`);

        const dataUrl = `data:${mimeType};base64,${imageData}`;
        const dataUrlSizeKB = (dataUrl.length / 1024).toFixed(2);
        console.log(`[API:${requestId}] Data URL size: ${dataUrlSizeKB}KB`);

        const responsePayload = { success: true, image: dataUrl };
        const responseSize = JSON.stringify(responsePayload).length;
        const responseSizeMB = (responseSize / (1024 * 1024)).toFixed(2);
        console.log(`[API:${requestId}] Total response payload size: ${responseSizeMB}MB`);

        if (responseSize > 4.5 * 1024 * 1024) {
          console.warn(`[API:${requestId}] ⚠️ Response size (${responseSizeMB}MB) is approaching Next.js 5MB limit!`);
        }

        console.log(`[API:${requestId}] ✓✓✓ SUCCESS - Returning image ✓✓✓`);

        // Create response with explicit headers to handle large payloads
        const response = NextResponse.json<GenerateResponse>(responsePayload);
        response.headers.set('Content-Type', 'application/json');
        response.headers.set('Content-Length', responseSize.toString());

        console.log(`[API:${requestId}] Response headers set, returning...`);
        return response;
      }
    }

    // If no image found, check for text error
    console.warn(`[API:${requestId}] ⚠ No image found in parts, checking for text...`);
    for (const part of parts) {
      if (part.text) {
        console.error(`[API:${requestId}] ❌ Model returned text instead of image`);
        console.error(`[API:${requestId}] Text preview: "${part.text.substring(0, 200)}"`);
        return NextResponse.json<GenerateResponse>(
          {
            success: false,
            error: `Model returned text instead of image: ${part.text.substring(0, 200)}`,
          },
          { status: 500 }
        );
      }
    }

    console.error(`[API:${requestId}] ❌ No image or text found in response`);
    console.error(`[API:${requestId}] All parts:`, JSON.stringify(parts, null, 2));
    return NextResponse.json<GenerateResponse>(
      {
        success: false,
        error: "No image in response",
      },
      { status: 500 }
    );
  } catch (error) {
    const requestId = 'unknown'; // Fallback if we don't have it in scope
    console.error(`[API:${requestId}] ❌❌❌ EXCEPTION CAUGHT IN API ROUTE ❌❌❌`);
    console.error(`[API:${requestId}] Error type:`, error?.constructor?.name);
    console.error(`[API:${requestId}] Error toString:`, String(error));

    // Extract detailed error information
    let errorMessage = "Generation failed";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "";
      console.error(`[API:${requestId}] Error message:`, errorMessage);
      console.error(`[API:${requestId}] Error stack:`, error.stack);

      // Check for specific error types
      if ("cause" in error && error.cause) {
        console.error(`[API:${requestId}] Error cause:`, error.cause);
        errorDetails += `\nCause: ${JSON.stringify(error.cause)}`;
      }
    }

    // Try to extract more details from Google API errors
    if (error && typeof error === "object") {
      const apiError = error as Record<string, unknown>;
      console.error(`[API:${requestId}] Error object keys:`, Object.keys(apiError));

      if (apiError.status) {
        console.error(`[API:${requestId}] Error status:`, apiError.status);
        errorDetails += `\nStatus: ${apiError.status}`;
      }
      if (apiError.statusText) {
        console.error(`[API:${requestId}] Error statusText:`, apiError.statusText);
        errorDetails += `\nStatusText: ${apiError.statusText}`;
      }
      if (apiError.errorDetails) {
        console.error(`[API:${requestId}] Error errorDetails:`, apiError.errorDetails);
        errorDetails += `\nDetails: ${JSON.stringify(apiError.errorDetails)}`;
      }
      if (apiError.response) {
        try {
          console.error(`[API:${requestId}] Error response:`, apiError.response);
          errorDetails += `\nResponse: ${JSON.stringify(apiError.response)}`;
        } catch {
          errorDetails += `\nResponse: [unable to stringify]`;
        }
      }

      // Log entire error object for debugging
      try {
        console.error(`[API:${requestId}] Full error object:`, JSON.stringify(apiError, null, 2));
      } catch {
        console.error(`[API:${requestId}] Could not stringify full error object`);
      }
    }

    console.error(`[API:${requestId}] Compiled error details:`, errorDetails);

    // Handle specific network errors with a user-friendly message
    if (errorMessage.includes('fetch failed')) {
      console.error(`[API:${requestId}] Network error detected`);
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "网络连接失败，无法连接到 Google API。请检查网络连接或稍后重试。",
        },
        { status: 503 }
      );
    }

    // Handle rate limiting
    if (errorMessage.includes("429")) {
      console.error(`[API:${requestId}] Rate limit error detected`);
      return NextResponse.json<GenerateResponse>(
        {
          success: false,
          error: "API 调用频率限制，请稍后重试。",
        },
        { status: 429 }
      );
    }

    console.error(`[API:${requestId}] Returning 500 error response`);
    return NextResponse.json<GenerateResponse>(
      {
        success: false,
        error: `${errorMessage}${errorDetails ? ` | Details: ${errorDetails.substring(0, 500)}` : ""}`,
      },
      { status: 500 }
    );
  }
}
