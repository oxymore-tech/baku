<template>
  <div class="box-container">
    <div class="settings-header">
      <h4>Prise de vue</h4>
    </div>

    <b-field>
      <b-icon icon="video" size="is-large" />
      <b-select
        @input="onCaptureDeviceChange()"
        placeholder="Sélectionner une caméra"
        :loading="!devices.length"
        v-model="selectedDeviceId"
        size="is-small"
      >
        <option v-for="device in devices" :key="device.id" :value="device.id">{{device.label}}</option>
      </b-select>
    </b-field>

    <div class="field">
      <b-switch :value="scaleY == -1"
         type="is-info"
         @input="toggleScaleY">
        Miroir horizontal
      </b-switch>
    </div>
    <div class="field">
      <b-switch :value="scaleX != 1"
         type="is-info"
         @input="toggleScaleX">
        Miroir vertical
      </b-switch>
    </div>

    <div class="field">
      <b-switch
         :value="onionSkin > 0"
         type="is-info"
         @input="switchOnionSkin($event)"
         >
        <b-field>
          <div>Pelure d'oignon</div>
        </b-field>
      </b-switch>
      <b-numberinput
        v-if="onionSkin > 0"
        :value="onionSkin"
        @input="setOnionSkin($event)"
        size="is-small"
        type="light"
        controls-position="compact"
        min="1" max="5">
      </b-numberinput>
    </div>

  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import SmartphoneSynchroPopupComponent from '@/components/smartphone/SmartphoneSynchroPopupComponent.vue';
import { Device } from '@/utils/device.class';

const CaptureNS = namespace('capture');
const WebRTCNS = namespace('webrtc');

@Component({
  components: {
    SmartphoneSynchroPopupComponent,
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

  @CaptureNS.Action('setOnionSkin')
  protected setOnionSkin!: (val: number) => Promise<void>;

  @CaptureNS.State('scaleX')
  protected scaleX!: number;

  @CaptureNS.State('scaleY')
  protected scaleY!: number;

  @CaptureNS.State('onionSkin')
  protected onionSkin!: number;

  @WebRTCNS.Action('resetState')
  private resetRTC!: () => Promise<void>;

  public async mounted() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
    } catch (e) {
      console.info(e);
    }
    const devices = (await navigator.mediaDevices.enumerateDevices()) || [];
    const videoDevices = devices
      .filter(
        (input: MediaDeviceInfo) => input.kind === 'videoinput' && input.deviceId !== '',
      )
      .map(
        (input: MediaDeviceInfo, idx: number) => new Device(input.deviceId, input.label || `Caméra ${idx + 1}`),
      );
    const deviceIds = [...new Set(videoDevices.map((d) => d.id))];
    this.devices = deviceIds.map((id) => videoDevices.find((d) => d.id === id) as Device) || [];
    this.devices.push(new Device('smartphone', 'Smartphone'));
    this.selectedDeviceId = this.devices[0].id ?? undefined;
    this.selectDeviceAction(this.devices[0] ?? null);
  }

  public onCaptureDeviceChange() {
    this.selectedDevice = this.devices.find((d) => d.id === this.selectedDeviceId) || null;
    this.selectDeviceAction(this.selectedDevice);
    if (this.selectedDevice && this.selectedDevice.id === 'smartphone') {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopupComponent,
        hasModalCard: true,
      });
    }
    if (this.selectedDevice && !this.selectedDevice.isSmartphone()) {
      this.resetRTC();
    }
  }

  public verticalMirror() {
    this.toggleScaleX();
  }

  public horizontalMirror() {
    this.toggleScaleY();
  }
  
  public switchOnionSkin(isOn: boolean) {
    if (isOn) {
      this.setOnionSkin(1)
    } else {
      this.setOnionSkin(0)
    }
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
  margin-bottom: 10px;

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
  width:100%;
  i {
    font-size: 20px;
    color: #707070;
    margin: 3px 5px 3px 0px;
  }
}

.mirror-checkboxes {
  margin-right: 5px;
}

span.select {
  margin-top: 10px;
}

div.control select {
  float: right;
  width: 215px;
}

.b-numberinput {
  float: right;
  width: 215px;
  margin-left: 10px;
  width: 75px;
}
</style>
