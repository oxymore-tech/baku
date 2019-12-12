<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="webcamCapture">
    <div
      id="captureButton"
      class="captureButton"
      @click="capture()"
      v-bind:class="{ capturing: isCapturing, hidden: !peerConnected }"
    >
      <img class="captureIcon" src="@/assets/camera-solid-orange.svg"/>
    </div>
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

  .captureIcon {
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

    @Prop()
    public activeShot!: string;

    @Prop()
    public activeIndex!: number;

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

    public async capture() {
      this.isCapturing = true;
      if (this.device.isSmartphone()) {
        await this.captureSmartphone();
      } else {
        await this.captureWebcam();
      }
      this.$emit('moveactiveframe', 1);
    }

    @Watch('device')
    public onDeviceIdChanged() {
      this.isCapturing = false;
      console.log('this.device.isSmartphone()', this.device.isSmartphone());
      if (!this.device.isSmartphone()) {
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
      if (this.device.isSmartphone()) {
        this.setupSmarphone();
      }
    }

    private setChannelEvents(channel: RTCDataChannel) {
      // eslint-disable-next-line no-param-reassign
      channel.onmessage = (event) => {
        // TODO: Try to understand why you need TWO json parse
        const data = JSON.parse(JSON.parse(event.data));
        if (data.type === 'upload') {
          this.isCapturing = false;
          const pictureId = data.message;
          this.$store.dispatch('project/addImageToShot', {
            shotId: this.activeShot,
            imageIndex: this.activeIndex,
            image: pictureId,
          });
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

    private setupSmarphone() {
      const { stream } = this.$store.state;
      this.$store.commit('capture/attachMediaStream', stream);
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
      this.$store.commit('capture/attachMediaStream', stream);
    }

    private captureSmartphone() {
      this.dataChannel.send(
        JSON.stringify({
          message: 'capture',
          projectId: this.projectId,
          shot: this.activeShot,
          type: 'cmd',
        }),
      );
    }

    private async captureWebcam() {
      const pictureId = await this.device.capture(
        'videoCapture',
        this.projectId,
        this.activeShot,
      );
      await this.$store.dispatch('project/addImageToShot', {
        shotId: this.activeShot,
        imageIndex: this.activeIndex,
        image: pictureId,
      });
      this.isCapturing = false;
    }
}
</script>
