/**
 * Cloudinary Unsigned Image Upload Service
 * 
 * Performs client-side resizing (max 1600px on the longest dimension)
 * and direct unsigned upload to Cloudinary.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Resizes an image file to at most maxDimension on the long side.
 * Preserves aspect ratio, validates MIME type (JPEG, PNG, WEBP),
 * and returns a compressed Blob.
 */
export async function resizeImageToMaxDimension(
  file: File,
  maxDimension = 1600
): Promise<Blob> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Unsupported format: "${file.type || 'unknown'}". Only JPEG, PNG, and WebP are allowed.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Failed to load ${file.name} for resizing`));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D rendering context unavailable'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : (file.type === 'image/webp' ? 'image/webp' : 'image/jpeg');
        const quality = mime === 'image/png' ? undefined : 0.92;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate image blob from canvas'));
            }
          },
          mime,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

/**
 * Uploads an image to Cloudinary unsigned upload endpoint.
 * URL: https://api.cloudinary.com/v1_1/[CLOUD_NAME]/image/upload
 * Requires an unsigned upload_preset.
 */
export async function uploadToCloudinary(
  file: File,
  config: CloudinaryConfig
): Promise<string> {
  const cloudName = config.cloudName?.trim() || (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = config.uploadPreset?.trim() || (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error('Cloudinary Cloud Name is required. Set it in Store Settings (Admin Panel) or VITE_CLOUDINARY_CLOUD_NAME.');
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary Upload Preset is required. Set it in Store Settings (Admin Panel) or VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  // 1. Resize on client side to at most 1600px on long side
  const resizedBlob = await resizeImageToMaxDimension(file, 1600);

  // 2. Prepare multipart form data
  const formData = new FormData();
  formData.append('file', resizedBlob, file.name);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok || !data.secure_url) {
      const errMsg = data?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(`Cloudinary upload failed: ${errMsg}`);
    }

    return data.secure_url as string;
  } catch (error: any) {
    throw new Error(error.message || 'Network error while uploading image to Cloudinary');
  }
}
