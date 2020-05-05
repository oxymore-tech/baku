import axios from 'axios';
import router from '@/router';
import { ImageRef, UploadedImage } from '@/utils/uploadedImage.class';
import { BakuEvent, VideoStatus } from '@/utils/types';


export function createProject(): Promise<string> {
  const url = router.resolve({name: "movie"}).href;
  return axios.get(url).then((response) => response.data);
}

export function getHistory(projectId: string): Promise<BakuEvent[]> {
  const url = router.resolve({name: "history", params: {"projectId": projectId}}).href;
  return axios.get(url).then((response) => response.data);
}

export function stack(projectId: string, events: BakuEvent[]): Promise<void> {
  const url = router.resolve({name: "stack", params: {"projectId": projectId}}).href;
  return axios.post(url, events);
}

export function upload(projectId: string, blob: Blob, name: string): Promise<ImageRef> {
  const url = router.resolve({name: "upload", params: {"projectId": projectId}}).href;
  const formData = new FormData();
  formData.set('file', blob, name);
  return axios
    .post(url, formData,
      {
        headers: {
          'content-type': 'multipart/form-data',
        }
      })
    .then((r) => new UploadedImage(projectId, r.data[0]));
}

export function getVideoStatus(projectId: string): Promise<VideoStatus> {
  const url = router.resolve({name: "video-status", params: {"projectId": projectId}}).href;
  return axios
    .get<VideoStatus>(url)
    .then(r => r.data);
}

export function getVideoUrl(projectId: string): string {
  return router.resolve({name: "video", params: {"projectId": projectId}}).href;
}

export async function generateVideo(projectId: string): Promise<void> {
  const url = router.resolve({name: "video", params: {"projectId": projectId}}).href;
  await axios.post<VideoStatus>(url);
}

// TODO: rm ?
export function getExportUrl(projectId: string, shotId?: string) {
  if (shotId) {
    return router.resolve({
      name: 'exportShot',
      params: {
        "projectId": projectId,
        "shotId": shotId
      }
    }).href;
  }
  return router.resolve({
    name: 'exportProject',
    params: {
      "projectId": projectId
    }
  }).href;
}
