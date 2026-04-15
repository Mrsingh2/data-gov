import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IStorageService } from './storage.interface';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/data-gov-uploads';

@Injectable()
export class LocalStorageService implements IStorageService {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async put(key: string, buffer: Buffer, _fileName: string): Promise<string> {
    const filePath = path.join(UPLOAD_DIR, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return key;
  }

  async get(key: string): Promise<Buffer | null> {
    const filePath = path.join(UPLOAD_DIR, key);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
