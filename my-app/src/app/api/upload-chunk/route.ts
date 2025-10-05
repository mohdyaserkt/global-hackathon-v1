// app/api/upload-chunk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import File, { IFile } from '@/models/file';
import { connectToDatabase } from '../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const chunk = formData.get('chunk');
    const originalFilename = formData.get('originalFilename') as string;
    const uploadSessionId = formData.get('uploadSessionId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const parentFolderId = formData.get('parentFolderId') as string; // Get parent folder ID

    if (!chunk || !originalFilename || !uploadSessionId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: 'Invalid chunk data or metadata' }, { status: 400 });
    }

    const formDataForTelegram = new FormData();
    formDataForTelegram.append('chat_id', process.env.TELEGRAM_CHANNEL_ID!);
    // @ts-ignore
    formDataForTelegram.append('document', chunk, `${originalFilename}_chunk_${chunkIndex}`);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: formDataForTelegram,
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram API Error (Chunk):', errorData);
      return NextResponse.json({ error: 'Failed to upload chunk to Telegram', details: errorData }, { status: 500 });
    }

    const telegramResult = await telegramResponse.json();
    const telegramMessageIdForChunk = telegramResult.result.message_id;

    const newChunkFile: IFile = new File({
      originalFilename: originalFilename,
      originalFileSize: 0, // Will calculate total later or store total size in a separate doc
      telegramMessageId: 0,
      isChunked: true,
      uploadSessionId: uploadSessionId,
      chunkIndex: chunkIndex,
      totalChunks: totalChunks,
      telegramMessageIdForChunk: telegramMessageIdForChunk,
      parentFolderId: parentFolderId ? (parentFolderId === 'root' ? null : parentFolderId) : null, // Assign parent folder ID
    });

    await newChunkFile.save();

    return NextResponse.json({ message: 'Chunk uploaded successfully', chunkId: newChunkFile._id, telegramMessageIdForChunk });

  } catch (error) {
    console.error('Chunk Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during chunk upload' }, { status: 500 });
  }
}