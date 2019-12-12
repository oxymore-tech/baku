<template>
  <div class="mainFrame">
    <template>
      <div class="previewBloc">
        <StoryboardPreviewComponent :shots="movie.shots" :activeShotId="activeShotId" />
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
              alt="previewImg"
              id="previewImg"
              :src="`data:image/jpeg;base64,${imgCacheService.getImage(getActiveShot.images[activeFrame])}`"
            />
          </div>
        </div>
        <CaptureToolboxComponent
          v-if="getActiveShot"
          :projectId="id"
          :activeShot="getActiveShot.id"
          :activeIndex="activeFrame + 1"
          @moveactiveframe="moveActiveFrame"
        />
      </div>
      <div>
        <i class="icon-play baku-button" style="color:#FBB10D;" @click="playAnimation()"></i>
        <i class="icon-pause baku-button" @click="pauseAnimation()"></i>
      </div>
      <CarrouselComponent
        v-if="getActiveShot"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
        :imgCacheService="imgCacheService"
        @moveactiveframe="moveActiveFrame"
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
import { Movie, Shot } from '@/api/movie.service';
import Project from './Project.vue';
import { ImgCacheService } from '@/api/imgCache.service';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    StoryboardPreviewComponent,
  },
  store,
})
export default class Capture extends Project {

 @ProjectNS.State
  public id!: string;

  @ProjectNS.State
  public activeShotId!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  public activeFrame: number = 0;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  public animationFrame!: number;

  public animationLastUpdate!: number;

  public isPlaying = false;

  public imgCacheService = new ImgCacheService();

  public mounted() {
    this.$store.dispatch('project/changeActiveShot', this.$route.params.shotId);
  }

  public async created() {
    this.activeFrame = this.getActiveShot && this.getActiveShot.images.length === 0 ? -1 : 0;
  }

  public playAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animationFrame = requestAnimationFrame(this.animate);
      // this.loop = setInterval(() => this.animate(), 1000 / this.movie.fps);
    }
  }

  public animate(timestamp: number) {
    if (!this.animationLastUpdate) {
      this.animationLastUpdate = timestamp;
    }

    const timeFromLastUpdate = timestamp - this.animationLastUpdate;
    if (timeFromLastUpdate > 1000 / this.movie.fps) {
      this.animationLastUpdate = timestamp;
      if (this.activeFrame === this.getActiveShot.images.length - 1) {
        this.activeFrame = 0;
      } else {
        this.activeFrame++;
      }
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  }

  public pauseAnimation() {
    cancelAnimationFrame(this.animationFrame);
    // clearInterval(this.loop);
    this.isPlaying = false;
  }

  @Watch('stream')
  public onStreamChange(newValue: MediaStream, _oldValue: MediaStream) {
    if (newValue) {
      (document.getElementById(
        'videoCapture',
      ) as HTMLVideoElement).srcObject = newValue;
    }
  }

  @Watch('getActiveShot')
  public async onActiveShotChange(newValue: string) {
    if (newValue) {
      this.imgCacheService.updateInfos(
        // TODO: Remove ImageRef type, it's useless (string alias), but breaks every native function that awaits string
        this.getActiveShot.images  as unknown as string[],
        this.id,
        this.activeFrame,
      );
      this.imgCacheService.startPreloading();
    }
  }

  public moveActiveFrame(event: number) {
    const tmp = this.activeFrame + event;
    const minFrame = this.activeCapture ? -1 : 0;
    this.activeFrame = Math.max(
      minFrame,
      Math.min(this.getActiveShot.images.length - 1, tmp),
    );
  }
}
</script>

<style lang="scss" scoped>
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
