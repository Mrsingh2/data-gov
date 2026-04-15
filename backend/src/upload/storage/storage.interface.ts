export interface IStorageService {
  put(key: string, buffer: Buffer, fileName: string): Promise<string>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
