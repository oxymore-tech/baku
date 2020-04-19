<template>
  <div class="box-container storyboard-preview-container">
    <div class="storyboard-preview-header" @click="onDisplayShots()">
      <i class="icon-grid baku-button" />
      <h4 class="baku-button">Plans</h4>
    </div>
    <img class="shot-preview" alt="preview" ref="preview" :src="getActiveShot && getActiveShot.images[0].preloadedUrl" />
  </div>
</template>

<script lang="ts">
import {
  Component, Vue
} from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/api/movie.service';

const ProjectNS = namespace('project');
const CaptureNS = namespace('capture');
const WebRTCNS = namespace('webrtc');

@Component
export default class StoryboardPreviewComponent extends Vue {

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  @ProjectNS.State
  public id!: string;

  @CaptureNS.Action('resetState')
  private resetCapture!: () => Promise<void>;

  @WebRTCNS.Action('resetState')
  private resetRTC!: () => Promise<void>;

  public onDisplayShots() {
    this.resetCapture();
    this.resetRTC();
    this.$router.push({
      name: 'captureShots',
      params: {
        projectId: this.id,
      },
    });
  }

  // Rebase TODO fix  display new image in shots preview
  // @Watch('getActiveShotImgCount')
  // public async onActiveShotImgCountChange(nb: number) {
  //   if (nb) {
  //     this.imageReady(this.activeShot.images[0].id);
  //   }
  // }

}
</script>

<style lang="scss">
.storyboard-preview-container {
  max-width: 292px;

  .storyboard-preview-header {
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
}

.shot-preview {
  width: 292px;
  height: 164px;
}
</style>
