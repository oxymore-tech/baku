<template>
  <div class="mainFrame">
    <ShotsStack
      v-if="displayShotsStack"
      :projectId="id"
      :shots="movie.shots"
      :activeShotId="getActiveShotId"
      v-on:closestack="displayShotsStack=false"
    />
    <template v-else>
      <div class="previewBloc">
        <StoryboardPreviewComponent
          :shots="movie.shots"
          :activeShotId="getActiveShotId"
          :displayShotsStack="displayShotsStack"
          v-on:changedisplayshotsstack="displayShotsStack = true"
        />
        <video
          v-if="activeCapture"
          id="videoCapture"
          width="720"
          height="480"
          autoplay
          muted
          playsinline
        />
        <div v-else>
          <div class="previewContainer">
            <img
              v-if="getActiveShot && getActiveShot.images[activeFrame]"
              id="previewImg"
              :src="`/${id}/images/${getActiveShot.id}/${getActiveShot.images[activeFrame]}?width=1280&height=720`"
            />
          </div>
        </div>
        <CaptureToolboxComponent
          v-if="getActiveShot"
          :projectId="id"
          :activeShot="getActiveShot.id"
          :activeIndex="getActiveShot.images.length"
        />
      </div>
      <div>
        <button @click="playAnimation()">play</button>
        <button @click="pauseAnimation()">pause</button>
      </div>
      <CarrouselComponent
        v-if="getActiveShot"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Watch } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import CaptureToolboxComponent from '@/components/capture/CaptureToolboxComponent.vue';
import CarrouselComponent from '@/components/capture/CarrouselComponent.vue';
import store from '@/store';
import StoryboardPreviewComponent from '@/components/capture/StoryboardPreviewComponent.vue';
import ShotsStack from '@/components/ShotsStack.vue';
import { Movie, Shot } from '@/api/movie.service';
import Project from './Project.vue';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    StoryboardPreviewComponent,
    ShotsStack,
  },
  store,
})
export default class Capture extends Project {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public getActiveShotId!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  @ProjectNS.State
  public activeFrame!: number;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  public isPlaying = false;

  public displayShotsStack = false;

  private loop: any;

  public mounted() { }

  public playAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.loop = setInterval(() => {
        this.$store.dispatch('project/goToNextFrameAction');
      }, 1000 / 12);
    }
  }

  public pauseAnimation() {
    clearInterval(this.loop);
    this.isPlaying = false;
  }

  @Watch('stream')
  public onStreamChange(newValue: MediaStream, _oldValue: MediaStream) {
    console.log('onStreamChange');
    if (newValue) {
      (document.getElementById(
        'videoCapture',
      ) as HTMLVideoElement).srcObject = newValue;
    }
  }

  public onActiveShotSelected(shot: Shot) {
    console.log('shot selected', shot);
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
  height: 100%;
  max-width: 100%;
  background: white;
}

.previewContainer {
  width: 1100px;
  height: 619px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 4px solid #455054;
  border-radius: 4px;
  box-sizing: content-box;
}

#videoCapture {
  max-height: 720px;
}
</style>
