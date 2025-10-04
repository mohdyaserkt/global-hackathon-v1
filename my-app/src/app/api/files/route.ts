// app/api/files/route.ts
import { NextResponse } from 'next/server';
import File, { IFile } from '@/models/file';
import { connectToDatabase } from '../../../lib/db';

export async function GET() {
  try {
    await connectToDatabase();

    // Find all files, sort by upload date descending, exclude _id and __v
    const files = await File.find({ isChunked: false }) // Initially, only show non-chunked files
      .sort({ uploadDate: -1 })
      .select('originalFilename originalFileSize uploadDate telegramMessageId -_id'); // Select only needed fields, exclude _id and version key

    return NextResponse.json({ files });

  } catch (error) {
    console.error('Fetch Files Error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}