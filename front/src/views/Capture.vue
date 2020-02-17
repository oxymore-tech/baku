<template>
  <div class="mainFrame">
    <template>
      <div class="previewBloc">
        <StoryboardPreviewComponent :shots="movie.shots" :activeShotId="activeShotId" />
        <div class="previewContainer">
          <div class="previewContent">
            <video
              v-if="activeCapture"
              id="videoCapture"
              width="640"
              height="480"
              autoplay
              muted
              playsinline
            />
            <template v-else>
              <img
                v-if="getActiveShot && getActiveShot.images[activeFrame]"
                alt="previewImg"
                id="previewImg"
                :src="ImageCacheService.getImage(getActiveShot.images[activeFrame].id)"
              />
            </template>
            <img
              v-if="getActiveShot && getActiveShot.images[activeFrame] && activeCapture"
              alt="ghostImg"
              id="ghostImg"
              :src="ImageCacheService.getImage(getActiveShot.images[activeFrame].id)"
            />
          </div>
          <ImagesSelectorComponent
            id="image-selector"
            class="image-selector"
            v-if="getActiveShot"
            :projectId="id"
            :activeShot="getActiveShot.id"
            :images="getActiveShot.images"
            :activeImage="activeFrame"
            :activeCapture="activeCapture"
            ref='imageSelector'
            @moveactiveframe="moveActiveFrame"
          />
          <div class="mediaControls">
            <div class="clock">
              <span id='hours'>{{ nbHours(this.activeFrame) }}</span>
              <span class="clock-small">:</span>
              <span id='minutes'>{{ nbMins(this.activeFrame) }}</span>
              <span class="clock-small">:</span>
              <span id='seconds'>{{ nbSecs(this.activeFrame) }}</span>
              <span class="clock-small">:</span>
              <span id='frames' class="clock-small">{{ frameNb(this.activeFrame) }}</span>
            </div>
            <div class="toolbar-button">
              <i
                class="icon-backward baku-button"
                style="color:#455054;"
                @click="moveActiveFrame(0 - activeFrame)"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-step-backward baku-button"
                style="color:#455054;"
                @click="moveActiveFrame(-1)"
              />
            </div>
            <div class="toolbar-button toolbar-button-big" v-if="!isPlaying">
              <i class="icon-play baku-button" style="color:#FFBD72;" @click="playAnimation()" />
            </div>
            <div class="toolbar-button toolbar-button-big" v-if="!isPlaying">
              <i
                class="icon-play_loop baku-button"
                style="color:#FFBD72;"
                @click="playSelection()"
              />
            </div>
            <div class="toolbar-button toolbar-button-big" v-if="isPlaying">
              <i class="icon-pause baku-button" @click="pauseAnimation()" />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-step-forward baku-button"
                style="color:#455054;"
                @click="moveActiveFrame(1)"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-forward baku-button"
                style="color:#455054;"
                @click="moveActiveFrame(getActiveShot.images.length - 1 - activeFrame )"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-set_begin baku-button"
                style="color:#455054;"
                @click="moveLeftBoundary()"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-set_end baku-button"
                style="color:#455054;"
                @click="moveRightBoundary()"
              />
            </div>
            <div class="toolbar-button">
              <img
                v-if="synchronizing"
                alt="loading"
                id="synchronization"
                src="@/assets/loading.svg"
              />
            </div>
          </div>
        </div>
        <CaptureToolboxComponent v-if="getActiveShot" />
      </div>

      <div class="toolbar">
        <div class="toolbar-button" @click="setActiveCapture()">
          <i class="icon-camera baku-button" />
          <span>Capture</span>
        </div>
      </div>
      <CarrouselComponent
        v-if="getActiveShot"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
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
import ImagesSelectorComponent from '@/components/image-selector/ImagesSelectorComponent.vue';
import store from '@/store';
import StoryboardPreviewComponent from '@/components/capture/StoryboardPreviewComponent.vue';
import { Movie, Shot, ReadingSliderBoundaries } from '@/api/movie.service';
import Project from './Project.vue';
import { ImageCacheService } from '@/api/imageCache.service';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    ImagesSelectorComponent,
    StoryboardPreviewComponent,
  },
  store,
})
export default class Capture extends Project {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.State
  public activeShotId!: string;

  @ProjectNS.State
  public selectedImagesBoundaries!: ReadingSliderBoundaries;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.Getter
  public synchronizing!: boolean;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  public activeFrame: number = 0;

  public tmpActiveFrame: number = 0;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  public animationFrame!: number;

  public animationStart!: number;

  public animationStartFrame!: number;

  public animationBoundaries!: ReadingSliderBoundaries;

  public isPlaying = false;

  private display: HTMLElement | null = null;

  private hours: HTMLElement | null = null;

  private minutes: HTMLElement | null = null;

  private seconds: HTMLElement | null = null;

  private frames: HTMLElement | null = null;

  public mounted() {
    this.$store.dispatch('project/changeActiveShot', this.$route.params.shotId);
  }

  public async created() {
    this.activeFrame = this.getActiveShot && this.getActiveShot.images.length === 0 ? -1 : 0;
  }

  public animate(timestamp: number) {
    if (!this.animationStart) {
      this.animationStart = timestamp;
    }
    if (!this.animationStartFrame) {
      this.animationStartFrame = this.activeFrame - this.animationBoundaries.left;
    }

    const nextFrame = this.getNextFrame(timestamp);
    if (nextFrame !== this.tmpActiveFrame) {
      this.tmpActiveFrame = nextFrame;
      this.setNextFrame(nextFrame);
    }
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  private setNextFrame(nextFrame: number) {
    if (this.display) {
      this.display.setAttribute('src', ImageCacheService.getImage(this.getActiveShot.images[nextFrame].id));
    }
    if (this.hours) {
      this.hours.textContent = this.nbHours(nextFrame);
    }
    if (this.minutes) {
      this.minutes.textContent = this.nbMins(nextFrame);
    }
    if (this.seconds) {
      this.seconds.textContent = this.nbSecs(nextFrame);
    }
    if (this.frames) {
      this.frames.textContent = this.frameNb(nextFrame);
    }
    (this.$refs.imageSelector as ImagesSelectorComponent).setFrame(nextFrame);
  }

  private getNextFrame(timestamp: number) {
    const imageFromStart = Math.floor((timestamp - this.animationStart) * (this.movie.fps / 1000));
    const animationLength = this.animationBoundaries.right - this.animationBoundaries.left;
    return this.animationBoundaries.left + ((this.animationStartFrame + imageFromStart) % animationLength);
  }

  public playAnimation() {
    if (!this.isPlaying) {
      this.initPlay();
      this.animationBoundaries = { left: 0, right: this.getActiveShot.images.length };
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public playSelection() {
    if (!this.isPlaying) {
      if (
        this.activeFrame < this.selectedImagesBoundaries.left
        || this.activeFrame > this.selectedImagesBoundaries.right
      ) {
        this.activeFrame = this.selectedImagesBoundaries.left;
      }
      this.initPlay();
      this.animationBoundaries = { left: this.selectedImagesBoundaries.left, right: this.selectedImagesBoundaries.right };
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public initPlay() {
    this.isPlaying = true;
    this.display = document.getElementById('previewImg');
    this.hours = document.getElementById('hours');
    this.minutes = document.getElementById('minutes');
    this.seconds = document.getElementById('seconds');
    this.frames = document.getElementById('frames');
  }

  public pauseAnimation() {
    if (this.isPlaying) {
      this.isPlaying = false;
      delete this.animationStart;
      delete this.animationStartFrame;
      this.activeFrame = this.tmpActiveFrame;
      this.tmpActiveFrame = 0;
      cancelAnimationFrame(this.animationFrame);
    }
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
      ImageCacheService.startPreloading(
        this.getActiveShot.images,
        this.activeFrame,
      );
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

  public setActiveCapture() {
    this.activeFrame = this.getActiveShot.images.length - 1;
    this.$store.dispatch('capture/setActiveCapture', !this.activeCapture);
  }

  public moveLeftBoundary() {
    this.$store.commit('project/setSelectedImagesBoundaries', {
      left: this.activeFrame,
      right: this.selectedImagesBoundaries.right,
    });
  }

  public moveRightBoundary() {
    this.$store.commit('project/setSelectedImagesBoundaries', {
      left: this.selectedImagesBoundaries.left,
      right: this.activeFrame,
    });
  }

  public nbHours(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps / 60 / 60)
      % 60}`.padStart(2, '0');
  }

  public nbMins(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps / 60)
      % 60}`.padStart(2, '0');
  }

  public nbSecs(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps)
      % 60}`.padStart(2, '0');
  }

  public frameNb(frame: number): string {
    return `${(frame + 1) % this.movie.fps}`.padStart(2, '0');
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
  justify-content: space-between;
  padding: 10px 24px;
}

.image-selector {
}

#previewImg {
  min-width: 640px;
  min-height: 360px;
  max-height: 720px;
  height: 100%;
  max-width: 100%;
  background: white;
}

#ghostImg {
  min-width: 640px;
  min-height: 360px;
  max-height: 720px;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.4;
}

.previewContainer {
  width: 1024px;
  justify-content: center;
  display: flex;
  flex-direction: column;
  position: relative;
}

.previewContent {
  width: 1024px;
  height: 576px;
  background: #ffffff 0 0 no-repeat padding-box;
  border: 4px solid #ffbd72;
  box-shadow: 0 6px 10px #00000066;
  border-radius: 4px;
  box-sizing: content-box;
  justify-content: center;
  display: flex;
  position: relative;
}

#videoCapture {
  min-width: 640px;
  min-height: 360px;
  max-height: 720px;
  height: 100%;
  max-width: 100%;
}

@media screen and (max-width: 1699px) {
  #videoCapture {
    width: 640px;
    height: 360px;
  }
  .previewContainer {
    width: 640px;
  }

  .previewContent {
    width: 640px;
    height: 360px;
  }

  #previewImg {
    width: 640px;
    height: 360px;
  }
}

@media screen and (min-width: 1700px) {
  #videoCapture {
    width: 1024px;
  }
}

.toolbar {
  display: inline-flex;
  width: 100%;
  background: #ffffff;
  border-radius: 8px 8px 0px 0px;
  border-bottom: 1px solid #f2f2f2;
  padding: 11px 28px;
  cursor: pointer;
}

.toolbar-button {
  margin: 0 5px;
}

.mediaControls {
  width: 100%;
  display: flex;
  font-size: 18px;
  align-items: center;

  .clock {
    background: #455054;
    border-radius: 8px;
    color: white;
    padding: 1px 5px;
    width: 160px;
    font-size: 26px;
    margin-bottom: 5px;

    .clock-small {
      font-size: 18px;
    }
  }

  .toolbar-button-big {
    font-size: 32px;
  }
}
</style>
