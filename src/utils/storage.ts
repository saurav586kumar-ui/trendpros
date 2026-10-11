import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Uploads an image file to Firebase Storage with validation and fallback.
 */
export async function uploadImageFile(
  file: File,
  folder: string = 'products',
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 1. Validation
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!validMimeTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select JPEG, PNG, WebP, GIF, or SVG.');
  }

  // 5MB limit
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed file size is 5MB.`);
  }

  // 2. Try Firebase Storage upload
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(progress);
        },
        (error) => {
          console.warn('Firebase Storage upload error, using local fallback:', error);
          // Attempt fallback
          readFileAsDataURL(file).then(resolve).catch(reject);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(100);
            resolve(downloadUrl);
          } catch (urlErr) {
            console.warn('getDownloadURL failed, using fallback:', urlErr);
            readFileAsDataURL(file).then(resolve).catch(reject);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Firebase storage initialization issue, falling back to data URL:', err);
    return readFileAsDataURL(file);
  }
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file data'));
    reader.readAsDataURL(file);
  });
}

export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function importImageFromUrl(url: string): Promise<{ dataUrl: string; file: File }> {
  const res = await fetch('/api/image/import-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to import image from URL');
  }
  const file = dataURLtoFile(data.dataUrl, data.filename || `imported_${Date.now()}.jpg`);
  return { dataUrl: data.dataUrl, file };
}
