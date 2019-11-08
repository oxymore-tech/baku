<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer captureContainer" v-bind:class="{captureInactive: !activeCapture}">
    <h3 @click="toggleCapture()">mode capture</h3>
    <div v-if="activeCapture">
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
      <WebcamCaptureComponent v-else :deviceId="selectedDevice" />
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import QrGenerator from '@/components/QrGenerator.vue';
import WebcamCaptureComponent from '@/components/capture/WebcamCaptureComponent.vue';
import { mapState } from 'vuex';
import store from '@/store';

@Component({
  components: {
    QrGenerator,
    WebcamCaptureComponent,
  },
  computed: {
    ...mapState('capture', ['activeCapture']),
  },
  store,
})
export default class CaptureToolboxComponent extends Vue {
  public devices: MediaDeviceInfo[] = [];
  public selectedDevice = 'smartphone';
  public mounted() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      this.devices = devices.filter(
        (input: MediaDeviceInfo) => input.kind === 'videoinput',
      );
    });
  }

  public onCaptureDeviceChange(event: any) {
    this.selectedDevice = event.target.value;
  }

  public toggleCapture() {
    this.$store.commit('capture/toggleCapture');
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
    cursor: pointer;
  }
}

.captureInactive {
  height: 45px;
}
</style>