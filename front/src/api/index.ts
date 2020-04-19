import axios from 'axios';
import router from '@/router';
import { ImageRef, UploadedImage } from '@/utils/uploadedImage.class';
import { BakuEvent } from '@/utils/types';

export function getHistory(projectId: string) : Promise<BakuEvent[]> {
  const url = router.resolve({ name: "history", params: { "projectId": projectId }}).href
  return axios.get(url).then((response) => response.data);
}

export function stack(projectId: string, event: BakuEvent): Promise<void> {
  const url = router.resolve({ name: "stack", params: { "projectId": projectId }}).href
  return axios
  .post(url, event);
}

export function upload(projectId: string, blob: Blob, name: string): Promise<ImageRef> {
  const url = router.resolve({ name: "stack", params: { "projectId": projectId }}).href
  const formData = new FormData();
  formData.set('file', blob, name);
  return axios
  .post(url, formData,
    {
      headers: {
        'content-type': 'multipart/form-data',
      },
    })
  .then((r) => new UploadedImage(projectId, r.data[0]));
}

// TODO: rm ?
export function getExportUrl(projectId: string, shotId?: string) {
  if (shotId) {
    return router.resolve({ 
      name: 'exportShot',
      params: { 
        "projectId": projectId,
        "shotId": shotId,
      }
    }).href
  }
  return router.resolve({ 
    name: 'exportProject', 
    params: { 
      "projectId": projectId,
    }
  }).href
}
