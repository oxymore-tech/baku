<template>
  <div class="webcamCapture">
    <div
      id="captureButton"
      class="captureButton"
      @click="capture()"
      :class="{ capturing: isCapturing, hidden: !peerConnected }"
    >
      <img alt="camera" class="captureIcon" src="@/assets/camera-solid-orange.svg"/>
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
import { State } from 'vuex-class';
import { Device } from '@/api/device.class';

  @Component
export default class CaptureButtonComponent extends Vue {
    @Prop(Device)
    public readonly device!: Device;

    @Prop()
    public projectId!: string;

    @State
    public dataChannel!: RTCDataChannel;

    public isCapturing = false;

    public peerConnected = false;

    public async mounted() {
      console.log('WebcamCapture mounted', this.device);
      this.onDeviceIdChanged();
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
      console.log('this.device.isSmartphone()', this.device.isSmartphone());
      if (!this.device.isSmartphone()) {
        this.setupWebCam();
      } else {
        const peerConnected = !!this.dataChannel;
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
      if (this.device.isSmartphone()) {
        this.setupSmarphone();
      }
    }

    private setChannelEvents(channel: RTCDataChannel) {
      channel.onmessage = (event) => {
        // TODO: Try to understand why you need TWO json parse
        const data = JSON.parse(JSON.parse(event.data));
        switch (data.type) {
          case 'capture':
            this.onCaptured(data.id, data.thumb);
            break;
          case 'upload':
            this.onUploaded(data.id);
            break;
          default:
            console.log(`Unknown message \'${data.type}\' (ignored)`);
        }
        console.log('Message received', event);
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
      const { stream } = this.$store.state;
      await this.$store.commit('capture/attachMediaStream', stream);
    }

    private async setupWebCam() {
      this.peerConnected = true;
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
        }),
      );
    }

    private captureWebcam() {
      this.device.capture(
        'videoCapture',
        this.projectId,
        this.onCaptured,
        this.onUploaded,
        (e) => console.log('Error during webcam capture', e),
      );
    }

    private onUploaded(id: string) {
      this.$emit('uploaded', id);
    }

    private async onCaptured(id: string, thumb: Blob) {
      this.$emit('captured', id, thumb);
      this.isCapturing = false;
    }
}
</script>
