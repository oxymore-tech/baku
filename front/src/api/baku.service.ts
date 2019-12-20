import axios from 'axios';

export enum Quality {
  Thumbnail = "thumbnail",
  Lightweight = "lightweight",
  Original = "original"
}

export interface ImageRef {
  readonly id: string;

  getUrl(q: Quality): string;
}

export class UploadedImage implements ImageRef {
  readonly projectId: string;
  readonly id: string;

  constructor(projectId: string, id: string) {
    this.projectId = projectId;
    this.id = id;
  }

  public getUrl(q: Quality): string {
    return `/images/${this.projectId}/${q}/${this.id}`;
  }

}

export enum BakuAction {
  MOVIE_UPDATE_TITLE,
  MOVIE_UPDATE_SYNOPSIS,
  MOVIE_UPDATE_POSTER,
  MOVIE_INSERT_IMAGE,
  SHOT_ADD,
  CHANGE_FPS
}

export interface BakuEvent {
  readonly action: BakuAction;
  readonly value: any;
  readonly user: string;
}

export class BakuService {
  private static readonly BaseUrl = '/api';

  public upload(projectId: string, blob: Blob, name: string): Promise<ImageRef> {
    const formData = new FormData();
    formData.set('file', blob, name);
    return axios
      .post(`${BakuService.BaseUrl}/${projectId}/upload`, formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      .then((r) => new UploadedImage(projectId, r.data[0]));
  }

  public getHistory(projectId: string): Promise<BakuEvent[]> {
    return axios
      .get(`${BakuService.BaseUrl}/${projectId}/history`)
      .then((response) => response.data);
  }

  public stack(projectId: string, event: BakuEvent): Promise<void> {
    return axios
      .post(`${BakuService.BaseUrl}/${projectId}/stack`, event);
  }
}
