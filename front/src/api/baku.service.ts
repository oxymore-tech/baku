import axios from 'axios';

export type ImageRef = string;

export enum BakuAction {
  UPDATE_TITLE,
  UPDATE_SYNOPSIS,
  UPDATE_POSTER,
  ADD_PLAN,
  RENAME_PLAN,
  INSERT_IMAGE,
}

export interface BakuEvent {
  readonly action: BakuAction;
  readonly value: any;
}

export class BakuService {
  private static readonly BaseUrl = '';

  public upload(projectId: string, planId: string, blob: Blob, name: string): Promise<ImageRef> {
    const formData = new FormData();
    formData.set('file', blob, name);
    return axios
      .post(`${BakuService.BaseUrl}/${projectId}/upload/${planId}`, formData,
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
