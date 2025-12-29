// [IN]: next/server, fs/promises, path
// [OUT]: POST handler (reads image file, returns base64)
// [POS]: Image loading API / 图像加载 API
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface LoadImageRequest {
    path: string;
}

interface LoadImageResponse {
    success: boolean;
    image?: string; // base64 data URL
    error?: string;
}

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

export async function POST(request: NextRequest) {
    try {
        const body: LoadImageRequest = await request.json();
        const { path: imagePath } = body;

        if (!imagePath) {
            return NextResponse.json<LoadImageResponse>(
                { success: false, error: "Image path is required" },
                { status: 400 }
            );
        }

        // Check if file exists
        try {
            await fs.access(imagePath);
        } catch {
            return NextResponse.json<LoadImageResponse>(
                { success: false, error: `Image file not found: ${imagePath}` },
                { status: 404 }
            );
        }

        // Read file
        const buffer = await fs.readFile(imagePath);
        const base64 = buffer.toString("base64");

        // Determine MIME type from extension
        const ext = path.extname(imagePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || "image/png";

        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json<LoadImageResponse>({
            success: true,
            image: dataUrl,
        });
    } catch (error) {
        console.error("Load image error:", error);
        return NextResponse.json<LoadImageResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to load image",
            },
            { status: 500 }
        );
    }
}
