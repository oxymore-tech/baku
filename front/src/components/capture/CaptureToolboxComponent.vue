<template>
  <b-dropdown
    position="is-top-left"
    :disabled="!isCapturing"
    :close-on-click="false"
    append-to-body
    aria-role="menu"
    trap-focus
  >
    <a class="navbar-item" slot="trigger" role="button" slot-scope="{ active }">
      <i class="icon-webcam"></i>
      <span class="item-title">Réglages vidéo</span>
      <b-icon :icon="active ? 'menu-down' : 'menu-up'"></b-icon>
    </a>
    <b-dropdown-item custom :focusable="false" class="box-container">
      <b-field>
        <b-select
          icon="video"
          :loading="!devices.length"
          @input="onCaptureDeviceChange()"
          v-model="selectedDeviceId"
          placeholder="Sélectionner une caméra"
        >
          <option v-for="device in devices" :key="device.id" :value="device.id">{{device.label}}</option>
        </b-select>
      </b-field>

      <div class="field">
        <b-switch :value="scaleY == -1" @input="toggleScaleY">Miroir horizontal</b-switch>
      </div>
      <div class="field">
        <b-switch :value="scaleX != 1" @input="toggleScaleX">Miroir vertical</b-switch>
      </div>

      <div class="field onionSkinInput">
        <b-switch :value="onionSkinDisplay" @input="setOnionSkinDisplay($event)">
          <b-field>
            <div>Pelure d'oignon</div>
          </b-field>
        </b-switch>
        <b-numberinput
          v-if="onionSkinDisplay"
          type="light"
          :value="onionSkinValue"
          @input="setOnionSkinValue($event)"
          size="is-small"
          controls-position="compact"
          min="1"
          max="5"
        ></b-numberinput>
      </div>

      <div class="field" style="display:inline-flex;">
        <b-select :value="fps" @input="changeFps({projectId: projectId, fps: $event})">
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="25">25</option>
        </b-select>
        <span class="control-label">Définir le nombre d'images par seconde</span>
      </div>
    </b-dropdown-item>
  </b-dropdown>
</template>


<script lang="ts">
import {
  Component, Vue, Watch, Prop,
} from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import SmartphoneSynchroPopupComponent from '@/components/smartphone/SmartphoneSynchroPopupComponent.vue';
import { Device } from '@/utils/device.class';

const CaptureNS = namespace('capture');
const WebRTCNS = namespace('webrtc');
const ProjectNS = namespace('project');

@Component({
  components: {
    SmartphoneSynchroPopupComponent,
  },
})
export default class CaptureToolboxComponent extends Vue {
  public devices: Device[] = [];

  public selectedDeviceId: string | null = null;

  public selectedDevice: Device | null = null;

  @Prop()
  public isCapturing!: boolean;

  @ProjectNS.State('id')
  public projectId!: string;

  @CaptureNS.State('activeDevice')
  protected activeDevice!: Device | null;

  @CaptureNS.Action('selectDevice')
  protected selectDeviceAction!: (device: Device | null) => Promise<void>;

  @CaptureNS.Action('toggleScaleX')
  protected toggleScaleX!: () => Promise<void>;

  @CaptureNS.Action('toggleScaleY')
  protected toggleScaleY!: () => Promise<void>;

  @CaptureNS.Action('detachMediaStream')
  public detachMediaStream!: () => void;

  @CaptureNS.Action('setOnionSkinDisplay')
  protected setOnionSkinDisplay!: (val: boolean) => Promise<void>;

  @CaptureNS.Action('setOnionSkinValue')
  protected setOnionSkinValue!: (val: number) => Promise<void>;

  @CaptureNS.State('scaleX')
  protected scaleX!: number;

  @CaptureNS.State('scaleY')
  protected scaleY!: number;

  @CaptureNS.State('onionSkinDisplay')
  protected onionSkinDisplay!: number;

  @CaptureNS.State('onionSkinValue')
  protected onionSkinValue!: number;

  @WebRTCNS.Action('resetState')
  private resetRTC!: () => Promise<void>;

  @WebRTCNS.State('isConnected')
  private isRTCConnected!: () => Promise<void>;

  @ProjectNS.Getter('getMovieFps')
  protected fps!: number;

  @ProjectNS.Action('changeFps')
  protected changeFps!: ({}) => Promise<void>;

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

  public async onCaptureDeviceChange() {
    this.selectedDevice = this.devices.find((d) => d.id == this.selectedDeviceId) || null;
    await this.detachMediaStream();
    if (this.selectedDevice && !this.selectedDevice.isSmartphone()) {
      await this.resetRTC();
    }
    this.selectDeviceAction(this.selectedDevice);
  }

  public verticalMirror() {
    this.toggleScaleX();
  }

  public horizontalMirror() {
    this.toggleScaleY();
  }

  @Watch('isRTCConnected')
  onRTCConnectedChange(status: boolean) {
    if (!status && this.selectedDevice && this.selectedDevice.isSmartphone()) {
      this.selectedDevice = null;
      this.selectedDeviceId = null;
      this.selectDeviceAction(null);
    }
  }

  @Watch('activeDevice')
  onActiveDevice(device: Device) {
    if (device && device.id === 'smartphone') {
      this.$buefy.modal.open({
        parent: this,
        component: SmartphoneSynchroPopupComponent,
        hasModalCard: true,
        canCancel: true,
        onCancel: () => {
          if (!this.isRTCConnected) {
            this.selectedDevice = null;
            this.selectedDeviceId = null;
            this.selectDeviceAction(null);
          }
        },
      });
    }
  }
}
</script>

<style lang="scss">

.dropdown-menu {
  width: 25rem;
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
    font-size: 2.8rem;
    font-weight: lighter;
  }

  i {
    font-size: 2.8rem;
    padding-right: 10px;
  }
}

.item-title {
  margin-left: 5px;
  font-size: 1.6rem;
}

.onionSkinInput {
  height: 27px;
  display: flex;
  align-items: center;

  .switch {
    float: left;
  }
  .b-numberinput {
    margin-left: 20px;
    // float: right;
    width: 75px;
  }
}

.field {
  font-size: 1.2rem;
  i {
    font-size: 2.0rem;
    color: #707070;
    margin: 3px 5px 3px 0px;
  }

  .control {
    margin-right: 5px;
  }
}
</style>
