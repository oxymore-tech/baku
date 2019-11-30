import axios from 'axios';

export type ImageRef = string;

export enum BakuAction {
  MOVIE_UPDATE_TITLE,
  MOVIE_UPDATE_SYNOPSIS,
  MOVIE_UPDATE_POSTER,
  MOVIE_INSERT_IMAGE,
  SHOT_ADD,
  SHOT_RENAME,
  CHANGE_FPS
}

export interface BakuEvent {
  readonly action: BakuAction;
  readonly value: any;
  readonly user: string;
}

export class BakuService {
  private static readonly BaseUrl = '/api';

  public upload(projectId: string, shotId: string, blob: Blob, name: string): Promise<ImageRef> {
    const formData = new FormData();
    formData.set('file', blob, name);
    return axios
      .post(`${BakuService.BaseUrl}/${projectId}/upload/${shotId}`, formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      .then((r) => r.data[0]);
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
