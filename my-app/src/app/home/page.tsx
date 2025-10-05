// app/home/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import FileItem from '@/app/components/FileItem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderIcon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import FolderItem from '@/app/components/FolderItem';

// Define chunk size (e.g., 1GB = 1073741824 bytes)
const CHUNK_SIZE = 1073741824; // 1GB in bytes

export default function HomePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null means root
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchFiles(currentFolderId);
        await fetchFolders(currentFolderId);
      } catch (error: any) {
        console.error('Fetch Data Error:', error);
        toast.error(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentFolderId]); // Fetch data when current folder changes

  const fetchFiles = async (folderId: string | null) => {
    try {
      const url = `/api/files${folderId ? `?folderId=${folderId}` : ''}`;
      const response = await fetch(url);
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

  const fetchFolders = async (parentId: string | null) => {
    try {
      const url = `/api/folders${parentId ? `?parentId=${parentId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      const data = await response.json();
      setFolders(data.folders);
    } catch (error: any) {
      console.error('Fetch Folders Error:', error);
      toast.error(error.message || 'Failed to load folders');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const splitFileAndUpload = async (file: File, parentFolderId: string | null) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
    let uploadedChunks = 0;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('originalFilename', file.name);
      formData.append('uploadSessionId', uploadSessionId);
      formData.append('chunkIndex', i.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('parentFolderId', parentFolderId || 'root'); // Pass parent folder ID

      try {
        const response = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Chunk upload failed');
        }

        uploadedChunks++;
        const progress = Math.round((uploadedChunks / totalChunks) * 100);
        setUploadProgress(progress);
        console.log(`Chunk ${i + 1}/${totalChunks} uploaded. Progress: ${progress}%`);
      } catch (error: any) {
        console.error(`Error uploading chunk ${i}:`, error);
        toast.error(`Error uploading chunk ${i + 1}: ${error.message}`);
        setUploadProgress(null);
        setIsUploading(false);
        return;
      }
    }

    toast.success(`File "${file.name}" uploaded successfully in ${totalChunks} chunks!`);
    setUploadProgress(null);
    setIsUploading(false);
    fetchFiles(currentFolderId); // Refresh current folder's files
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = fileInputRef.current;
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.error("Please select a file.");
      return;
    }

    // Handle multiple files
    const filesToUpload = Array.from(fileInput.files);
    for (const file of filesToUpload) {
      if (file.size > 2 * 1024 * 1024 * 1024) { // > 2GB
        console.log("File is large, using chunking logic.", file.name);
        await splitFileAndUpload(file, currentFolderId);
      } else { // <= 2GB, use direct upload
        console.log("File is small, using direct upload logic.", file.name);
        try {
          setLoading(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('parentFolderId', currentFolderId || 'root'); // Pass parent folder ID

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
          console.log('Upload Result:', result);
        } catch (error: any) {
          console.error('Upload Error:', error);
          toast.error(`Upload failed for ${file.name}: ${error.message}`);
        }
      }
    }
    fetchFiles(currentFolderId); // Refresh after all uploads
    if (fileInput) fileInput.value = ''; // Clear input
    setLoading(false);
  };

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: parentId || 'root' }), // Send 'root' if parentId is null
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create folder');
      }

      const result = await response.json();
      toast.success(`Folder "${newFolderName}" created successfully!`);
      setNewFolderName('');
      setShowNewFolderInput(false);
      // Refresh folders in the current view
      fetchFolders(currentFolderId);
    } catch (error: any) {
      console.error('Create Folder Error:', error);
      toast.error(error.message || 'An error occurred while creating the folder');
    }
  };

  const handleShareToggle = (fileId: string) => {
    // Refetch files to get the updated share status
    fetchFiles(currentFolderId);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <Sidebar
        currentFolderId={currentFolderId}
        onFolderSelect={handleFolderSelect}
        onCreateFolder={handleCreateFolder}
      />
      <div className="flex-1 p-6 overflow-auto">
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {currentFolderId ? folders.find(f => f._id === currentFolderId)?.name : 'Root'}
              </h2>
              <div className="flex space-x-2">
                {showNewFolderInput ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-40"
                    />
                    <Button onClick={() => handleCreateFolder(currentFolderId)}>Create</Button>
                    <Button variant="outline" onClick={() => setShowNewFolderInput(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setShowNewFolderInput(true)}>
                    <FolderIcon className="mr-2 h-4 w-4" /> New Folder
                  </Button>
                )}
              </div>
            </div>

            <form onSubmit={handleUpload} className="mb-6">
              <div className="flex items-center space-x-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    <UploadIcon className="mr-2 h-4 w-4" /> Upload File
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    className="hidden" // Hide the actual input
                    multiple // Allow multiple file selection
                    required
                  />
                </Label>
              </div>
              {isUploading && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${uploadProgress || 0}%` }}
                  ></div>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Select one or more files (Max 2GB each, larger files will be chunked)'}
              </p>
            </form>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Folders</h3>
              {folders.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No folders in this location.</p>
              ) : (
                folders.map(folder => (
                  <div
                    key={folder._id}
                    className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleFolderSelect(folder._id)}
                  >
                    <FolderIcon className="h-4 w-4 mr-2" />
                    <span>{folder.name}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-2">
              <h3 className="text-lg font-semibold">Files</h3>
              {files.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No files in this location.</p>
              ) : (
                files.map((file) => (
                  <FileItem
                    key={file._id}
                    file={file}
                    onShareToggle={handleShareToggle}
                    currentFolderId={currentFolderId}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}