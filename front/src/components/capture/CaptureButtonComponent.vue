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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from "vuex-class";
import { Device } from "@/api/device.class";
import { BakuService, BakuAction } from "../../api/baku-service";
import { FilmService } from "../../api/film-service";

@Component
export default class CaptureButtonComponent extends Vue {
  @Prop(Device)
  public readonly device!: Device;

  @Prop()
  public projectId!: string;

  @Prop()
  public activePlan!: string;

  @Prop()
  public activeIndex!: number;

  @State
  public dataChannel!: RTCDataChannel;

  public isCapturing = false;
  public peerConnected = false;

  public async mounted() {
    console.log("WebcamCapture mounted", this.device);
    this.onDeviceIdChanged();
  }

  public beforeDestroy() {
    // Removing tracks to stop using camera
    // @see: https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en#stop-ended-and-active
    this.$store.commit("capture/detachMediaStream");

    if (this.$store.state.peerConnection) {
      this.$store.state.peerConnection.close();
      this.$store.commit("setPeerConnection", undefined);
      this.$store.commit("setDataChannel", undefined);
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

  @Watch("device")
  public onDeviceIdChanged() {
    this.isCapturing = false;
    console.log("this.device.isSmartphone()", this.device.isSmartphone());
    if (!this.device.isSmartphone()) {
      this.setupWebCam();
    } else {
      const peerConnected = !!this.$store.state.dataChannel;
      if (peerConnected) {
        this.setupSmarphone();
      } else {
        this.peerConnected = false;
        this.$store.commit("capture/detachMediaStream");
      }
    }
  }

  @Watch("dataChannel")
  public onDataChannelChanged() {
    console.log("onDataChannelChanged", this.dataChannel);
    this.peerConnected = !!this.dataChannel;
    if (this.dataChannel) {
      this.setChannelEvents(this.dataChannel);
    }
    if (this.device.isSmartphone()) {
      this.setupSmarphone();
    }
  }

  private setChannelEvents(channel: RTCDataChannel) {
    channel.onmessage = event => {
      // TODO: Try to understand why you need TWO json parse
      const data = JSON.parse(JSON.parse(event.data));
      if (data.type === "upload") {
        this.isCapturing = false;
        const pictureId = data.message;
        this.$store.dispatch("project/addImageToPlan", {
          planId: this.activePlan,
          imageIndex: this.activeIndex,
          image: pictureId
        });
      }
      console.log("Message received", event);
    };

    channel.onerror = e => {
      console.error("channel.onerror", JSON.stringify(e, null, "\t"));
    };

    channel.onclose = e => {
      console.warn("channel.onclose", JSON.stringify(e, null, "\t"));
    };
  }

  private setupSmarphone() {
    const stream = this.$store.state.stream;
    this.$store.commit("capture/attachMediaStream", stream);
  }

  private async setupWebCam() {
    this.peerConnected = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 640, ideal: 1280 },
        height: { min: 480, ideal: 720 },
        deviceId: { exact: this.device.id }
      }
    });
    this.$store.commit('capture/attachMediaStream', stream);
  }

  private captureSmartphone() {
    this.dataChannel.send(
      JSON.stringify({
        message: 'capture',
        projectId: this.projectId,
        plan: this.activePlan,
        type: 'cmd'
      })
    );
  }

  private async captureWebcam() {
    const pictureId = await this.device.capture(
      'videoCapture',
      this.projectId,
      this.activePlan
    );
    this.$store.dispatch('project/addImageToPlan', {
      planId: this.activePlan,
      imageIndex: this.activeIndex,
      image: pictureId
    });
    this.isCapturing = false;
  }
}
</script>
