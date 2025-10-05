// app/components/FolderItem.tsx
import { FolderIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FolderItemProps {
  folder: any; // Replace with specific type later
  onClick: () => void;
  onCreateFolder: (parentId: string) => void;
  currentFolderId: string | null;
}

export default function FolderItem({ folder, onClick, onCreateFolder, currentFolderId }: FolderItemProps) {
  const isCurrent = currentFolderId === folder._id;

  const handleCreateFolder = () => {
    onCreateFolder(folder._id);
  };

  return (
    <div className="ml-4">
      <div
        className={`flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isCurrent ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-2">
          <FolderIcon className="h-4 w-4" />
          <span className="text-sm">{folder.name}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCreateFolder(); }}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Folder</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}