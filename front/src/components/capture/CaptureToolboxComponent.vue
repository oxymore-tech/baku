<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer captureContainer">
    <h3>mode capture</h3>
    <select @change="onCaptureDeviceChange($event)">
      <option value="smartphone" :selected="selectedDevice === 'smartphone'">Smartphone</option>
      <option
        v-for="device in devices"
        v-bind:key="device.deviceId"
        :value="device.deviceId"
        :selected="selectedDevice === device.deviceId"
      >{{device.label}}</option>
    </select>
    <QrGenerator v-if="selectedDevice === 'smartphone'" />
    <WebcamCaptureComponent v-else :deviceId="selectedDevice"/>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import QrGenerator from "@/components/QrGenerator.vue";
import WebcamCaptureComponent from "@/components/capture/WebcamCaptureComponent.vue";

@Component({
  components: {
    QrGenerator,
    WebcamCaptureComponent
  }
})
export default class CaptureToolboxComponent extends Vue {
  devices: MediaDeviceInfo[] = [];
  selectedDevice = "smartphone";
  mounted() {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      this.devices = devices.filter(
        (input: MediaDeviceInfo) => input.kind === "videoinput"
      );
    });
  }

  onCaptureDeviceChange(event: any) {
    this.selectedDevice = event.target.value;
  }
}
</script>

<style lang="scss">
.captureContainer {
  width: 290px;
  height: 450px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: center;

  h3 {
    font-size: 23px;
    font-weight: bold;
  }
}
</style>