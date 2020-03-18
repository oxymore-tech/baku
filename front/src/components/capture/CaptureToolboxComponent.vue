<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="boxContainer">
    <div class="settings-header">
      <i class="icon-cog baku-button" />
      <h4>Réglages</h4>
    </div>

    <b-field>
      <i class="icon-webcam"/>
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

    <div @click="toggleScaleY()">
      <i class="icon-check_box baku-button mirror-checkboxes" v-if="scaleY < 0"/>
      <i class="icon-check_box_outline_blank baku-button mirror-checkboxes" v-else/>
      Miroir horizontal
    </div>

    <div @click="toggleScaleX()">
      <i class="icon-check_box baku-button mirror-checkboxes"  v-if="scaleX < 0"/>
      <i class="icon-check_box_outline_blank baku-button mirror-checkboxes" v-else/>
      Miroir vertical
    </div>
  </div>
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

  @CaptureNS.Action('selectDevice')
  protected selectDeviceAction!: (device: Device | null) => Promise<void>;

  @CaptureNS.Action('toggleScaleX')
  protected toggleScaleX!: () => Promise<void>;

  @CaptureNS.Action('toggleScaleY')
  protected toggleScaleY!: () => Promise<void>;

  @CaptureNS.State('scaleX')
  protected scaleX!: number;

  @CaptureNS.State('scaleY')
  protected scaleY!: number;

  public async mounted() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
      .filter((input: MediaDeviceInfo) => input.kind === 'videoinput')
      .map(
        (input: MediaDeviceInfo) => new Device(input.deviceId, input.label || 'Caméra non reconnue'),
      );
    const deviceIds = [...new Set(videoDevices.map((d) => d.id))];
    this.devices = deviceIds.map(
      (id) => videoDevices.find((d) => d.id === id) as Device,
    );
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

  public verticalMirror() {
    this.toggleScaleX();
  }

  public horizontalMirror() {
    this.toggleScaleY();
  }
}
</script>

<style lang="scss">
.collapse-content {
  background-color: white;
  padding: 6px;
}

.settings-header {
  display: inline-flex;
  align-items: center;
  width: 100%;

  h4 {
    font-size: 28px;
    font-weight: lighter;
  }

  i {
    font-size: 28px;
    padding-right: 10px;
  }
}

.field {
  i {
    font-size: 20px;
    color: #707070;
    margin: 3px 5px 3px 0px
  }
}

.mirror-checkboxes {
  margin-right: 5px;
}
</style>
