import axios from 'axios';
import { ImageRef, UploadedImage } from '@/utils/uploadedImage.class';
import { BakuEvent, VideoStatus } from '@/utils/types';
import { SeenProject } from "@/store/store.types";

export function getVersion(): Promise<string> {
  return axios.get(`/info`)
    .then((response) => response.data.git?.commit?.describe);
}

export function createProject(): Promise<string> {
  return axios.get("/api/movie").then((response) => response.data);
}

export async function deleteProject(projectId: string): Promise<void> {
  await axios.delete(`/api/${projectId}`)
    .then((response) => response.data);
}

export function getHistory(projectId: string): Promise<BakuEvent[]> {
  return axios.get(`/api/${projectId}/history`)
    .then((response) => response.data);
}

export function stack(projectId: string, events: BakuEvent[]): Promise<void> {
  return axios.post(`/api/${projectId}/stack`, events);
}

export function upload(projectId: string, blob: Blob, name: string): Promise<ImageRef> {
  const formData = new FormData();
  formData.set('file', blob, name);
  return axios
    .post(`/api/${projectId}/upload`, formData,
      {
        headers: {
          'content-type': 'multipart/form-data',
        }
      })
    .then((r) => new UploadedImage(projectId, r.data[0]));
}

export function getVideoStatus(projectId: string): Promise<VideoStatus> {
  return axios
    .get<VideoStatus>(`/api/${projectId}/video/status`)
    .then(r => r.data);
}

export function getVideoUrl(projectId: string, shotId?: string): string {
  if (shotId) {
    return `/api/${projectId}/${shotId}/video`;
  }
  return `/api/${projectId}/video`;
}

export async function generateVideo(projectId: string): Promise<void> {
  await axios.post<VideoStatus>(`/api/${projectId}/video`);
}

export function getExportUrl(projectId: string, shotId?: string) {
  if (shotId) {
    return `/api/${projectId}/${shotId}/export.zip`;
  }
  return `/api/${projectId}/export.zip`;
}

export function getDemoProjects(): SeenProject[] {
  // return axios
  //   .get<SeenProject[]>(`/demo`)
  //   .then(r => r.data);
  return [
    {
      id: 'premier_montage',
      title: 'Mes premières fois',
      posterUrl: "/images/premier_montage/original/shot-000_image-000.jpg",
      synopsis: "Ce film d’animation a été réalisé par des enfants de l’école de\n" +
        "Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous\n" +
        "souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées. Ce film a était créé dans le cadre d'un atelier avec des enfants organisé par la ménagerie",
      locked: true,
      totalImages: 3000,
      fps: 25
    }
  ];
}


