<template>
  <div class="box-container">
    <div class="settings-header">
      <h4>Prise de vue</h4>
    </div>

    <b-field>
      <b-select
        icon="video"
        :disabled="!isCapturing"
        :loading="!devices.length"
        @input="onCaptureDeviceChange()"
        v-model="selectedDeviceId"
        placeholder="Sélectionner une caméra"
      >
        <option v-for="device in devices" :key="device.id" :value="device.id">{{device.label}}</option>
      </b-select>
    </b-field>

    <div class="field">
      <b-switch
        :disabled="!isCapturing"
        :value="scaleY == -1"
        @input="toggleScaleY"
      >Miroir horizontal</b-switch>
    </div>
    <div class="field">
      <b-switch :disabled="!isCapturing" :value="scaleX != 1" @input="toggleScaleX">Miroir vertical</b-switch>
    </div>

    <div class="field">
      <b-switch
        :disabled="!isCapturing"
        :value="onionSkinDisplay"
        @input="setOnionSkinDisplay($event)"
      >
        <b-field>
          <div>Pelure d'oignon</div>
        </b-field>
      </b-switch>
      <b-numberinput
        v-if="onionSkinDisplay"
        type="light"
        :disabled="!isCapturing"
        :value="onionSkinValue"
        @input="setOnionSkinValue($event)"
        size="is-small"
        controls-position="compact"
        editable="false"
        min="1"
        max="5"
      ></b-numberinput>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import SmartphoneSynchroPopupComponent from "@/components/smartphone/SmartphoneSynchroPopupComponent.vue";
import { Device } from "@/utils/device.class";

const CaptureNS = namespace("capture");
const WebRTCNS = namespace("webrtc");

@Component({
  components: {
    SmartphoneSynchroPopupComponent
  }
})
export default class CaptureToolboxComponent extends Vue {
  public devices: Device[] = [];

  public selectedDeviceId: string | null = null;

  public selectedDevice: Device | null = null;

  @Prop()
  public isCapturing: boolean = false;

  @CaptureNS.State("activeDevice")
  protected activeDevice!: Device | null;

  @CaptureNS.Action("selectDevice")
  protected selectDeviceAction!: (device: Device | null) => Promise<void>;

  @CaptureNS.Action("toggleScaleX")
  protected toggleScaleX!: () => Promise<void>;

  @CaptureNS.Action("toggleScaleY")
  protected toggleScaleY!: () => Promise<void>;

  @CaptureNS.Action("setOnionSkinDisplay")
  protected setOnionSkinDisplay!: (val: boolean) => Promise<void>;

  @CaptureNS.Action("setOnionSkinValue")
  protected setOnionSkinValue!: (val: number) => Promise<void>;

  @CaptureNS.State("scaleX")
  protected scaleX!: number;

  @CaptureNS.State("scaleY")
  protected scaleY!: number;

  @CaptureNS.State("onionSkinDisplay")
  protected onionSkinDisplay!: number;

  @CaptureNS.State("onionSkinValue")
  protected onionSkinValue!: number;

  @WebRTCNS.Action("resetState")
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
        (input: MediaDeviceInfo) =>
          input.kind === "videoinput" && input.deviceId !== ""
      )
      .map(
        (input: MediaDeviceInfo, idx: number) =>
          new Device(input.deviceId, input.label || `Caméra ${idx + 1}`)
      );
    const deviceIds = [...new Set(videoDevices.map(d => d.id))];
    this.devices =
      deviceIds.map(id => videoDevices.find(d => d.id === id) as Device) || [];
    this.devices.push(new Device("smartphone", "Smartphone"));
    this.selectedDeviceId = this.devices[0].id ?? undefined;
    this.selectDeviceAction(this.devices[0] ?? null);
  }

  public onCaptureDeviceChange() {
    this.selectedDevice =
      this.devices.find(d => d.id === this.selectedDeviceId) || null;
    this.selectDeviceAction(this.selectedDevice);
    if (this.selectedDevice && this.selectedDevice.id === "smartphone") {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopupComponent,
        hasModalCard: true
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

  @Watch("activeDevice")
  onActiveDevice(device: Device) {
    if (device && device.id === "smartphone") {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopupComponent,
        hasModalCard: true
      });
    }
  }
}
</script>

<style lang="scss">
.box-container {
  width: 300px;
}

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
  i {
    font-size: 20px;
    color: #707070;
    margin: 3px 5px 3px 0px;
  }
}

.b-numberinput {
  float: right;
  width: 75px;
}
</style>
