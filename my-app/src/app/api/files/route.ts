// app/api/files/route.ts
import { NextResponse } from 'next/server';
import File, { IFile } from '@/models/file'; // Import model to verify file exists

import { connectToDatabase } from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId'); // Optional: filter by parent folder ID

  try {
    await connectToDatabase();

    const query: any = { isChunked: false }; // Only fetch non-chunked files
    if (folderId) {
      query.parentFolderId = folderId === 'root' ? null : folderId; // 'root' means no parent
    } else {
      query.parentFolderId = null; // Default to root if no folderId is provided
    }

    const files: IFile[] = await File.find(query)
      .select('originalFilename originalFileSize uploadDate telegramMessageId parentFolderId isPublic publicShareToken _id')
      .sort({ uploadDate: -1 });

    return NextResponse.json({ files });

  } catch (error) {
    console.error('Fetch Files Error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}