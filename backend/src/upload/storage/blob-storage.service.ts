import { Injectable } from '@nestjs/common';
import { IStorageService } from './storage.interface';

@Injectable()
export class BlobStorageService implements IStorageService {
  async put(key: string, buffer: Buffer, fileName: string): Promise<string> {
    try {
      const { put } = await import('@vercel/blob');
      const blob = await put(key, buffer, {
        access: 'public',
        contentType: 'text/csv',
      });
      return blob.url;
    } catch {
      // Fall back to returning the key if blob is not configured
      return key;
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      if (key.startsWith('http')) {
        const res = await fetch(key);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      return null;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (key.startsWith('http')) {
        const { del } = await import('@vercel/blob');
        await del(key);
      }
    } catch {
      // Ignore
    }
  }
}
