// app/api/public/[token]/route.ts
import { NextResponse } from 'next/server';
import File, { IFile } from '@/models/file';
import { connectToDatabase } from '../../../../lib/db';

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const { token } = params;

  try {
    await connectToDatabase();

    const fileRecord: IFile | null = await File.findOne({ publicShareToken: token, isPublic: true });
    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found or not public' }, { status: 404 });
    }

    // Redirect to the download route using the telegramMessageId
    // This assumes the file is a single file, not chunked. Handling chunked public files is complex.
    if (fileRecord.isChunked) {
        return NextResponse.json({ error: 'Public access for chunked files not implemented' }, { status: 501 }); // Not Implemented
    }

    const downloadUrl = `/api/download/${fileRecord.telegramMessageId}`;
    return NextResponse.redirect(downloadUrl);

  } catch (error) {
    console.error('Public Access Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during public access' }, { status: 500 });
  }
}