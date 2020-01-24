import { Spinner } from '@/api/spinner.class';
import { ImageRef, Quality } from './uploadedImage.class';
// import Axios from 'axios';

type ImgDict = { [id: string]: string };

let tasks: any = []
const executorNb = 5;
for (let i = 0; i<executorNb; i++) {
  pickNextTask(new Promise((r) => { r(); }), i);
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
        console.log("processNewTask [" + tasks.length + "]");
        executor
            .then(task)
            .then(() => { pickNextTask(executor, executorNb) });
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

  private ongoingQueries:  { [quality: string]: ImgDict } = {
    [Quality.Thumbnail]: {},
    [Quality.Lightweight]: {},
    [Quality.Original]: {},
  };

  public async startPreloading(imageRefs: ImageRef[], activeIndex: number) {
    const imageRefsSliced = imageRefs.slice(activeIndex).concat(imageRefs.slice(0, activeIndex));

    // await asyncForEach(imageRefsSliced, (async (image: ImageRef) => {
    // imageRefsSliced.forEach((image: ImageRef) => {
    //   tasks.push(async () => { await this.preloadImage(image, Quality.Thumbnail) } )
    // })
    // imageRefsSliced.forEach((image: ImageRef) => {
    //   tasks.push(async () => { await this.preloadImage(image, Quality.Lightweight) } )
    // })
    imageRefsSliced.forEach((image: ImageRef) => {
      console.log("add!")
      tasks.push(async () => { await this.preloadImage(image, Quality.Thumbnail) } )
    })
  }

  public putImageInCache(imageRef: ImageRef) {
    Object.values(Quality).forEach((quality) => {
      this.putImageInCacheInternal(imageRef, quality);
    });
  }

  private putImageInCacheInternal(imageRef: ImageRef, quality: Quality) {
    this.cachedImages[quality] = {
      ...this.cachedImages[quality],
      [imageRef.id]: imageRef.getUrl(quality),
    };
  }


  // private putImageB64InCacheInternal(imageRef: ImageRef, quality: Quality, b64: string) {
  //   this.cachedImages[quality] = {
  //     ...this.cachedImages[quality],
  //     [imageRef.id]: b64,
  //   };
  // }

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
      await this.preloadImage(image, quality);
      if (onLoad) {
        onLoad(image, quality);
      }
    });
  }

  private async preloadImage(image: ImageRef, quality: Quality) {
    // if (this.isQueryOngoing(image.id, quality)) {
    //   return;
    // }
    // this.ongoingQueries[quality] = {
    //   ...this.ongoingQueries[quality],
    //   [image.id]: 'true'
    // }
    // const res = await Axios.get(image.getUrl(quality), { responseType: 'arraybuffer' }).catch(async (error) => {
    //   await delay(2000);
    //   return await Axios.get(image.getUrl(quality), { responseType: 'arraybuffer' });
    // });
    // let imgB64 = 'data:image/jpeg;base64,' + btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''));
    // this.putImageB64InCacheInternal(image, quality, imgB64);
    // delete this.ongoingQueries[quality][image.id];
    return new Promise<void>((resolve) => {
      if(this.isQueryOngoing(image.id, quality)) {
        resolve();
      }
      this.ongoingQueries[quality] = {...this.ongoingQueries[quality],
        [image.id]: 'true'
      }
      const tempImage = new Image();
      tempImage.src = image.getUrl(quality);
      tempImage.onload = () => {
        this.putImageInCacheInternal(image, quality);
        delete this.ongoingQueries[quality][image.id];
        resolve();
      };
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

  public isCached(imageId: string, quality: Quality): boolean {
    return this.cachedImages[quality].hasOwnProperty(imageId);
  }

  public isQueryOngoing(imageId: string, quality: Quality): boolean {
    return this.ongoingQueries[quality].hasOwnProperty(imageId);
  }
}

export const ImageCacheService = new ImageCacheServiceImpl();

// async function asyncForEach(array: any[], callback: Function) {
//   for (let index = 0; index < array.length; index++) {
//     await callback(array[index], index, array);
//   }
// }

// const delay = (ms : number) => new Promise(res => setTimeout(res, ms));
