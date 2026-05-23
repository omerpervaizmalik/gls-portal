import fs from 'fs/promises';
import path from 'path';

export class LocalStorageService {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
  }

  private getSafePath(targetPath: string) {
    const fullPath = path.join(this.rootPath, targetPath);
    // Security check to prevent path traversal
    if (!fullPath.startsWith(this.rootPath)) {
      throw new Error("Access denied: Invalid path");
    }
    return fullPath;
  }

  async listFolder(folderPath: string = '') {
    const targetDir = this.getSafePath(folderPath);
    
    try {
      const entries = await fs.readdir(targetDir, { withFileTypes: true });
      
      return await Promise.all(entries.map(async (entry) => {
        const stats = await fs.stat(path.join(targetDir, entry.name));
        return {
          id: path.join(folderPath, entry.name),
          name: entry.name,
          folder: entry.isDirectory() ? {} : undefined,
          file: entry.isFile() ? {} : undefined,
          size: stats.size,
          lastModifiedDateTime: stats.mtime.toISOString(),
          path: path.join(folderPath, entry.name)
        };
      }));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error("Folder not found");
      }
      throw error;
    }
  }

  async uploadFile(targetFolderPath: string, fileName: string, content: Buffer | string) {
    const targetDir = this.getSafePath(targetFolderPath);
    const filePath = path.join(targetDir, fileName);
    
    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });
    
    await fs.writeFile(filePath, content);
    return { name: fileName, path: path.join(targetFolderPath, fileName) };
  }

  async createFolder(targetFolderPath: string, folderName: string) {
    const targetDir = this.getSafePath(targetFolderPath);
    const newFolderPath = path.join(targetDir, folderName);
    await fs.mkdir(newFolderPath, { recursive: true });
    return { name: folderName, path: path.join(targetFolderPath, folderName) };
  }

  async renameItem(oldPath: string, newName: string) {
    const oldFullPath = this.getSafePath(oldPath);
    const parentDir = path.dirname(oldFullPath);
    const newFullPath = path.join(parentDir, newName);
    
    // Safety check for new name/path
    if (!newFullPath.startsWith(this.rootPath)) {
        throw new Error("Access denied: Invalid rename target");
    }

    await fs.rename(oldFullPath, newFullPath);
    return { oldPath, newName, newPath: path.join(path.dirname(oldPath), newName) };
  }

  async deleteItem(itemPath: string) {
    const fullPath = this.getSafePath(itemPath);
    await fs.rm(fullPath, { recursive: true, force: true });
  }

  async getDownloadUrl(itemPath: string) {
    return `/api/storage-gateway/download?path=${encodeURIComponent(itemPath)}`;
  }
}

// Global instance using a storage folder in the project root by default
export const localStorage = new LocalStorageService(
  process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'storage')
);
