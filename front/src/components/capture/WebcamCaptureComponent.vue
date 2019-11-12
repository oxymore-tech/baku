<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="webcamCapture">
    <div
      id="captureButton"
      class="captureButton"
      @click="capture()"
      v-bind:class="{ capturing: isCapturing, hidden: !peerConnected }"
    >Capture!</div>
  </div>
</template>

<style lang="scss">
.captureButton {
  font-size: 30px;
  cursor: pointer;
  color: #e66359;
  text-align: center;
}

#remoteVideo {
  height: 157px;
}

.hidden {
  display: none;
}

.capturing {
  color: grey;
  cursor: progress;
}
</style>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import * as uuid from 'uuid';
import { State } from 'vuex-class';
import store from '@/store';

@Component({
  store,
})
export default class WebcamCaptureComponent extends Vue {
  @Prop(String)
  public readonly deviceId!: string;
  public isCapturing = false;
  public peerConnected = false;

  @State
  public dataChannel!: RTCDataChannel;

  public async mounted() {
    console.log('WebcamCapture mounted', this.deviceId);
    this.onDeviceIdChanged();
  }

  public beforeDestroy() {
    // Removing tracks to stop using camera
    // @see: https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en#stop-ended-and-active
    this.$store.commit('capture/detachMediaStream');

    if (this.$store.state.peerConnection) {
      this.$store.state.peerConnection.close();
      this.$store.commit('setPeerConnection', undefined);
      this.$store.commit('setDataChannel', undefined);
    }
  }


  public capture() {
    this.isCapturing = true;
    if (this.deviceId === 'smartphone') {
      this.captureSmartphone();
    } else {
      this.captureWebcam();
    }
  }

  @Watch('deviceId')
  public onDeviceIdChanged() {
    this.isCapturing = false;
    if (this.deviceId !== 'smartphone') {
      this.setupWebCam();
    } else {
      const peerConnected = !!this.$store.state.dataChannel;
      if (peerConnected) {
        this.setupSmarphone();
      } else {
        this.peerConnected = false;
        this.$store.commit('capture/detachMediaStream');
      }
    }
  }

  @Watch('dataChannel')
  public onDataChannelChanged() {
    console.log('onDataChannelChanged', this.dataChannel);
    this.peerConnected = !!this.dataChannel;
    if (this.dataChannel) {
      this.setChannelEvents(this.dataChannel);
    }
    if (this.deviceId === 'smartphone') {
      this.setupSmarphone();
    }
  }


  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = (event) => {
      // TODO: Try to understand why you need TWO json parse
      const data = JSON.parse(JSON.parse(event.data));
      if (data.type === 'upload') {
        this.isCapturing = false;
        const pictureId = data.message;
        this.$store.dispatch('plan/addNewPictureAction', pictureId);
      }
      console.log('Message received', event);
    };

    channel.onerror = (e) => {
      console.error('channel.onerror', JSON.stringify(e, null, '\t'));
    };

    channel.onclose = (e) => {
      console.warn('channel.onclose', JSON.stringify(e, null, '\t'));
    };
  }

  private setupSmarphone() {
    const stream = this.$store.state.stream;
    console.log('setupSmarphone', stream);
    this.$store.commit('capture/attachMediaStream', stream);
  }

  private async setupWebCam() {
    this.peerConnected = true;
    const stream = await navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
          deviceId: { exact: this.deviceId },
        },
      });
    this.$store.commit('capture/attachMediaStream', stream);
  }

  private captureSmartphone() {
    this.dataChannel.send(
      JSON.stringify({
        message: 'capture',
        plan: this.$store.state.plan.activePlan,
        type: 'cmd',
      }),
    );
  }

  private captureWebcam() {
    const canvas = document.createElement('canvas');
    const video = document.getElementById('videoCapture') as any;
    canvas.width = 640;
    canvas.height = 480;
    const context2d = canvas.getContext('2d') as CanvasRenderingContext2D;
    context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg');

    const formData = new FormData();
    const blob = imagetoblob(base64);
    formData.append('image.jpg', blob, uuid.v4() + '.jpg');
    const request = new XMLHttpRequest();
    request.open(
      'POST',
      `https://${location.host}/default/upload/${this.$store.state.plan.activePlan}`,
    );
    const self = this;
    request.onreadystatechange = function () {
      // Appelle une fonction au changement d'état.
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const pictureId = JSON.parse(this.response)[0];
        self.isCapturing = false;
        self.$store.dispatch('plan/addNewPictureAction', pictureId);
      }
    };

    request.send(formData);
  }
}

function b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

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

function imagetoblob(base64String: string) {
  const ImageURL = base64String;
  // Split the base64 string in data and contentType
  const block = ImageURL.split(';');
  // Get the content type of the image
  const contentType = block[0].split(':')[1]; // In this case "image/gif"
  // get the real base64 content of the file
  const realData = block[1].split(',')[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

  // Convert it to a blob to upload
  return b64toBlob(realData, contentType);
}
</script>
