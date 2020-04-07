import { ImageCacheServiceImpl } from './imageCache.service';
import { Quality } from './uploadedImage.class';


const ctx: Worker = self as any;

const ImageCacheService = new ImageCacheServiceImpl();

export const MSG = 'toto';

ctx.onmessage = (event) => {
  console.log('WebWorker worker.js call testMSG 2', event.data.action, event.data.payload);
  if (event.data && event.data.action === 'startPreloading') {
    const { images } = event.data.payload;
    console.log('WebWorker Images', images);
    ImageCacheService.startPreloading(images, 0, (imageId: string, quality: Quality, url: string) => {ctx.postMessage({ imageId, quality, url }); });
  }
  ImageCacheService.testMSG();
};
