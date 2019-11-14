export class UploadService {


  public static async upload(planId: string, blob: Blob, filename: string): Promise<string> {
    const formData = new FormData();
    formData.append('image.jpg', blob, filename);

    return await this.makeRequest(
      'POST',
      `/default/upload/${planId}`,
      formData,
    );
  }


  private static makeRequest(method: string, url: string, formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send(formData);
    });
  }


}
