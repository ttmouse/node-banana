// [IN]: next/server, fs/promises, path, crypto
// [OUT]: POST handler (saves base64 image to disk, returns path)
// [POS]: Image persistence API / 图像持久化 API
// Protocol: When updated, sync this header + parent .folder.md
// 协议：更新本文件时，同步本头注释与上级 .folder.md

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

interface SaveImageRequest {
    directoryPath: string;
    image: string; // base64 data URL
    filename?: string; // optional custom filename
}

interface SaveImageResponse {
    success: boolean;
    path?: string;
    error?: string;
    skipped?: boolean; // true if file already existed
}

export async function POST(request: NextRequest) {
    try {
        const body: SaveImageRequest = await request.json();
        const { directoryPath, image, filename } = body;

        if (!directoryPath) {
            return NextResponse.json<SaveImageResponse>(
                { success: false, error: "Directory path is required" },
                { status: 400 }
            );
        }

        if (!image) {
            return NextResponse.json<SaveImageResponse>(
                { success: false, error: "Image data is required" },
                { status: 400 }
            );
        }

        // Ensure directory exists
        try {
            await fs.mkdir(directoryPath, { recursive: true });
        } catch (err) {
            return NextResponse.json<SaveImageResponse>(
                { success: false, error: `Failed to create directory: ${directoryPath}` },
                { status: 500 }
            );
        }

        // Extract base64 data and determine extension
        let base64Data: string;
        let extension = "png";

        if (image.startsWith("data:")) {
            const match = image.match(/^data:image\/(\w+);base64,(.+)$/);
            if (match) {
                extension = match[1] === "jpeg" ? "jpg" : match[1];
                base64Data = match[2];
            } else {
                base64Data = image.split(",")[1] || image;
            }
        } else {
            base64Data = image;
        }

        // Generate content-based hash for deduplication
        const buffer = Buffer.from(base64Data, "base64");
        const contentHash = crypto.createHash("md5").update(buffer).digest("hex").substring(0, 12);

        // Use hash-based filename for deduplication, or custom filename if provided
        const finalFilename = filename || `img_${contentHash}.${extension}`;
        const filePath = path.join(directoryPath, finalFilename);

        // Check if file already exists (deduplication)
        try {
            await fs.access(filePath);
            // File exists, skip saving and return existing path
            console.log(`[save-image] Skipped duplicate: ${filePath}`);
            return NextResponse.json<SaveImageResponse>({
                success: true,
                path: filePath,
                skipped: true,
            });
        } catch {
            // File doesn't exist, proceed to save
        }

        // Write file
        await fs.writeFile(filePath, buffer);
        console.log(`[save-image] Saved new image: ${filePath}`);

        return NextResponse.json<SaveImageResponse>({
            success: true,
            path: filePath,
            skipped: false,
        });
    } catch (error) {
        console.error("Save image error:", error);
        return NextResponse.json<SaveImageResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to save image",
            },
            { status: 500 }
        );
    }
}
