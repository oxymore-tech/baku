<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <b-collapse
    aria-id="contentIdForA11y2"
    class="panel"
    :open="activeCapture"
    @open="setActiveCapture(true)"
    @close="setActiveCapture(false)"
  >
    <div
      slot="trigger"
      class="panel-heading"
      role="button"
      aria-controls="contentIdForA11y2"
    >
      <strong>mode capture</strong>
    </div>

    <b-field>
      <b-select
        @input="onCaptureDeviceChange()"
        placeholder="Select a Camera"
        :loading="!devices.length"
        v-model="selectedDeviceId"
        size="is-small"
      >
        <option
          v-for="device in devices"
          :key="device.id"
          :value="device.id"
        >{{device.label}}</option>
      </b-select>
    </b-field>
  </b-collapse>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import SmartphoneSynchroPopup from '@/components/SmartphoneSynchroPopup.vue';
import CaptureButtonComponent from '@/components/capture/CaptureButtonComponent.vue';
import { Device } from '@/api/device.class';

const CaptureNS = namespace('capture');

@Component({
  components: {
    SmartphoneSynchroPopup,
    CaptureButtonComponent,
  },
})
export default class CaptureToolboxComponent extends Vue {
  public devices: Device[] = [];

  public selectedDeviceId: string | null = null;

  public selectedDevice: Device | null = null;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.Action('selectDevice')
  protected selectDeviceAction!: (device: Device | null) => Promise<void>;

  public async mounted() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((input: MediaDeviceInfo) => input.kind === 'videoinput')
      .map((input: MediaDeviceInfo) => (new Device(input.deviceId, input.label || 'Caméra non reconnue')));
    const deviceIds = [...new Set(videoDevices.map((d) => d.id))];
    this.devices = deviceIds
      .map((id) => videoDevices.find((d) => d.id === id) as Device);
    this.devices.push(new Device('smartphone', 'Smartphone'));
  }

  public onCaptureDeviceChange() {
    this.selectedDevice = this.devices.find((d) => d.id === this.selectedDeviceId) || null;
    this.selectDeviceAction(this.selectedDevice);

    if (
      this.selectedDevice
      && this.selectedDevice.isSmartphone()
      && !this.$store.state.dataChannel
    ) {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopup,
        hasModalCard: true,
      });
    }
  }

  public setActiveCapture(isActiveCapture: boolean) {
    this.$store.dispatch('capture/setActiveCapture', isActiveCapture);
  }
}
</script>

<style lang="scss">
.collapse-content {
  background-color: white;
  padding: 6px;
}
</style>
