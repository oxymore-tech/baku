import axios from 'axios';
import {ImageRef} from './baku.service';

type ImgDict = { [id: string]: string };

export class ImgCacheService {
  private fullResImgs: ImgDict = {};
  private lowResImgs: ImgDict = {};
  private thumbImgs: ImgDict = {};
  private imgList: ImageRef[] = [];
  private activeIndex: number = 0;
  private readonly preloadImage: string;

  public constructor() {
    this.preloadImage = require("@/assets/loading.svg");
  }

  /**
   * @param imgIds
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
          const res = await axios.get(img.thumbUrl, {responseType: 'blob'});
          this.thumbImgs = {...this.thumbImgs, [img.id]: URL.createObjectURL(res.data)};
        } catch (e) {
          console.log("Error while loading thumb", e);
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const img = this.imgList[index];
      if (!this.lowResImgs.hasOwnProperty(img.id)) {
        try {
          const res = await axios.get(img.lightweightUrl, {responseType: 'blob'});
          this.lowResImgs = {...this.lowResImgs, [img.id]: URL.createObjectURL(res.data)};
        } catch (e) {
          console.log("Error while loading lightweight", e);
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const img = this.imgList[index];
      if (!this.fullResImgs.hasOwnProperty(img.id)) {
        try {
          const res = await axios.get(img.originalUrl, {responseType: 'blob'});
          this.fullResImgs = {...this.fullResImgs, [img.id]: URL.createObjectURL(res.data)};
        } catch (e) {
          console.log("Error while loading original", e);
        }
      }
    }
  }

  /**
   * @param imgId
   */
  public getImage(imgId: string): string {
    if (this.fullResImgs.hasOwnProperty(imgId)) {
      return this.fullResImgs[imgId];
    }
    if (this.lowResImgs.hasOwnProperty(imgId)) {
      return this.lowResImgs[imgId];
    }
    if (this.thumbImgs.hasOwnProperty(imgId)) {
      return this.thumbImgs[imgId];
    }
    return this.preloadImage;
  }

  /**
   * @param imgId
   */
  public getThumb(imgId: any): string {
    if (this.thumbImgs.hasOwnProperty(imgId)) {
      return this.thumbImgs[imgId];
    }
    return this.preloadImage;
  }
}
