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

  async listFolder(folderPath: string = 'root') {
    let endpoint;
    if (folderPath === '' || folderPath === 'root') {
      endpoint = '/me/drive/root/children';
    } else if (folderPath.includes('/') || !/^[A-Z0-9!]+$/.test(folderPath)) {
      // If it looks like a path (has slashes or spaces), use the path syntax
      endpoint = `/me/drive/root:/${encodeURIComponent(folderPath)}:/children`;
    } else {
      // Assume it's an ID
      endpoint = `/me/drive/items/${folderPath}/children`;
    }
    
    const data = await this.graphFetch(`${endpoint}?$select=id,name,folder,file,size,lastModifiedDateTime`);
    
    return data.value.map((item: any) => ({
      id: item.id,
      name: item.name,
      folder: item.folder ? {} : undefined,
      file: item.file ? {} : undefined,
      size: item.size,
      lastModifiedDateTime: item.lastModifiedDateTime,
      path: item.id
    }));
  }

  async uploadFile(parentFolderId: string, fileName: string, content: any) {
    let endpoint;
    if (parentFolderId === '' || parentFolderId === 'root') {
      endpoint = `/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
    } else if (parentFolderId.includes('/') || !/^[A-Z0-9!]+$/.test(parentFolderId)) {
      endpoint = `/me/drive/root:/${encodeURIComponent(parentFolderId)}/${encodeURIComponent(fileName)}:/content`;
    } else {
      endpoint = `/me/drive/items/${parentFolderId}:/${encodeURIComponent(fileName)}:/content`;
    }

    return await this.graphFetch(endpoint, {
      method: 'PUT',
      body: content,
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }

  async createFolder(parentFolderId: string, folderName: string) {
    let endpoint;
    if (parentFolderId === '' || parentFolderId === 'root') {
      endpoint = '/me/drive/root/children';
    } else if (parentFolderId.includes('/') || !/^[A-Z0-9!]+$/.test(parentFolderId)) {
      endpoint = `/me/drive/root:/${encodeURIComponent(parentFolderId)}:/children`;
    } else {
      endpoint = `/me/drive/items/${parentFolderId}/children`;
    }

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
    let endpoint;
    if (itemIdOrPath.includes('/') || !/^[A-Z0-9!]+$/.test(itemIdOrPath)) {
      endpoint = `/me/drive/root:/${encodeURIComponent(itemIdOrPath)}`;
    } else {
      endpoint = `/me/drive/items/${itemIdOrPath}`;
    }
    return await this.graphFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName })
    });
  }

  async deleteItem(itemIdOrPath: string) {
    let endpoint;
    if (itemIdOrPath.includes('/') || !/^[A-Z0-9!]+$/.test(itemIdOrPath)) {
      endpoint = `/me/drive/root:/${encodeURIComponent(itemIdOrPath)}`;
    } else {
      endpoint = `/me/drive/items/${itemIdOrPath}`;
    }
    await this.graphFetch(endpoint, { method: 'DELETE' });
    return { success: true };
  }

  async getDownloadUrl(fileIdOrPath: string) {
    let endpoint;
    if (fileIdOrPath.includes('/') || !/^[A-Z0-9!]+$/.test(fileIdOrPath)) {
      endpoint = `/me/drive/root:/${encodeURIComponent(fileIdOrPath)}?$select=@microsoft.graph.downloadUrl`;
    } else {
      endpoint = `/me/drive/items/${fileIdOrPath}?$select=@microsoft.graph.downloadUrl`;
    }
    const data = await this.graphFetch(endpoint);
    return data['@microsoft.graph.downloadUrl'];
  }
}

export const onedrive = new OneDriveService();
