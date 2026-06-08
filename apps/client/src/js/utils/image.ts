/**
 * Client-side image compression utility.
 * Compresses receipt/struk images using Canvas & modern WebP/JPEG formats to save bandwidth and storage.
 */
export async function compressImage(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.8
): Promise<Blob | File> {
  // If we are not in a browser environment, return original
  if (typeof window === "undefined") {
    return file;
  }

  try {
    let imgSource: ImageBitmap | HTMLImageElement;

    // Use createImageBitmap if supported (best practice, asynchronous, handles orientation)
    if (typeof window.createImageBitmap !== "undefined") {
      imgSource = await createImageBitmap(file);
    } else {
      // Fallback to Image with Object URL
      imgSource = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = err => reject(err);
        img.src = URL.createObjectURL(file);
      });
    }

    let width = imgSource.width;
    let height = imgSource.height;

    // Capping max dimension
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      if ("close" in imgSource) imgSource.close();
      return file;
    }

    ctx.drawImage(imgSource, 0, 0, width, height);

    // Clean up ImageBitmap memory if used
    if ("close" in imgSource) {
      imgSource.close();
    } else {
      // If we used the fallback Object URL, revoke it
      if (imgSource.src.startsWith("blob:")) {
        URL.revokeObjectURL(imgSource.src);
      }
    }

    // Export to WebP (standard modern format), fallback to JPEG
    return new Promise<Blob | File>(resolve => {
      canvas.toBlob(
        blob => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            // If compression didn't make the file smaller, use the original
            resolve(file);
          }
        },
        "image/webp",
        quality
      );
    });
  } catch (error) {
    console.warn("Client-side image compression failed, falling back to original file:", error);
    return file;
  }
}
