import { prisma } from "@/lib/prisma";

interface OneDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tenantId?: string;
}

export class OneDriveService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private getConfig(): OneDriveConfig {
    return {
      clientId: process.env.ONEDRIVE_CLIENT_ID || '',
      clientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
      refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN || '',
      tenantId: process.env.ONEDRIVE_TENANT_ID,
    };
  }

  private async getValidToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.getConfig();
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new Error("OneDrive credentials missing from environment variables");
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId || 'consumers'}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Files.ReadWrite.All offline_access',
      }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh OneDrive token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = now + (data.expires_in * 1000) - 60000;
    return this.accessToken!;
  }

  private async graphFetch(endpoint: string, options: RequestInit = {}) {
    const token = await this.getValidToken();
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Microsoft Graph Error: ${error}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  }

  private isDriveItemId(str: string): boolean {
    return /^[a-zA-Z0-9!_\-]+$/.test(str) && str.length >= 24;
  }

  private resolveDrivePath(pathOrId?: string | null) {
    if (!pathOrId || pathOrId === 'root') {
      return {
        isRoot: true,
        childrenEndpoint: '/me/drive/root/children',
        itemEndpoint: '/me/drive/root',
        contentEndpoint: '/me/drive/root/content',
        childContentEndpoint: (fileName: string) => `/me/drive/root:/${encodeURIComponent(fileName)}:/content`,
        childFolderEndpoint: '/me/drive/root/children',
      };
    }

    let cleanPath = pathOrId.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
    if (cleanPath.toLowerCase().startsWith('root/')) {
      cleanPath = cleanPath.slice(5).replace(/^\/+|\/+$/g, '');
    }
    if (!cleanPath || cleanPath.toLowerCase() === 'root') {
      return {
        isRoot: true,
        childrenEndpoint: '/me/drive/root/children',
        itemEndpoint: '/me/drive/root',
        contentEndpoint: '/me/drive/root/content',
        childContentEndpoint: (fileName: string) => `/me/drive/root:/${encodeURIComponent(fileName)}:/content`,
        childFolderEndpoint: '/me/drive/root/children',
      };
    }

    const parts = cleanPath.split('/').filter(Boolean);

    // If it's a single token and it looks like a long driveItem ID
    if (parts.length === 1 && this.isDriveItemId(parts[0])) {
      const id = parts[0];
      return {
        isRoot: false,
        childrenEndpoint: `/me/drive/items/${id}/children`,
        itemEndpoint: `/me/drive/items/${id}`,
        contentEndpoint: `/me/drive/items/${id}/content`,
        childContentEndpoint: (fileName: string) => `/me/drive/items/${id}:/${encodeURIComponent(fileName)}:/content`,
        childFolderEndpoint: `/me/drive/items/${id}/children`,
      };
    }

    // If first part is an ID and followed by relative path
    if (parts.length > 1 && this.isDriveItemId(parts[0])) {
      const id = parts[0];
      const relPath = parts.slice(1).map(p => encodeURIComponent(p)).join('/');
      return {
        isRoot: false,
        childrenEndpoint: `/me/drive/items/${id}:/${relPath}:/children`,
        itemEndpoint: `/me/drive/items/${id}:/${relPath}:`,
        contentEndpoint: `/me/drive/items/${id}:/${relPath}:/content`,
        childContentEndpoint: (fileName: string) => `/me/drive/items/${id}:/${relPath}/${encodeURIComponent(fileName)}:/content`,
        childFolderEndpoint: `/me/drive/items/${id}:/${relPath}:/children`,
      };
    }

    // Otherwise, it is a path relative to drive root (e.g. "clients", "clients/001 - Omer", etc.)
    const encodedPath = parts.map(p => encodeURIComponent(p)).join('/');
    return {
      isRoot: false,
      childrenEndpoint: `/me/drive/root:/${encodedPath}:/children`,
      itemEndpoint: `/me/drive/root:/${encodedPath}:`,
      contentEndpoint: `/me/drive/root:/${encodedPath}:/content`,
      childContentEndpoint: (fileName: string) => `/me/drive/root:/${encodedPath}/${encodeURIComponent(fileName)}:/content`,
      childFolderEndpoint: `/me/drive/root:/${encodedPath}:/children`,
    };
  }

  async listFolder(folderPath: string = 'root') {
    const resolved = this.resolveDrivePath(folderPath);
    const data = await this.graphFetch(`${resolved.childrenEndpoint}?$select=id,name,folder,file,size,lastModifiedDateTime`);
    
    let cleanParent = (!folderPath || folderPath === 'root') ? '' : folderPath.replace(/\\/g, '/').trim().replace(/^\/+|\/+$/g, '');
    if (cleanParent.toLowerCase().startsWith('root/')) {
      cleanParent = cleanParent.slice(5).replace(/^\/+|\/+$/g, '');
    } else if (cleanParent.toLowerCase() === 'root') {
      cleanParent = '';
    }

    return (data?.value || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      folder: item.folder ? {} : undefined,
      file: item.file ? {} : undefined,
      size: item.size,
      lastModifiedDateTime: item.lastModifiedDateTime,
      path: cleanParent ? `${cleanParent}/${item.name}` : item.name
    }));
  }

  async uploadFile(parentFolderId: string, fileName: string, content: any) {
    const resolved = this.resolveDrivePath(parentFolderId);
    const endpoint = resolved.childContentEndpoint(fileName);

    return await this.graphFetch(endpoint, {
      method: 'PUT',
      body: content,
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }

  async createFolder(parentFolderId: string, folderName: string) {
    const resolved = this.resolveDrivePath(parentFolderId);
    const endpoint = resolved.childFolderEndpoint;

    return await this.graphFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "rename"
      })
    });
  }

  async renameItem(itemIdOrPath: string, newName: string) {
    const resolved = this.resolveDrivePath(itemIdOrPath);
    return await this.graphFetch(resolved.itemEndpoint, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName })
    });
  }

  async deleteItem(itemIdOrPath: string) {
    const resolved = this.resolveDrivePath(itemIdOrPath);
    await this.graphFetch(resolved.itemEndpoint, { method: 'DELETE' });
    return { success: true };
  }

  async getDownloadUrl(fileIdOrPath: string): Promise<string> {
    const token = await this.getValidToken();
    const resolved = this.resolveDrivePath(fileIdOrPath);
    const endpoint = resolved.contentEndpoint;
    
    console.log("[ONEDRIVE] getDownloadUrl via /content redirect for:", endpoint);
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      redirect: 'manual'
    });

    // MS Graph API returns 302 Found with the pre-authenticated download URL in the Location header
    if (response.status === 302 || response.status === 301 || response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location) return location;
    }

    if (!response.ok) {
      const error = await response.text();
      console.error("[ONEDRIVE] getDownloadUrl error:", error);
      throw new Error(`Microsoft Graph Error: ${error}`);
    }

    throw new Error("Failed to get download URL: No redirect location found.");
  }

  async getFileContent(fileIdOrPath: string): Promise<ArrayBuffer> {
    const token = await this.getValidToken();
    const resolved = this.resolveDrivePath(fileIdOrPath);
    const endpoint = resolved.contentEndpoint;
    
    console.log("[ONEDRIVE] getFileContent fetching endpoint:", endpoint);
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[ONEDRIVE] getFileContent error:", error);
      throw new Error(`Microsoft Graph Error: ${error}`);
    }

    return await response.arrayBuffer();
  }
}

export const onedrive = new OneDriveService();
