import { Spinner } from '@/api/spinner.class';
import { ImageRef, Quality } from './uploadedImage.class';

type ImgDict = { [id: string]: string };


class ImageCacheServiceImpl {
  private cachedImages: { [quality: string]: ImgDict } = {
    [Quality.Thumbnail]: {},
    [Quality.Lightweight]: {},
    [Quality.Original]: {},
  };

  private readonly tasks: any = [];
  private readonly executorNb = 5;

  constructor() {
    for (let i = 0; i < this.executorNb; i++) {
      this.pickNextTask(new Promise((r) => {
        r();
      }), i);
    }
  }


  private processNewTask(executor: any, executorNb: number) {
    let task = this.tasks.shift();
    if (task) {
      // console.log("processNewTask [" + tasks.length + "]");
      executor
        .then(task)
        .then(() => {
          this.pickNextTask(executor, executorNb)
        });
      return true
    }
    return false
  }

  private pickNextTask(executor: any, executorNb: number) {
    return new Promise((resolve, reject) => {
      if (this.processNewTask(executor, executorNb)) {
        resolve()
      } else {
        let timer = setInterval(() => {
          if (this.processNewTask(executor, executorNb)) {
            if (timer) {
              clearInterval(timer);
            }
            resolve();
          }
        }, 50)
      }
    })
  }

  public startPreloading(imageRefs: ImageRef[], activeIndex: number, onImagePreloaded: (imageId: string) => void) {
    if (imageRefs.length > 0) {
      const imageRefsSliced = imageRefs.slice(activeIndex, imageRefs.length).concat(imageRefs.slice(0, activeIndex));
      this.tasks.splice(0, this.tasks.length);
      this.createTaskIfNeeded(imageRefsSliced[0], Quality.Thumbnail, onImagePreloaded);
      this.createTaskIfNeeded(imageRefsSliced[0], Quality.Lightweight, onImagePreloaded);
      this.createTaskIfNeeded(imageRefsSliced[0], Quality.Original, onImagePreloaded);
      imageRefsSliced.forEach((image: ImageRef) => {
        this.createTaskIfNeeded(image, Quality.Thumbnail, onImagePreloaded);
      });
      imageRefsSliced.forEach((image: ImageRef) => {
        this.createTaskIfNeeded(image, Quality.Lightweight, onImagePreloaded);
      });
      imageRefsSliced.forEach((image: ImageRef) => {
        this.createTaskIfNeeded(image, Quality.Original, onImagePreloaded);
      });
    }
  }

  private createTaskIfNeeded(image: ImageRef, quality: Quality, onImagePreloaded: (imageId: string) => void) {
    if (!this.isCached(image.id, quality)) {
      this.tasks.push(async () => {
        await this.preloadImage(image, quality, onImagePreloaded)
      });
    }
  }

  public putImageBlobInCache(imageId: string, image: string) {
    this.cachedImages[Quality.Original] = {
      ...this.cachedImages[Quality.Original],
      [imageId]: image,
    };
    this.cachedImages[Quality.Lightweight] = {
      ...this.cachedImages[Quality.Lightweight],
      [imageId]: image,
    };
    this.cachedImages[Quality.Thumbnail] = {
      ...this.cachedImages[Quality.Thumbnail],
      [imageId]: image,
    };
  }

  public startPreloadingImage(image: ImageRef, onLoad?: (image: ImageRef, quality: Quality) => void) {
    Object.values(Quality).forEach(async (quality) => {
      await this.preloadImage(image, quality, () => {
        if (onLoad) {
          onLoad(image, quality);
        }
      });
    });
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

  private async preloadImage(image: ImageRef, quality: Quality,
                             onImagePreloaded: (imageId: string) => void) {
    return new Promise<void>((resolve) => {
      const oReq = new XMLHttpRequest();
      oReq.onload = () => {
        this.putImageInCacheInternal(image, quality);
        onImagePreloaded(image.id);
        resolve();
      };
      oReq.open("get", image.getUrl(quality), true);
      oReq.send();
    });
  }

  private putImageInCacheInternal(imageRef: ImageRef, quality: Quality) {
    this.cachedImages[quality][imageRef.id] = imageRef.getUrl(quality);
  }

  private isCached(imageId: string, quality: Quality): boolean {
    return this.cachedImages[quality].hasOwnProperty(imageId);
  }

}

export const ImageCacheService = new ImageCacheServiceImpl();
