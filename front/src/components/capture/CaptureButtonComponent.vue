<template>
  <div class="webcamCapture">
    <div
      id="capture-button"
      class="capture-button"
      @click="capture()"
      :class="{ capturing: isCapturing, hidden: !mediaOk }"
    >
      <img alt="camera" class="capture-icon" src="@/assets/camera-solid-orange.svg" />
    </div>
  </div>
</template>

<style lang="scss">
.capture-button {
  width: 144px;
  height: 82px;
  font-size: 30px;
  cursor: pointer;
  color: #e66359;
  text-align: center;
}

.hidden {
  display: none;
}

.capturing {
  color: grey;
  cursor: progress;
}

.capture-icon {
  margin-top: 18px;
  width: 48px;
  height: 43px;
}
</style>

<script lang="ts">
import {
  Component, Prop, Vue, Watch,
} from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Device } from '@/api/device.class';
import { KeyCodes } from '@/api/movie.service';

const CaptureNS = namespace('capture');
const WebRTCNS = namespace('webrtc');

@Component
export default class CaptureButtonComponent extends Vue {
  @Prop(Device)
  public readonly device!: Device;

  @Prop()
  public projectId!: string;

  @WebRTCNS.State
  public dataChannel!: RTCDataChannel;

  @WebRTCNS.State('stream')
  public smartphoneStream!: MediaStream;

  @WebRTCNS.State('isConnected')
  public peerConnected!: boolean;

  public mediaOk: boolean = false;

  @CaptureNS.State
  public scaleX!: number | 1;

  @CaptureNS.State
  public scaleY!: number | 1;

  public isCapturing = false;

  public async mounted() {
    this.onDeviceIdChanged();
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case KeyCodes.ENTER:
          this.capture();
          break;
        default:
          break;
      }
    });
  }

  public beforeDestroy() {
    // Removing tracks to stop using camera
    // @see: https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en#stop-ended-and-active
    this.$store.commit('capture/detachMediaStream');

    if (this.$store.state.peerConnection) {
      this.$store.state.peerConnection.close();
      this.$store.commit('webrtc/setPeerConnection', undefined);
      this.$store.commit('webrtc/setDataChannel', undefined);
    }
  }

  public capture() {
    this.isCapturing = true;
    if (this.device.isSmartphone()) {
      this.captureSmartphone();
    } else {
      this.captureWebcam();
    }
  }

  @Watch('device')
  public onDeviceIdChanged() {
    this.isCapturing = false;
    if (!this.device.isSmartphone()) {
      this.setupWebCam();
    } else if (this.peerConnected) {
      this.mediaOk = true;
      this.setupSmarphone();
    } else {
      this.$store.commit('capture/detachMediaStream');
    }
  }

  @Watch('dataChannel')
  public onDataChannelChanged() {
    if (this.dataChannel) {
      this.setChannelEvents(this.dataChannel);
    }
    if (this.device.isSmartphone()) {
      this.setupSmarphone();
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    // eslint-disable-next-line no-param-reassign
    channel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'capture':
          const video = document.getElementById('video-capture') as HTMLVideoElement;
          const [blob, b64] = this.captureOriginal(video, { scaleX: this.scaleX, scaleY: this.scaleY });
          this.onCaptured(data.message, blob, b64);
          break;
        case 'upload':
          this.onUploaded(data.message);
          break;
        default:
          console.log(`Unknown message '${data.type}' (ignored)`);
      }
    };

    // eslint-disable-next-line no-param-reassign
    channel.onerror = (e) => {
      console.error('channel.onerror', JSON.stringify(e, null, '\t'));
    };

    // eslint-disable-next-line no-param-reassign
    channel.onclose = (e) => {
      console.warn('channel.onclose', JSON.stringify(e, null, '\t'));
    };
  }

  private async setupSmarphone() {
    this.setChannelEvents(this.dataChannel);
    await this.$store.commit(
      'capture/attachMediaStream',
      this.smartphoneStream,
    );
  }

  private async setupWebCam() {
    this.mediaOk = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 },
        deviceId: { exact: this.device.id },
      },
    });
    await this.$store.commit('capture/attachMediaStream', stream);
  }

  private captureSmartphone() {
    this.dataChannel.send(
      JSON.stringify({
        message: 'capture',
        projectId: this.projectId,
        type: 'cmd',
        scaleX: this.scaleX,
        scaleY: this.scaleY,
      }),
    );
  }

  private captureWebcam() {
    this.device.capture(
      'video-capture',
      { scaleX: this.scaleX, scaleY: this.scaleY },
      this.projectId,
      this.onCaptured,
      this.onUploaded,
      (e) => console.log('Error during webcam capture', e),
    );
  }

  private onUploaded(id: string) {
    this.$emit('uploaded', id);
  }

  private async onCaptured(id: string, thumb: Blob | undefined, b64: string) {
    this.$emit('captured', id, thumb, b64);
    this.isCapturing = false;
  }

  private captureOriginal(video: HTMLVideoElement, scales: {scaleX: number, scaleY: number}): [Blob, string] {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context2d = canvas.getContext('2d') as CanvasRenderingContext2D;
    context2d.scale(scales.scaleX, scales.scaleY);
    context2d.drawImage(video, 0, 0, canvas.width * scales.scaleX, canvas.height * scales.scaleY);
    const base64 = canvas.toDataURL('image/jpeg');
    return [this.imagetoblob(base64), base64];
  }

  private imagetoblob(base64String: string): Blob {
    // Split the base64 string in data and contentType
    const block = base64String.split(';');
    // Get the content type of the image
    const contentType = block[0].split(':')[1]; // In this case "image/gif"
    // get the real base64 content of the file
    const realData = block[1].split(',')[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    const byteCharacters = atob(realData);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
}
</script>
