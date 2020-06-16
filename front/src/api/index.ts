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
      id: '00000000-0000-0000-0000-00000000000f',
      title: 'Mes premières fois',
      posterUrl: "/images/premier_montage/original/shot-000_image-000.jpg",
      synopsis: "Ce film d’animation a été réalisé par des enfants de l’école de\n" +
        "Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous\n" +
        "souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées. Ce film a était créé dans le cadre d'un atelier avec des enfants organisé par la ménagerie",
      locked: true,
      totalImages: 3000,
      fps: 25,
    },
    {
      id: '00000000-0000-0000-0000-000000000000',
      title: 'Bricole',
      posterUrl: "/images/00000000-0000-0000-0000-000000000000/original/video_linda_HD_00072.jpg",
      synopsis: "Les matériaux utilisés pour ce film sont du papier découpé et des objets. Les formes sont fixées. " +
        "Le rouleau de peinture glisse sur une vitre en surplomb des formes découpées pour éviter qu’elles ne bougent.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'La danse',
      posterUrl: "/images/00000000-0000-0000-0000-000000000001/original/danse_002_01_00000.jpg",
      synopsis: "Le papier mâché donne un effet de volume que le papier découpé ne peut rendre. " +
        "Au-delà de la différence de construction la manipulation de ces deux matériaux est la même. " +
        "Les éléments qui doivent bouger sont désolidarisés du corps : bras, jambes, … ce qui facilite les animations entre deux captures.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      title: "Le loup et l'écureuil",
      posterUrl: "/images/00000000-0000-0000-0000-000000000002/original/images_00000.jpg",
      synopsis: "Ce court métrage est réalisé à partir de couches superposées de papier blanc, " +
        "disposées sur une vitre. La lumière est projetée par-dessous et donne cet effet de couleur " +
        "en fonction du nombre de couches de papier. Les personnages sont construits à partir d’éléments en papier articulés.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      title: "L'homme marchant",
      posterUrl: "/images/00000000-0000-0000-0000-000000000003/original/Homme_test_1_00000.jpg",
      synopsis: "Ce film mélange les techniques de dessin animé et de découpage. Une fois la silhouette dessinée, " +
        "elle est découpée et posée sur le fond noir pour la prise de photo. " +
        "Le léger décalage du personnage entre deux captures donne cet effet de vibration qui ne doit pas être exagéré pour rester réaliste.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      title: "L'homme volant",
      posterUrl: "/images/00000000-0000-0000-0000-000000000004/original/Homme_test_2_00000.jpg",
      synopsis: "C’est le classique dessin animé, succession de dessins pris en photo, à raison de 24 images par seconde. " +
        "Pensez à les numéroter, pour ne pas les mélanger lors de la capture.  " +
        "Chaque dessin est réalisé à partir du précédent par calque. On recopie ce qui ne bouge pas et on dessine les éléments qui doivent bouger.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      title: 'Mon lapin',
      posterUrl: "/images/00000000-0000-0000-0000-000000000005/original/DessinAnime_veleda_main_villeneuve1_00000.jpg",
      synopsis: "Le lapin est dessiné au feutre sur un tableau blanc. Entre deux captures, seules les parties du dessin à modifier sont effacées puis redessinées. " +
        "Cette technique est donc plus rapide que le dessin animé. Attention au positionnement de la main, pour que l’effet soit réaliste.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      title: 'Paf',
      posterUrl: "/images/00000000-0000-0000-0000-000000000006/original/Paf_00024.jpg",
      synopsis: "La pâte à modeler est une matière intéressante pour créer des formes originales en volume. " +
        "L’animal ou l’objet peut changer de forme à mesure qu’il se déplace. " +
        "On donne l’illusion de la vitesse en affinant la forme. On donne l’illusion du rebond en épaississant les formes sur la surface d’impact.",
      locked: true,
      fps:12
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      title: 'Sable',
      posterUrl: "/images/00000000-0000-0000-0000-000000000007/original/Sable_00069.jpg",
      synopsis: "L’utilisation de sable fin demande de la délicatesse. Le moindre souffle et tout est à refaire. " +
        "La matière est ajoutée, puis déplacée pour rendre le mouvement de la feuille qui s’envole. " +
        "Des sables de différentes finesses donnent  des effets de couleurs, " +
        "lorsqu’ils sont posés sur une vitre et que la lumière est projetée par-dessous.",
      locked: true,
      fps:12
    }
  ];
}


