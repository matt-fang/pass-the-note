import { useState, useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const totalImages = imageUrls.length;

    if (totalImages === 0) {
      setImagesLoaded(true);
      return;
    }

    const imagePromises = imageUrls.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setImagesLoaded(true);
          }
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });

    Promise.all(imagePromises).catch(() => {
      // Even if some images fail, we should still show the component
      setImagesLoaded(true);
    });
  }, [imageUrls]);

  return imagesLoaded;
};