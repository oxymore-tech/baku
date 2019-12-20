import { ImageRef, Quality } from './baku.service';
import { Spinner } from '@/api/spinner.class';

type ImgDict = { [id: string]: string };

class ImageCacheServiceImpl {
  private cachedImages: { [q: string]: ImgDict } = {
    [Quality.Thumbnail]: {},
    [Quality.Lightweight]: {},
    [Quality.Original]: {},
  };

  public startPreloading(imageRefs: ImageRef[], activeIndex: number) {
    const imageRefsSliced = imageRefs.slice(activeIndex).concat(imageRefs.slice(0, activeIndex));
    for (const image of imageRefsSliced) {
      this.startPreloadingImage(image);
    }
  }

  public putImageInCache(imageRef: ImageRef) {
    for (const quality of Object.values(Quality)) {
      this.putImageInCacheInternal(imageRef, quality);
    }
  }

  private putImageInCacheInternal(imageRef: ImageRef, quality: Quality) {
    this.cachedImages[quality] = {
      ...this.cachedImages[quality],
      [imageRef.id]: imageRef.getUrl(quality),
    };
  }

  public startPreloadingImage(image: ImageRef, onLoad?: (image: ImageRef, quality: Quality) => void) {
    for (const quality of Object.values(Quality)) {
      const tempImage = new Image();
      tempImage.onload = () => {
        this.putImageInCacheInternal(image, quality);
        if (onLoad) {
          onLoad(image, quality);
        }
      };
      tempImage.src = image.getUrl(quality);
    }
  }

  public getImage(imageId: string): string {
    if (this.isCached(imageId, Quality.Original)) {
      return this.cachedImages[Quality.Original][imageId];
    }
    if (this.isCached(imageId, Quality.Lightweight)) {
      return this.cachedImages[Quality.Lightweight][imageId];
    }
    if (this.isCached(imageId, Quality.Thumbnail)) {
      return this.cachedImages[Quality.Thumbnail][imageId];
    }
    return Spinner;
  }

  public getThumbnail(imageId: string): string {
    if (this.isCached(imageId, Quality.Thumbnail)) {
      return this.cachedImages[Quality.Thumbnail][imageId];
    }
    return Spinner;
  }

  public isCached(imageId: string, q: Quality): boolean {
    return this.cachedImages[q].hasOwnProperty(imageId);
  }
}

export const ImageCacheService = new ImageCacheServiceImpl();
