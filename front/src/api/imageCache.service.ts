import { Spinner } from '@/api/spinner.class';
import { ImageRef, Quality } from './uploadedImage.class';

type ImgDict = { [id: string]: string };

let tasks: any = [];
const executorNb = 5;
for (let i = 0; i < executorNb; i++) {
  pickNextTask(new Promise((r) => {
    r();
  }), i);
}

// function wait1sec() {
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve('resolved');
//     }, 1000);
//   });
// }
//
// async function pickNextTask(executor: any, executorNb: number) {
//   let task = tasks.shift();
//   if (task) {
//     console.log("[" + executorNb + "] processNewTask [" + tasks.length + "]");
//     await task();
//   } else {
//     // console.log("[" + executorNb + "] wait 1 sec")
//     await wait1sec();
//   }
//   executor.then(() => { pickNextTask(executor, executorNb) });
// }


function processNewTask(executor: any, executorNb: number) {
  let task = tasks.shift();
  if (task) {
    // console.log("processNewTask [" + tasks.length + "]");
    executor
      .then(task)
      .then(() => {
        pickNextTask(executor, executorNb)
      });
    return true
  }
  return false
}

function pickNextTask(executor: any, executorNb: number) {
  return new Promise((resolve, reject) => {
    if (processNewTask(executor, executorNb)) {
      resolve()
    } else {
      // console.log("start timer");
      let timer = setInterval(() => {
        if (processNewTask(executor, executorNb)) {
          if (timer) {
            clearInterval(timer);
          }
          resolve();
        }
      }, 50)
    }
  })
}


class ImageCacheServiceImpl {
  private cachedImages: { [quality: string]: ImgDict } = {
    [Quality.Thumbnail]: {},
    [Quality.Lightweight]: {},
    [Quality.Original]: {},
  };

  public startPreloading(imageRefs: ImageRef[], activeIndex: number, imageReady: (imageIdx: number, imageId: string) => void) {
    const imageRefsSliced = imageRefs.slice(activeIndex).concat(imageRefs.slice(0, activeIndex));

    tasks.push(async () => { await this.preloadImage(imageRefsSliced[0], Quality.Thumbnail, imageReady) } )
    tasks.push(async () => { await this.preloadImage(imageRefsSliced[0], Quality.Lightweight, imageReady) } )
    tasks.push(async () => { await this.preloadImage(imageRefsSliced[0], Quality.Original, imageReady) } )
    imageRefsSliced.forEach((image: ImageRef) => {
      tasks.push(async () => {
        await this.preloadImage(image, Quality.Thumbnail, imageReady)
      })
    })
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
    console.log("get image " + imageId);
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
                             imageReady: (imageIdx: number, imageId: string) => void) {
    return new Promise<void>((resolve) => {
      // const start = +new Date;

      const oReq = new XMLHttpRequest();
      oReq.onload = () => {
        this.putImageInCacheInternal(image, quality);

        // console.log(+new Date - start);
        imageReady(0, image.id);
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
