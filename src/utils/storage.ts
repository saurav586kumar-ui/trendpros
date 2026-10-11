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

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file data'));
    reader.readAsDataURL(file);
  });
}
