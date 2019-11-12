<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer captureContainer" v-bind:class="{captureInactive: !activeCapture}">
    <h3 @click="toggleCapture()">mode capture</h3>
    <div v-if="activeCapture">
      <b-field>
        <b-select
          @input="onCaptureDeviceChange(selectedDevice)"
          placeholder="Select a Camera"
          :loading="!devices.length"
          v-model="selectedDevice"
          size="is-small"
        >
          <option v-for="device in devices" :key="device.key" :value="device.key">{{device.label}}</option>
        </b-select>
      </b-field>
      <!-- <QrGenerator v-if="selectedDevice === 'smartphone'" /> -->
      <WebcamCaptureComponent v-if="selectedDevice" :deviceId="selectedDevice" />
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import QrGenerator from '@/components/QrGenerator.vue';
import WebcamCaptureComponent from '@/components/capture/WebcamCaptureComponent.vue';
import { mapState } from 'vuex';
import store from '@/store';

interface Devices {
  label: string;
  key: string;
}

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
  public devices: Devices[] = [];
  public selectedDevice: string = '';
  public async  mounted() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.devices = devices
      .filter((input: MediaDeviceInfo) => input.kind === 'videoinput')
      .map((input: MediaDeviceInfo) => ({ key: input.deviceId, label: input.label }));
    this.devices.push({ key: 'smartphone', label: 'Smartphone' });
  }

  public onCaptureDeviceChange() {
    if (this.selectedDevice === 'smartphone' && !this.$store.state.dataChannel) {
      this.$buefy.modal.open({
        parent: this,
        component: QrGenerator,
        hasModalCard: true,
      });
    }
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