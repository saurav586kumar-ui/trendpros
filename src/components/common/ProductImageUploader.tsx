import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Eye,
  X,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileWarning,
  Maximize2
} from 'lucide-react';
import { uploadImageFile, importImageFromUrl, UploadProgressCallback } from '../../utils/storage';

interface ProductImageUploaderProps {
  mainImage: string;
  onMainImageChange: (url: string) => void;
  images: string[];
  onImagesChange: (urls: string[]) => void;
  onStatusNotification?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  mainImage,
  onMainImageChange,
  images,
  onImagesChange,
  onStatusNotification,
}) => {
  // Drag states
  const [isThumbDragging, setIsThumbDragging] = useState(false);
  const [isGalleryDragging, setIsGalleryDragging] = useState(false);

  // Upload progress & states
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [thumbSuccess, setThumbSuccess] = useState<string | null>(null);

  const [galleryProgress, setGalleryProgress] = useState<number | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySuccess, setGallerySuccess] = useState<string | null>(null);

  // URL input states
  const [thumbUrlInput, setThumbUrlInput] = useState('');
  const [thumbUrlLoading, setThumbUrlLoading] = useState(false);

  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryUrlLoading, setGalleryUrlLoading] = useState(false);

  // Drag-and-drop link detection fallback states
  const [thumbDetectedLink, setThumbDetectedLink] = useState<string | null>(null);
  const [galleryDetectedLink, setGalleryDetectedLink] = useState<string | null>(null);

  // Preview Modal / Lightbox
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // File input refs
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Drag counters to prevent flickering when hovering over nested child elements
  const thumbDragCounter = useRef(0);
  const galleryDragCounter = useRef(0);

  // Prevent global browser drop navigation
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Helper to extract files or link from DragEvent
  const extractDragData = (e: React.DragEvent): { files: File[]; linkUrl?: string } => {
    const files: File[] = [];

    // 1. Check DataTransferItemList for files
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name))) {
            files.push(file);
          }
        }
      }
    }

    // 2. Check DataTransfer.files fallback
    if (files.length === 0 && e.dataTransfer.files) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name)) {
          files.push(file);
        }
      }
    }

    // 3. If no files, check for dragged URL or link text
    let linkUrl: string | undefined;
    if (files.length === 0) {
      const uriList = e.dataTransfer.getData('text/uri-list');
      const textPlain = e.dataTransfer.getData('text/plain');
      const textHtml = e.dataTransfer.getData('text/html');

      let candidate = (uriList || textPlain || '').trim();

      // If html contains an <img src="...">
      if (!candidate && textHtml) {
        const match = textHtml.match(/src=["'](.*?)["']/i);
        if (match && match[1]) {
          candidate = match[1];
        }
      }

      if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        linkUrl = candidate;
      }
    }

    return { files, linkUrl };
  };

  // ==========================================
  // THUMBNAIL HANDLERS
  // ==========================================
  const handleThumbDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    thumbDragCounter.current += 1;
    if (thumbDragCounter.current === 1) {
      setIsThumbDragging(true);
    }
  };

  const handleThumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleThumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    thumbDragCounter.current -= 1;
    if (thumbDragCounter.current <= 0) {
      thumbDragCounter.current = 0;
      setIsThumbDragging(false);
    }
  };

  const handleProcessThumbFile = async (file: File) => {
    setThumbError(null);
    setThumbDetectedLink(null);
    setThumbSuccess(null);

    // Validate type & size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setThumbError('Unsupported format. Please choose JPG, PNG, WebP, GIF, or SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setThumbError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 5MB.`);
      return;
    }

    try {
      setThumbProgress(10);
      const onProgress: UploadProgressCallback = (p) => setThumbProgress(p);
      const downloadUrl = await uploadImageFile(file, 'products', onProgress);

      onMainImageChange(downloadUrl);

      // Also ensure it is present in images gallery
      const existing = images || [];
      if (!existing.includes(downloadUrl)) {
        onImagesChange([downloadUrl, ...existing]);
      }

      setThumbSuccess('Product thumbnail uploaded & saved successfully!');
      onStatusNotification?.('success', 'Product thumbnail uploaded successfully');
      setTimeout(() => setThumbSuccess(null), 4000);
    } catch (err: any) {
      setThumbError(err.message || 'Failed to upload product thumbnail');
      onStatusNotification?.('error', err.message || 'Thumbnail upload failed');
    } finally {
      setThumbProgress(null);
    }
  };

  const handleThumbDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    thumbDragCounter.current = 0;
    setIsThumbDragging(false);

    const { files, linkUrl } = extractDragData(e);

    if (files.length > 0) {
      await handleProcessThumbFile(files[0]);
    } else if (linkUrl) {
      setThumbDetectedLink(linkUrl);
      setThumbUrlInput(linkUrl);
      setThumbError('This item is a link, not an image file. Use Paste Image URL or download the image first.');
    } else {
      setThumbError('No valid image file detected in dropped item.');
    }
  };

  const handleThumbFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessThumbFile(file);
    }
    // reset input so same file can be picked again if needed
    if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
  };

  const handleImportThumbUrl = async (urlToImport?: string) => {
    const target = (urlToImport || thumbUrlInput).trim();
    if (!target) return;

    setThumbUrlLoading(true);
    setThumbError(null);
    setThumbDetectedLink(null);

    try {
      // 1. Import via secure backend endpoint
      const { dataUrl, file } = await importImageFromUrl(target);

      // 2. Upload to Firebase Storage
      setThumbProgress(20);
      const storageUrl = await uploadImageFile(file, 'products', (p) => setThumbProgress(p));

      const finalUrl = storageUrl || dataUrl;
      onMainImageChange(finalUrl);

      const existing = images || [];
      if (!existing.includes(finalUrl)) {
        onImagesChange([finalUrl, ...existing]);
      }

      setThumbSuccess('Image imported and saved from URL!');
      setThumbUrlInput('');
      onStatusNotification?.('success', 'Image successfully imported from URL');
      setTimeout(() => setThumbSuccess(null), 4000);
    } catch (err: any) {
      console.warn('Backend URL import error, testing direct URL fallback:', err);
      // Fallback: If remote server blocked backend fetching, test if URL is directly loadable
      try {
        new URL(target);
        onMainImageChange(target);
        const existing = images || [];
        if (!existing.includes(target)) {
          onImagesChange([target, ...existing]);
        }
        setThumbSuccess('Direct image URL assigned.');
        setThumbUrlInput('');
      } catch {
        setThumbError(err.message || 'Failed to import image from the provided URL.');
        onStatusNotification?.('error', err.message || 'Image URL import failed');
      }
    } finally {
      setThumbUrlLoading(false);
      setThumbProgress(null);
    }
  };

  const handleRemoveThumbnail = () => {
    onMainImageChange('');
    setThumbSuccess(null);
    setThumbError(null);
  };

  // ==========================================
  // EXTRA GALLERY IMAGES HANDLERS
  // ==========================================
  const handleGalleryDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    galleryDragCounter.current += 1;
    if (galleryDragCounter.current === 1) {
      setIsGalleryDragging(true);
    }
  };

  const handleGalleryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleGalleryDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    galleryDragCounter.current -= 1;
    if (galleryDragCounter.current <= 0) {
      galleryDragCounter.current = 0;
      setIsGalleryDragging(false);
    }
  };

  const handleProcessGalleryFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setGalleryError(null);
    setGalleryDetectedLink(null);
    setGallerySuccess(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    const validFiles: File[] = [];

    for (const f of files) {
      if (!validTypes.includes(f.type)) {
        setGalleryError(`Skipped "${f.name}": unsupported image format.`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        setGalleryError(`Skipped "${f.name}": exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    try {
      setGalleryProgress(10);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const url = await uploadImageFile(file, 'products', (p) => {
          const overall = Math.round(((i + p / 100) / validFiles.length) * 100);
          setGalleryProgress(overall);
        });
        uploadedUrls.push(url);
      }

      const existing = images || [];
      const updatedGallery = [...existing, ...uploadedUrls].filter(
        (item, index, self) => self.indexOf(item) === index
      );

      onImagesChange(updatedGallery);

      // If no main image exists, set the first uploaded image as main
      if (!mainImage && updatedGallery.length > 0) {
        onMainImageChange(updatedGallery[0]);
      }

      setGallerySuccess(`Added ${uploadedUrls.length} image(s) to product gallery!`);
      onStatusNotification?.('success', `Added ${uploadedUrls.length} image(s) to gallery`);
      setTimeout(() => setGallerySuccess(null), 4000);
    } catch (err: any) {
      setGalleryError(err.message || 'Failed to upload gallery images.');
      onStatusNotification?.('error', err.message || 'Gallery upload failed');
    } finally {
      setGalleryProgress(null);
    }
  };

  const handleGalleryDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    galleryDragCounter.current = 0;
    setIsGalleryDragging(false);

    const { files, linkUrl } = extractDragData(e);

    if (files.length > 0) {
      await handleProcessGalleryFiles(files);
    } else if (linkUrl) {
      setGalleryDetectedLink(linkUrl);
      setGalleryUrlInput(linkUrl);
      setGalleryError('This item is a link, not an image file. Use Paste Image URL or download the image first.');
    } else {
      setGalleryError('No valid image files found in dropped data.');
    }
  };

  const handleGalleryFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleProcessGalleryFiles(files);
    }
    if (galleryFileInputRef.current) galleryFileInputRef.current.value = '';
  };

  const handleImportGalleryUrl = async (urlToImport?: string) => {
    const target = (urlToImport || galleryUrlInput).trim();
    if (!target) return;

    setGalleryUrlLoading(true);
    setGalleryError(null);
    setGalleryDetectedLink(null);

    try {
      const { dataUrl, file } = await importImageFromUrl(target);
      const storageUrl = await uploadImageFile(file, 'products', (p) => setGalleryProgress(p));
      const finalUrl = storageUrl || dataUrl;

      const existing = images || [];
      const updated = existing.includes(finalUrl) ? existing : [...existing, finalUrl];
      onImagesChange(updated);

      if (!mainImage) {
        onMainImageChange(finalUrl);
      }

      setGallerySuccess('Extra image imported and added to gallery!');
      setGalleryUrlInput('');
      onStatusNotification?.('success', 'Extra gallery image imported successfully');
      setTimeout(() => setGallerySuccess(null), 4000);
    } catch (err: any) {
      try {
        new URL(target);
        const existing = images || [];
        const updated = existing.includes(target) ? existing : [...existing, target];
        onImagesChange(updated);
        if (!mainImage) onMainImageChange(target);
        setGallerySuccess('Direct URL added to gallery.');
        setGalleryUrlInput('');
      } catch {
        setGalleryError(err.message || 'Failed to import image from the specified URL.');
        onStatusNotification?.('error', err.message || 'Failed to import image URL');
      }
    } finally {
      setGalleryUrlLoading(false);
      setGalleryProgress(null);
    }
  };

  const handleSetMainFromGallery = (url: string) => {
    onMainImageChange(url);
    onStatusNotification?.('info', 'Main product thumbnail updated');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const targetUrl = images[indexToRemove];
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);

    // If removed image was mainImage, reassign to next image if available
    if (mainImage === targetUrl) {
      onMainImageChange(updated[0] || '');
    }
  };

  const handleReorderGalleryImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const list = [...images];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    onImagesChange(list);
  };

  return (
    <div className="space-y-5">
      {/* ======================================================== */}
      {/* 1. THUMBNAIL DRAG & DROP ZONE                             */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
            <span>Primary Product Thumbnail *</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            JPEG, PNG, WebP, GIF (Max 5MB)
          </span>
        </div>

        {/* Thumbnail Main Dropzone Container */}
        <div
          onDragEnter={handleThumbDragEnter}
          onDragOver={handleThumbDragOver}
          onDragLeave={handleThumbDragLeave}
          onDrop={handleThumbDrop}
          className={`relative rounded-2xl border-2 transition-all p-4 ${
            isThumbDragging
              ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-200/60 scale-[1.01]'
              : mainImage
              ? 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
              : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-indigo-400'
          }`}
        >
          {/* Dragging Active Overlay Badge */}
          {isThumbDragging && (
            <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-20 pointer-events-none">
              <div className="bg-white/95 text-indigo-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-indigo-200 text-xs font-bold animate-bounce">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <span>Drop image here to set as Main Thumbnail</span>
              </div>
            </div>
          )}

          {/* When Thumbnail is set */}
          {mainImage ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Image Preview Box */}
              <div className="relative group w-36 h-36 rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src={mainImage}
                  alt="Main Product Thumbnail"
                  className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setPreviewModalUrl(mainImage)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                  title="View full image"
                >
                  <Maximize2 className="w-5 h-5 drop-shadow-md" />
                </button>
              </div>

              {/* Thumbnail Details & Actions */}
              <div className="flex-1 w-full space-y-2.5 text-left">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Thumbnail Ready
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-xs">
                      {mainImage.startsWith('data:') ? 'Local File Data' : mainImage}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Drag another picture here anytime to replace, or choose an action below.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => thumbFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewModalUrl(mainImage)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State: Large Attractive Dropzone */
            <div
              onClick={() => thumbFileInputRef.current?.click()}
              className="py-8 px-4 flex flex-col items-center justify-center text-center cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs mb-3">
                <UploadCloud className="w-7 h-7 transition-transform group-hover:scale-110" />
              </div>
              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Drag & Drop Thumbnail Image Here
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Drop directly from Chromebook/Windows file manager, desktop, or browser.
              </p>
              <span className="mt-3 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold shadow-xs group-hover:bg-indigo-700 transition-colors">
                Browse Image from Device
              </span>
            </div>
          )}

          {/* Hidden File Input for Thumbnail */}
          <input
            ref={thumbFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleThumbFileInputChange}
            className="hidden"
          />

          {/* Thumbnail Upload Progress Bar */}
          {thumbProgress !== null && (
            <div className="mt-3 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Uploading Thumbnail to Firebase Storage...
                </span>
                <span>{thumbProgress}%</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${thumbProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Thumbnail Success Feedback */}
          {thumbSuccess && (
            <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{thumbSuccess}</span>
            </div>
          )}

          {/* Thumbnail Error Feedback */}
          {thumbError && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{thumbError}</span>
              </div>
              <button
                type="button"
                onClick={() => setThumbError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold text-[10px]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Detected Link Fallback Banner */}
          {thumbDetectedLink && (
            <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Web Link Detected: </span>
                  <span className="text-slate-600 truncate max-w-xs block sm:inline">
                    {thumbDetectedLink}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleImportThumbUrl(thumbDetectedLink)}
                disabled={thumbUrlLoading}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {thumbUrlLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LinkIcon className="w-3 h-3" />
                )}
                <span>Import Link Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Thumbnail URL Input Fallback Bar */}
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Or paste direct image URL (https://...)"
              value={thumbUrlInput}
              onChange={(e) => setThumbUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleImportThumbUrl();
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-hidden focus:border-indigo-500 focus:bg-white transition-all font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleImportThumbUrl()}
            disabled={!thumbUrlInput.trim() || thumbUrlLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            {thumbUrlLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. EXTRA PRODUCT IMAGES GALLERY ZONE                      */}
      {/* ======================================================== */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Extra Product Images Gallery</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {images.length} {images.length === 1 ? 'image' : 'images'} added
          </span>
        </div>

        {/* Extra Images Multi-Dropzone */}
        <div
          onDragEnter={handleGalleryDragEnter}
          onDragOver={handleGalleryDragOver}
          onDragLeave={handleGalleryDragLeave}
          onDrop={handleGalleryDrop}
          className={`relative rounded-2xl border-2 transition-all p-4 ${
            isGalleryDragging
              ? 'border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-200/60 scale-[1.01]'
              : 'border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-100/70 hover:border-indigo-400'
          }`}
        >
          {/* Dragging Active Overlay Badge */}
          {isGalleryDragging && (
            <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-20 pointer-events-none">
              <div className="bg-white/95 text-indigo-700 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-indigo-200 text-xs font-bold animate-bounce">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <span>Drop multiple images here to add to gallery</span>
              </div>
            </div>
          )}

          <div
            onClick={() => galleryFileInputRef.current?.click()}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Drop Extra Product Images Here
                </p>
                <p className="text-[10px] text-slate-500">
                  Select or drop multiple files simultaneously from Chromebook or PC folder
                </p>
              </div>
            </div>

            <button
              type="button"
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 group-hover:border-indigo-500 group-hover:text-indigo-600 rounded-xl text-xs font-bold shadow-2xs transition-all pointer-events-none shrink-0"
            >
              + Add Images
            </button>
          </div>

          {/* Hidden Multi-file input */}
          <input
            ref={galleryFileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            multiple
            onChange={handleGalleryFileInputChange}
            className="hidden"
          />

          {/* Gallery Upload Progress Bar */}
          {galleryProgress !== null && (
            <div className="mt-3 bg-white p-2.5 rounded-xl border border-indigo-200 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Uploading Gallery Images to Firebase...
                </span>
                <span>{galleryProgress}%</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${galleryProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Gallery Success Message */}
          {gallerySuccess && (
            <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{gallerySuccess}</span>
            </div>
          )}

          {/* Gallery Error Message */}
          {galleryError && (
            <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{galleryError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGalleryError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold text-[10px]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Gallery Link Detected Message */}
          {galleryDetectedLink && (
            <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Web Link Detected: </span>
                  <span className="text-slate-600 truncate max-w-xs block sm:inline">
                    {galleryDetectedLink}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleImportGalleryUrl(galleryDetectedLink)}
                disabled={galleryUrlLoading}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {galleryUrlLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LinkIcon className="w-3 h-3" />
                )}
                <span>Import Link Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Gallery Image URL Input Bar */}
        <div className="flex gap-1.5 items-center">
          <div className="relative flex-1">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Add image via direct URL..."
              value={galleryUrlInput}
              onChange={(e) => setGalleryUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleImportGalleryUrl();
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-hidden focus:border-indigo-500 focus:bg-white transition-all font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleImportGalleryUrl()}
            disabled={!galleryUrlInput.trim() || galleryUrlLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
          >
            {galleryUrlLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>Add to Gallery</span>
          </button>
        </div>

        {/* Gallery Grid List */}
        {images.length > 0 && (
          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">
                Gallery Order & Thumbnails ({images.length})
              </span>
              <span className="text-[10px] text-slate-400">
                Use arrows to reorder, star to set as main thumbnail
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {images.map((imgUrl, index) => {
                const isMain = imgUrl === mainImage;

                return (
                  <div
                    key={`${imgUrl}-${index}`}
                    className={`group relative rounded-xl overflow-hidden bg-white border transition-all ${
                      isMain
                        ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Image Preview */}
                    <div className="w-full h-24 bg-slate-50 flex items-center justify-center p-1 relative overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-contain"
                      />

                      {/* Number Order Badge */}
                      <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        #{index + 1}
                      </span>

                      {/* Main Thumbnail Badge */}
                      {isMain && (
                        <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Main</span>
                        </span>
                      )}

                      {/* Quick preview hover button */}
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(imgUrl)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        title="Expand Image"
                      >
                        <Eye className="w-4 h-4 drop-shadow-md" />
                      </button>
                    </div>

                    {/* Action Bar Beneath Thumbnail */}
                    <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                      {/* Set as Main */}
                      <button
                        type="button"
                        onClick={() => handleSetMainFromGallery(imgUrl)}
                        disabled={isMain}
                        title={isMain ? 'Currently main thumbnail' : 'Set as primary thumbnail'}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isMain
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isMain ? 'fill-indigo-600' : ''}`} />
                      </button>

                      {/* Reorder Arrows */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleReorderGalleryImage(index, 'left')}
                          disabled={index === 0}
                          title="Move left"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderGalleryImage(index, 'right')}
                          disabled={index === images.length - 1}
                          title="Move right"
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Delete / Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(index)}
                        title="Remove from gallery"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Helpful browser note */}
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          💡 Tip: Local image files dragged from Chromebook Files or Windows Explorer upload automatically. If dragging from an external website with security protections, use the URL import field above or download the file first.
        </p>
      </div>

      {/* ======================================================== */}
      {/* 3. LIGHTBOX / PREVIEW MODAL                               */}
      {/* ======================================================== */}
      {previewModalUrl && (
        <div
          onClick={() => setPreviewModalUrl(null)}
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-slate-200 relative flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-xs font-bold text-slate-700 self-start mb-3">
              Image High-Resolution Preview
            </h4>

            <div className="w-full max-h-[65vh] flex items-center justify-center bg-slate-50 rounded-2xl p-2 overflow-hidden border border-slate-100">
              <img
                src={previewModalUrl}
                alt="Product High Resolution Preview"
                className="max-h-[60vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[10px] truncate max-w-xs">{previewModalUrl}</span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
