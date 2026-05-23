import { localStorage } from './local-storage';
import { onedrive } from './onedrive';

export const getStorage = () => {
  const useCloud = process.env.USE_CLOUD_STORAGE === 'true';
  return useCloud ? onedrive : localStorage;
};

// Also keep the export for compatibility, but making it a getter
export const storage = {
  listFolder: (path?: string) => getStorage().listFolder(path),
  uploadFile: (path: string, name: string, content: any) => getStorage().uploadFile(path, name, content),
  createFolder: (path: string, name: string) => getStorage().createFolder(path, name),
  renameItem: (id: string, name: string) => getStorage().renameItem(id, name),
  deleteItem: (id: string) => getStorage().deleteItem(id),
  getDownloadUrl: (id: string) => getStorage().getDownloadUrl(id),
};
