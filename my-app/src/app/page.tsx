// app/page.tsx
'use client'; // Enable client-side rendering for this component

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner"; // or "@/components/ui/use-toast" depending on shadcn setup

interface FileRecord {
  originalFilename: string;
  originalFileSize: number;
  uploadDate: string; // ISO string from MongoDB
  telegramMessageId: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a file.");
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      toast.success(`File "${file.name}" uploaded successfully!`);
      console.log('Upload Result:', result); // Log for debugging
      // Optionally, refetch the file list to update the UI
      fetchFiles();
      if (fileInput) fileInput.value = ''; // Clear input
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      setFiles(data.files);
    } catch (error: any) {
      console.error('Fetch Files Error:', error);
      toast.error(error.message || 'Failed to load files');
    }
  };

  // Fetch files on component mount
  useState(() => {
     fetchFiles();
  });

  const handleDownload = (messageId: number, filename: string) => {
    // Construct the download URL using the message ID
    const downloadUrl = `/api/download/${messageId}`;
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename; // Suggest filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Self-Deployable Cloud Storage</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Form */}
          <form onSubmit={handleUpload} className="mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Upload File (Max 2GB)</Label>
              <Input id="file-upload" type="file" ref={fileInputRef} required />
            </div>
            <Button type="submit" className="mt-2" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>

          {/* File List */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Uploaded Files</h2>
            {files.length === 0 ? (
              <p>No files uploaded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file, index) => (
                    <TableRow key={index}> {/* Using index as key is okay for static lists fetched once, but ideally use a unique ID from DB if available */}
                      <TableCell className="font-medium">{file.originalFilename}</TableCell>
                      <TableCell>{formatFileSize(file.originalFileSize)}</TableCell>
                      <TableCell>{new Date(file.uploadDate).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.telegramMessageId, file.originalFilename)}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}