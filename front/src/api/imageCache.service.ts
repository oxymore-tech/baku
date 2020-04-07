
import { ImageRef, Quality, UploadedImage } from './uploadedImage.class';

type ImgDict = { [id: string]: string };


export class ImageCacheServiceImpl {
  private cachedImages: { [quality: string]: ImgDict } = {
    [Quality.Thumbnail]: {},
    [Quality.Lightweight]: {},
    [Quality.Original]: {},
  };

  private readonly tasks: (() => Promise<void>)[] = [];

  private readonly executorNb = 5;

  constructor() {
    // console.log('WebWorker IMAGE CACHE SERVICE CONSTRUCTOR');
    for (let i = 0; i < this.executorNb; i++) {
      // console.log('EXEC Launch', i);
      this.pickNextTask(new Promise((r) => {
        r();
      }), i); // .then(() => console.log('EXEC FINISH'));
    }
  }

  public testMSG() {
    console.log('WebWorker ImageCacheService.testMSG()');
  }

  private processNewTask(executor: any, executorNb: number) {
    const task = this.tasks.shift();
    if (task) {
      // console.log("processNewTask [" + tasks.length + "]");
      executor
        .then(task)
        .then(() => {
          this.pickNextTask(executor, executorNb); // .then(() => console.log('EXEC FINISH 2'));
        });
      // .then(() => console.log('EXEC FINISH 3'));
      return true;
    }
    return false;
  }

  private pickNextTask(executor: any, executorNb: number) {
    // console.log('EXEC pickNextTask', executorNb);
    return new Promise((resolve, _reject) => {
      if (this.processNewTask(executor, executorNb)) {
        // console.log('EXEC RESOLVE 1');
        resolve();
      } else {
        const timer = setInterval(() => {
          if (this.processNewTask(executor, executorNb)) {
            if (timer) {
              clearInterval(timer);
            }
            resolve();
            // console.log('EXEC RESOLVE 2');
          }
        }, 50);
      }
    });
  }

  // TODO Faire une fonction updatePreloading, qui remet les tasks dans l'ordre

  public startPreloading(imageRefs: ImageRef[], activeIndex: number, onImagePreloaded: (imageId: string, quality: Quality, url: string) => void) {
    console.log('[ImageCache][WebWorker] startPreloading()', imageRefs, activeIndex);
    if (imageRefs.length > 0) {
      // We empty the task list
      this.tasks.splice(0, this.tasks.length);

      // Duplicate the image array without the first element (first image need to be download first)
      const imageRefsSliced = [...imageRefs];
      imageRefsSliced.shift();

      // Download first image in priority
      this.createTaskIfNeeded(imageRefs[0], Quality.Thumbnail, onImagePreloaded);
      this.createTaskIfNeeded(imageRefs[0], Quality.Lightweight, onImagePreloaded);
      this.createTaskIfNeeded(imageRefs[0], Quality.Original, onImagePreloaded);

      // Download all other images in following order : (first, all Thumb, second, all LightWeight, at last all Original)
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

  private createTaskIfNeeded(image: ImageRef, quality: Quality, onImagePreloaded: (imageId: string, quality: Quality, url: string) => void) {
    // console.log('CALL createTaskIfNeeded', image, quality);
    if (!this.isCached(image.id, quality)) {
      this.tasks.push(async () => {
        await this.preloadImage(image, quality, onImagePreloaded);
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

  private async preloadImage(image: ImageRef, quality: Quality,
    onImagePreloaded: (imageId: string, quality: Quality, url: string) => void) {
    return new Promise<void>((resolve) => {
      const oReq = new XMLHttpRequest();
      oReq.onload = () => {
        // this.putImageInCacheInternal(image, quality);
        onImagePreloaded(image.id, quality, this.getImageUrl(image as any, quality));
        resolve();
      };
      oReq.open('get', this.getImageUrl(image as any, quality), true);
      oReq.send();
    });
  }

  public getImageUrl(image: UploadedImage, quality: Quality): string {
    return `/images/${image.projectId}/${quality}/${image.id}`;
  }

  // private putImageInCacheInternal(imageRef: ImageRef, quality: Quality) {
  //   this.cachedImages[quality][imageRef.id] = this.getImageUrl(imageRef as any, quality);
  // }

  private isCached(imageId: string, quality: Quality): boolean {
    // eslint-disable-next-line no-prototype-builtins
    return this.cachedImages[quality].hasOwnProperty(imageId);
  }
}


