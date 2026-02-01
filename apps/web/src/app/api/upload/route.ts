import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/upload
 * Upload image files for community banners and logos
 * Returns the public URL of the uploaded file
 */
export async function POST(req: NextRequest) {
    try {
        // Require authentication
        await requireAuth();

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
                { status: 400 },
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
        }

        // Create upload directory if it doesn't exist
        if (!existsSync(UPLOAD_DIR)) {
            await mkdir(UPLOAD_DIR, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${random}.${ext}`;
        const filepath = join(UPLOAD_DIR, filename);

        // Convert File to Buffer and write to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return public URL
        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({
            url: publicUrl,
            filename,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
