<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer captureContainer" v-bind:class="{captureInactive: !activeCapture}">
    <h3 @click="toggleCapture()">mode capture</h3>
    <div v-if="activeCapture">
      <b-field>
        <b-select
          @input="onCaptureDeviceChange()"
          placeholder="Select a Camera"
          :loading="!devices.length"
          v-model="selectedDeviceId"
          size="is-small"
        >
          <option v-for="device in devices" :key="device.id" :value="device.id">{{device.label}}</option>
        </b-select>
      </b-field>
      <CaptureButtonComponent v-if="selectedDevice" :device="selectedDevice" />
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import SmartphoneSynchroPopup from '@/components/SmartphoneSynchroPopup.vue';
import CaptureButtonComponent from '@/components/capture/CaptureButtonComponent.vue';
import { mapState } from 'vuex';
import store from '@/store';
import { Device } from '@/api/device.class';

@Component({
  components: {
    SmartphoneSynchroPopup,
    CaptureButtonComponent,
  },
  computed: {
    ...mapState('capture', ['activeCapture']),
  },
  store,
})
export default class CaptureToolboxComponent extends Vue {
  public devices: Device[] = [];
  public selectedDeviceId: string | null = null;
  public selectedDevice: Device | null = null;
  public async  mounted() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.devices = devices
      .filter((input: MediaDeviceInfo) => input.kind === 'videoinput')
      .map((input: MediaDeviceInfo) => (new Device(input.deviceId, input.label)));
    this.devices.push(new Device('smartphone', 'Smartphone'));
  }

  public onCaptureDeviceChange() {
    this.selectedDevice = this.devices.find((d) => d.id === this.selectedDeviceId) || null;

    if (this.selectedDevice && this.selectedDevice.isSmartphone() && !this.$store.state.dataChannel) {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopup,
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