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
    },
    {
      id: 'bonhomme',
      title: 'bonhomme',
      posterUrl: "/images/bonhomme/original/bonhomme_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'danse_002_01',
      title: 'danse_002_01',
      posterUrl: "/images/danse_002_01/original/danse_002_01_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'DessinAnime_veleda_main_villeneuve1',
      title: 'DessinAnime_veleda_main_villeneuve1',
      posterUrl: "/images/DessinAnime_veleda_main_villeneuve1/original/DessinAnime_veleda_main_villeneuve1_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'Habillage_Plan03',
      title: 'Habillage_Plan03',
      posterUrl: "/images/Habillage_Plan03/original/Habillage_Plan03_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'homme',
      title: 'homme',
      posterUrl: "/images/homme/original/homme_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'la_tache_rouge',
      title: 'la_tache_rouge',
      posterUrl: "/images/la_tache_rouge/original/la_tache_rouge_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'Lhomme_de_sable',
      title: 'Lhomme_de_sable',
      posterUrl: "/images/Lhomme_de_sable/original/Lhomme_de_sable_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'marche',
      title: 'marche',
      posterUrl: "/images/marche/original/marche_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'Paf',
      title: 'Paf',
      posterUrl: "/images/Paf/original/Paf_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'Sable',
      title: 'Sable',
      posterUrl: "/images/Sable/original/Sable_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'The_Villeneuve',
      title: 'The_Villeneuve',
      posterUrl: "/images/The_Villeneuve/original/The_Villeneuve_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'velo_001_01',
      title: 'velo_001_01',
      posterUrl: "/images/velo_001_01/original/velo_001_01_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    },
    {
      id: 'video_linda_HD',
      title: 'video_linda_HD',
      posterUrl: "/images/video_linda_HD;/original/video_linda_HD;_00000.jpg",
      synopsis: "",
      locked: true,
      fps:12
    }
  ];
}


