export enum Quality {
  Thumbnail = 'thumbnail',
  Lightweight = 'lightweight',
  Original = 'original'
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
