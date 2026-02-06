import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/upload
 * Upload image files to Cloudinary for community banners and logos
 * Returns the public URL of the uploaded file
 */
export async function POST(req: NextRequest) {
    try {
        // Require authentication
        console.log('Upload request received, checking authentication...');
        await requireAuth();
        console.log('Authentication successful');

        // Check if Cloudinary is configured
        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            const missing = [];
            if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) missing.push('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
            if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
            if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');

            console.error('Missing Cloudinary environment variables:', missing.join(', '));
            return NextResponse.json(
                {
                    error: 'Image upload not configured. Missing environment variables.',
                    details: process.env.NODE_ENV === 'development' ? missing : undefined,
                },
                { status: 503 },
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        console.log('File received:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'null');

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

        // Convert File to base64 for Cloudinary upload
        console.log('Converting file to base64...');
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;
        console.log('Base64 conversion complete, data URI length:', dataUri.length);

        // Upload to Cloudinary
        console.log('Uploading to Cloudinary with config:', {
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            has_api_key: !!process.env.CLOUDINARY_API_KEY,
            has_api_secret: !!process.env.CLOUDINARY_API_SECRET,
        });
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'droplabz',
            resource_type: 'image',
        });
        console.log('Cloudinary upload successful:', result.secure_url);

        return NextResponse.json({
            url: result.secure_url,
            filename: result.public_id,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error('Error uploading file:', error);

        // Detailed error logging for debugging
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return NextResponse.json(
            {
                error: 'Failed to upload file',
                message: error instanceof Error ? error.message : 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
            },
            { status: 500 },
        );
    }
}
