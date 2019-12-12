import axios from 'axios';
interface imgDict {
  [id: string]: string;
}

export class ImgCacheService {
  private fullResImgs: imgDict = {};
  private lowResImgs: imgDict = {};
  private thumbImgs: imgDict = {};
  private imgList: string[] = [];
  private activeIndex: number = 0;
  private projectId: string = '';

  public constructor() {
  }

  /**
   *
   * @param imgIds
   * @param projectId
   * @param activeImgIndex
   */
  public updateInfos(imgIds: string[], projectId: string, activeImgIndex: number) {
    this.imgList = imgIds;
    this.activeIndex = activeImgIndex;
    this.projectId = projectId;
    this.imgList = this.imgList.slice(this.activeIndex).concat(this.imgList.slice(0, this.activeIndex));
  }

  public async startPreloading() {
    for (let index = 0; index < this.imgList.length; index++) {
      const imgId = this.imgList[index];
      if (!this.thumbImgs.hasOwnProperty(imgId)) {
        try {
          const res = await axios.get(`/images/${this.projectId}/thumbnail/${imgId}`, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.thumbImgs = { ...this.thumbImgs, [imgId]: imgB64 };
        } catch (e) {
          // TODO: Do something
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const imgId = this.imgList[index];
      if (!this.lowResImgs.hasOwnProperty(imgId)) {
        try {
          const res = await axios.get(`/images/${this.projectId}/lightweight/${imgId}`, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.lowResImgs = { ...this.lowResImgs, [imgId]: imgB64 };
        } catch (e) {
          // TODO: Do something
        }
      }
    }
    for (let index = 0; index < this.imgList.length; index++) {
      const imgId = this.imgList[index];
      if (!this.fullResImgs.hasOwnProperty(imgId)) {
        try {
          const res = await axios.get(`/images/${this.projectId}/original/${imgId}`, { responseType: 'arraybuffer' });
          let imgB64 = btoa(new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), ''))
          this.fullResImgs = { ...this.fullResImgs, [imgId]: imgB64 };
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
  public getThumb(imgId: string) {
    if (this.thumbImgs.hasOwnProperty(imgId)) {
      return this.thumbImgs[imgId];
    }
    return '';
  }
}
