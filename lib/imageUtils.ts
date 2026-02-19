/**
 * Supabase Storage の products_thumbs / blog_thumbs 用 WebP サムネイル URL に変換
 * DB の画像 URL は変更せず、フロント側で URL を組み替える
 */

/**
 * 画像ファイルを WebP 形式に変換（管理者アップロード用）
 */
export async function convertImageToWebP(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

export function toProductThumbUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  return originalUrl
    .replace('/products/', '/products_thumbs/')
    .replace(/\.(png|jpg|jpeg)$/i, '.webp');
}

export function toBlogThumbUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  return originalUrl
    .replace('/blog/', '/blog_thumbs/')
    .replace(/\.(png|jpg|jpeg|webp)$/i, '.webp');
}
