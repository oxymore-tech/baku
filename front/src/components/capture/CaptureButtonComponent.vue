<template>
  <div class="webcamCapture">
    <div
      id="captureButton"
      class="captureButton"
      @click="capture()"
      :class="{ capturing: isCapturing, hidden: !mediaOk }"
    >
      <img
        alt="camera"
        class="captureIcon"
        src="@/assets/camera-solid-orange.svg"
      />
    </div>
  </div>
</template>

<style lang="scss">
.captureButton {
  width: 144px;
  height: 82px;
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

.captureIcon {
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
          this.onCaptured(data.message, undefined, ''); //TODO when captured by smartphone, do we have b64 to add ?
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
    await this.$store.commit('capture/attachMediaStream', this.smartphoneStream);
  }

  private async setupWebCam() {
    this.mediaOk = true;
    console.log(this.device);
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
      'videoCapture',
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

  private async onCaptured(id: string, thumb: Blob, b64: string) {
    this.$emit('captured', id, thumb, b64);
    this.isCapturing = false;
  }
}
</script>
