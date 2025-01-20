// app/api/compress-image/route.ts
import sharp from 'sharp';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const quality = Number(formData.get('quality')) || 80;
    const isDisplay = formData.get('isDisplay') === 'true';

    const arrayBuffer = await file.arrayBuffer();

    const compressed = await sharp(Buffer.from(arrayBuffer))
      .resize(isDisplay ? 1024 : 512, isDisplay ? 1024 : 512, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: quality,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    return new NextResponse(compressed, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Image compression error:', error);
    return NextResponse.json({ error: 'Failed to compress image' }, { status: 500 });
  }
}
