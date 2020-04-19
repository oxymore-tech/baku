import { ImageCacheServiceImpl } from './imageCache.service';


const worker: Worker = self as any;

const ImageCacheService = new ImageCacheServiceImpl(worker);


worker.onmessage = (event) => {
  console.log('WebWorker worker.js onmessage', event.data.action, event.data.payload);
  if (event.data) {
    if (event.data.action === 'startPreloading') {
      const { images } = event.data.payload;
      ImageCacheService.startPreloading(images);
    } else if (event.data.action === 'updatePreloading') {
      const { index } = event.data.payload;
      ImageCacheService.updatePreloading(index);
    }
  }
};
