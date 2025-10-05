// app/api/share/[fileId]/route.ts
import { NextResponse } from 'next/server';
import File, { IFile } from '@/models/file';
import { connectToDatabase } from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid'; // You might need to install this: npm install uuid

export async function PUT(request: Request, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  try {
    await connectToDatabase();

    // Find the file
    const file: IFile | null = await File.findById(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Toggle public status and generate token if enabling
    if (file.isPublic) {
      file.isPublic = false;
      file.publicShareToken = undefined; // Remove the token
    } else {
      file.isPublic = true;
      file.publicShareToken = uuidv4(); // Generate a unique token
    }

    await file.save();

    return NextResponse.json({ message: 'Share status updated', file: { isPublic: file.isPublic, publicShareToken: file.publicShareToken } });

  } catch (error) {
    console.error('Share Toggle Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during share toggle' }, { status: 500 });
  }
}