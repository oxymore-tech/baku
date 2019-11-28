import * as uuid from 'uuid';
import { BakuService } from '@/api/baku.service';

export class Device {
  public readonly id: string;

  public readonly label: string;

  private readonly bakuService: BakuService = new BakuService();

  constructor(id: string, label: string) {
    this.id = id;
    this.label = label;
  }

  public isSmartphone() {
    return this.id === 'smartphone';
  }

  public async capture(videoElementTag: string, projectId: string, planId: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const video = document.getElementById(videoElementTag) as HTMLVideoElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context2d = canvas.getContext('2d') as CanvasRenderingContext2D;
    context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg');
    const blob = this.imagetoblob(base64);
    return this.bakuService.upload(projectId, planId, blob, `${uuid.v4()}.jpg`);
  }

  private imagetoblob(base64String: string): Blob {
    // Split the base64 string in data and contentType
    const block = base64String.split(';');
    // Get the content type of the image
    const contentType = block[0].split(':')[1]; // In this case "image/gif"
    // get the real base64 content of the file
    const realData = block[1].split(',')[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    return this.b64toBlob(realData, contentType);
  }

  private b64toBlob(b64Data: string, contentType: string = '', sliceSize: number = 512): Blob {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
}
