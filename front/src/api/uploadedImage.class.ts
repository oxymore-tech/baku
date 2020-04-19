import { Spinner } from './spinner.class';

export enum Quality {
  Thumbnail = 'thumbnail',
  Lightweight = 'lightweight',
  Original = 'original'
}


export class ImageRef {
  readonly id: string;
  readonly projectId: string;

  preloadedUrl: string = Spinner;

  constructor(projectId: string, id: string) {
    this.projectId = projectId;
    this.id = id;
  }

  public getUrl(q: Quality): string {
    return `/images/${this.projectId}/${q}/${this.id}`;
  }
}
