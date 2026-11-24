import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

export interface ParsedImageData {
  mimeType: string;
  base64Data: string;
}

/**
 * Extracts base64 payload and MIME type from a data URL, raw base64 string,
 * or local public file path (e.g. /images/plants/monstera.jpg).
 */
export function extractImageBase64(image: string): ParsedImageData {
  let mimeType = 'image/jpeg';
  let base64Data = image;

  const dataUrlMatch = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch && dataUrlMatch.length === 3) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2];
  } else if (image.includes(',')) {
    const parts = image.split(',');
    base64Data = parts[1];
  } else if (image.startsWith('/') || image.startsWith('./')) {
    // Resolve local public image file safely within public/
    const cleanPath = image.replace(/^\.?\//, '');
    const fullPath = path.resolve(PUBLIC_DIR, cleanPath);
    if (fullPath.startsWith(PUBLIC_DIR + path.sep) && fs.existsSync(fullPath)) {
      const fileBuf = fs.readFileSync(fullPath);
      base64Data = fileBuf.toString('base64');
      if (cleanPath.endsWith('.png')) mimeType = 'image/png';
      else if (cleanPath.endsWith('.webp')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg';
    }
  }

  return { mimeType, base64Data };
}
