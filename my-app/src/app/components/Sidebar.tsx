// app/components/Sidebar.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderIcon, PlusIcon } from 'lucide-react';
import FolderItem from './FolderItem';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SidebarProps {
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
}

export default function Sidebar({ currentFolderId, onFolderSelect, onCreateFolder }: SidebarProps) {
  const [folders, setFolders] = useState<any[]>([]); // Replace with specific type later

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const parentId = currentFolderId || 'root';
        const response = await fetch(`/api/folders?parentId=${parentId}`);
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

    fetchFolders();
  }, [currentFolderId]);

  const handleCreateRootFolder = () => {
    onCreateFolder(null); // Pass null for root
  };

  const handleFolderClick = (folderId: string) => {
    onFolderSelect(folderId);
  };

  return (
    <Card className="w-64 h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Folders</h3>
          <Button variant="outline" size="sm" onClick={handleCreateRootFolder}>
            <PlusIcon className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="space-y-1">
          <div
            className={`flex items-center p-2 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${currentFolderId === null ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
            onClick={() => onFolderSelect(null)}
          >
            <FolderIcon className="h-4 w-4 mr-2" />
            <span>Root</span>
          </div>
          {folders.map((folder) => (
            <FolderItem
              key={folder._id}
              folder={folder}
              onClick={() => handleFolderClick(folder._id)}
              onCreateFolder={onCreateFolder}
              currentFolderId={currentFolderId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}