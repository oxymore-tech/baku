<template>
  <div class="mainFrame">
    <div class="previewBloc">
      <ProjectPreviewComponent />
      <video
        v-if="activeCapture"
        id="videoCapture"
        width="720"
        height="480"
        autoplay
        muted
        playsinline
      />
      <img
        v-else
        id="previewImg"
        width="720"
        height="480"
        :src="`/default/images/${activePlan}/${getActiveFrame}?width=1280&height=720`"
      />
      <CaptureToolboxComponent />
    </div>
    <div>
      <button @click="playAnimation()">play</button>
      <button @click="pauseAnimation()">pause</button>
    </div>
    <CarrouselComponent />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import CaptureToolboxComponent from '@/components/capture/CaptureToolboxComponent.vue';
import CarrouselComponent from '@/components/capture/CarrouselComponent.vue';
import ProjectPreviewComponent from '@/components/capture/ProjectPreviewComponent.vue';
import store from '@/store';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    ProjectPreviewComponent,
  },
  store,
})
export default class Capture extends Vue {
  @CaptureNS.State
  public activeCapture!: boolean;

  @ProjectNS.State
  public activePlan!: string;

  @CaptureNS.State
  public stream!: MediaStream | null;

  @ProjectNS.Getter
  public getActiveFrame!: string;

  private isPlaying = false;

  private loop: any;

  public static mounted() {
  }

  public playAnimation() {
    this.isPlaying = true;
    console.log('this.isPlaying', this.isPlaying);
    this.loop = setInterval(() => this.$store.dispatch('project/goToNextFrameAction'), 1000 / 12);
  }

  public pauseAnimation() {
    clearInterval(this.loop);
  }

  @Watch('stream')
  public onStreamChange(newValue: MediaStream, oldValue: MediaStream) {
    console.log('onStreamChange');
    console.log(this);
    if (newValue) {
      (document.getElementById(
        'videoCapture',
      ) as HTMLVideoElement).srcObject = newValue;
    }
  }
}
</script>

<style lang="scss">
.mainFrame {
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
}

.previewBloc {
  display: flex;
  width: 100%;
  flex: 1;
  justify-content: space-around;
  padding: 10px 0;
}

#previewImg {
  min-width: 640px;
  min-height: 480px;
  max-height: 720px;
  background: white;
}

#videoCapture {
  max-height: 720px;
}
</style>
