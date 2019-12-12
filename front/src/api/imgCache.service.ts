import axios from 'axios';
import { ImageRef } from './baku.service';
interface imgDict {
  [id: string]: string;
}

export class ImgCacheService {
  private fullResImgs: imgDict = {};
  private lowResImgs: imgDict = {};
  private thumbImgs: imgDict = {};
  private imgList: ImageRef[] = [];
  private activeIndex: number = 0;

  public constructor() {
  }

  /**
   *
   * @param imgIds
   * @param projectId
   * @param activeImgIndex
   */
  public updateInfos(imgIds: ImageRef[], activeImgIndex: number) {
    this.imgList = imgIds;
    this.activeIndex = activeImgIndex;
    this.imgList = this.imgList.slice(this.activeIndex).concat(this.imgList.slice(0, this.activeIndex));
  }

  public async startPreloading() {
    for (let index = 0; index < this.imgList.length; index++) {
      const img = this.imgList[index];
      if (!this.thumbImgs.hasOwnProperty(img.id)) {
        try {
          const res = await axios.get(img.thumbUrl, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.thumbImgs = { ...this.thumbImgs, [img.id]: imgB64 };
        } catch (e) {
          // TODO: Do something
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const img = this.imgList[index];
      if (!this.lowResImgs.hasOwnProperty(img.id)) {
        try {
          const res = await axios.get(img.lightweightUrl, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.lowResImgs = { ...this.lowResImgs, [img.id]: imgB64 };
        } catch (e) {
          // TODO: Do something
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const img = this.imgList[index];
      if (!this.fullResImgs.hasOwnProperty(img.id)) {
        try {
          const res = await axios.get(img.originalUrl, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.fullResImgs = { ...this.fullResImgs, [img.id]: imgB64 };
        } catch (e) {
          // TODO: Do something
        }
      }
    }
  }

  /**
   *
   * @param imgId
   */
  public getImage(imgId: string) {
    if (this.fullResImgs.hasOwnProperty(imgId)) {
      return this.fullResImgs[imgId];
    } if (this.lowResImgs.hasOwnProperty(imgId)) {
      return this.lowResImgs[imgId];
    } if (this.thumbImgs.hasOwnProperty(imgId)) {
      return this.thumbImgs[imgId];
    }
    return '';
  }

  /**
   *
   * @param imgId
   */
  public getThumb(imgId: any) {
    if (this.thumbImgs.hasOwnProperty(imgId)) {
      return this.thumbImgs[imgId];
    }
    return '';
  }
}
