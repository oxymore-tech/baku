import { Spinner } from './spinner.class';

export enum Quality {
  Thumbnail = 'thumbnail',
  Lightweight = 'lightweight',
  Original = 'original'
}

export interface ImageRef {
  readonly id: string;
  preloadedUrl: string;

  getUrl(q: Quality): string;
}

export class UploadedImage implements ImageRef {
  readonly projectId: string;

  readonly id: string;
  private preloadedUrlValue: string;

  constructor(projectId: string, id: string) {
    this.projectId = projectId;
    this.id = id;
    this.preloadedUrlValue = '@/assets/baku-balls-spinner.svg';
    this.preloadedUrlValue = Spinner;
  }

  public getUrl(q: Quality): string {
    return `/images/${this.projectId}/${q}/${this.id}`;
  }

  set preloadedUrl(url: string) {
    this.preloadedUrlValue = url;
  }
  get preloadedUrl(): string {
    return this.preloadedUrlValue;
  }
}
