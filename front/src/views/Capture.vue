<template>
  <div class="mainFrame">
    <template>
      <div class="previewBloc">
        <StoryboardPreviewComponent
          ref="previewComponent"
          :shots="movie.shots"
          :activeShot="getActiveShot"
        />
        <div class="previewContainer">
          <div class="previewContent">
            <video
              v-if="activeCapture"
              id="videoCapture"
              ref="videoCapture"
              :style="{transform: 'scale(' + scaleX +', ' +scaleY +')'}"
              autoplay
              muted
              playsinline
              controls
            />
            <img
              id="previewImg"
              ref="previewImg"
              src="@/assets/baku-balls-spinner.svg"
              v-else
            />
            <!--<img
              v-if="getActiveShot && getActiveShot.images[currentCarrousselFrame] && activeCapture"
              alt="ghostImg"
              id="ghostImg"
              :src="ImageCacheService.getImage(getActiveShot.images[currentCarrousselFrame].id)"
            /> -->
          </div>
          <ImagesSelectorComponent
            v-if="getActiveShot"
            :projectId="id"
            :activeShot="getActiveShot.id"
            :images="getActiveShot.images"
            :activeImage="currentDisplayedFrame"
            @activeImageChange="onActiveFrameChange"
            :activeCapture="activeCapture"
            v-model="selectedImages"
          />
          <div class="mediaControls">
            <div class="clock">
              <span>{{nbHours(this.currentDisplayedFrame)}}</span>
              <span class="clock-small">:</span>
              <span>{{ nbMins(this.currentDisplayedFrame) }}</span>
              <span class="clock-small">:</span>
              <span>{{ nbSecs(this.currentDisplayedFrame) }}</span>
              <span class="clock-small">:</span>
              <span class="clock-small">{{ frameNb(this.currentDisplayedFrame) }}</span>
            </div>
            <div class="toolbar-button">
              <i
                class="icon-step-backward baku-button"
                style="color:#455054;"
                @click="moveHome()"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-backward baku-button"
                style="color:#455054;"
                @click="moveEnd()"
              />
            </div>
            <div class="toolbar-button toolbar-button-big" :class="{disabled : activeCapture}">
              <i
                class="icon-play"
                v-bind:class="isPlaying !== 'selection' ? 'baku-button primary-button' : 'disabled-button'"
                @click="playAnimation()"
                v-if="isPlaying !== 'animation'"
                v-bind:disabled="true"
              />
              <i
                class="icon-pause baku-button"
                @click="pauseAnimation()"
                v-else
              />
            </div>
            <div class="toolbar-button toolbar-button-big" :class="{disabled : activeCapture}">
              <i
                class="icon-play_loop"
                v-bind:class="isPlaying !== 'animation' ? 'baku-button primary-button' : 'disabled-button'"
                @click="playSelection()"
                v-if="isPlaying !== 'selection'"
              />
              <i
                class="icon-pause baku-button"
                @click="pauseAnimation()"
                v-else
              />
            </div>
            <div class="toolbar-button toolbar-button-big">
              <i
                class="icon-recording baku-button"
                :class="{ blinking: activeCapture}"
                style="color:#e66359;"
                @click="setActiveCapture()"
              />
            </div>

            <div class="toolbar-button">
              <i
                class="icon-forward baku-button"
                style="color:#455054;"
                @click="onActiveFrameChange(currentCarrousselFrame + 1)"
              />
            </div>
            <div class="toolbar-button">
              <i
                class="icon-step-forward baku-button"
                style="color:#455054;"
                @click="onActiveFrameChange(getActiveShot.images.length - 1)"
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
                src="@/assets/baku-balls-spinner.svg"
              />
            </div>
          </div>
        </div>
        <CaptureToolboxComponent v-if="getActiveShot" />
      </div>

      <CarrouselComponent
        v-if="getActiveShot"
        ref="carrousel"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="currentCarrousselFrame"
        @activeImageChange="onActiveFrameChange"
        @moveFrame="moveFrame"
        @moveHome="moveHome"
        @moveEnd="moveEnd"
        @stopMovingFrame="syncActiveFrame"
        @togglePlay="togglePlay"
        :activeCapture="activeCapture"
        :selectedImages="selectedImages"
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
import { Movie, ReadingSliderBoundaries, Shot } from '@/api/movie.service';
import { ImageCacheService } from '@/api/imageCache.service';
import Project from './Project.vue';
import { Device } from '../api/device.class';

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

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.Getter
  public synchronizing!: boolean;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  @ProjectNS.Getter
  public getActiveShotImgCount!: Shot;

  // Carroussel Frame
  public currentCarrousselFrame: number = 0;

  // Displayed Frame (previewImg + imageSelector)
  public currentDisplayedFrame: number = 0;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public activeDevice!: Device;

  @CaptureNS.State
  public stream!: MediaStream | null;

  @CaptureNS.State
  public scaleX!: number | 1;

  @CaptureNS.State
  public scaleY!: number | 1;

  public selectedImages: ReadingSliderBoundaries = { left: 0, right: 3 };

  public animationFrame!: number;

  public animationStart!: number;

  public animationStartFrame!: number;

  public animationBoundaries!: ReadingSliderBoundaries;

  public isPlaying: 'animation' | 'selection' | null = null;

  private previewImg!: HTMLImageElement;

  public mounted() {
    this.$store.dispatch('project/changeActiveShot', this.$route.params.shotId);
    this.previewImg = this.$refs.previewImg as HTMLImageElement;
  }

  public animate(timestamp: number) {
    if (!this.animationStart) {
      this.animationStart = timestamp;
    }
    if (!this.animationStartFrame) {
      this.animationStartFrame = this.currentCarrousselFrame - this.animationBoundaries.left;
    }

    const nextFrame = this.getNextFrame(timestamp);
    if (nextFrame !== this.currentDisplayedFrame) {
      this.currentDisplayedFrame = nextFrame;
      this.displayFrame(nextFrame);
    }
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  private displayFrame(frame: number) {
    const imageId = this.getActiveShot.images[frame].id;
    this.previewImg!.src = ImageCacheService.getImage(imageId);
  }

  private getNextFrame(timestamp: number) {
    const imageFromStart = Math.floor(
      (timestamp - this.animationStart) * (this.movie.fps / 1000),
    );
    const animationLength = this.animationBoundaries.right - this.animationBoundaries.left;
    return (
      this.animationBoundaries.left
      + ((this.animationStartFrame + imageFromStart) % animationLength)
    );
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pauseAnimation();
    } else {
      this.playAnimation();
    }
  }

  public playAnimation() {
    if (!this.isPlaying) {
      this.initPlay('animation');
      this.animationBoundaries = {
        left: 0,
        right: this.getActiveShot.images.length,
      };
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public playSelection() {
    if (!this.isPlaying) {
      if (this.currentCarrousselFrame < this.selectedImages.left || this.currentCarrousselFrame > this.selectedImages.right) {
        this.currentCarrousselFrame = this.selectedImages.left;
      }
      this.initPlay('selection');
      this.animationBoundaries = {
        left: this.selectedImages.left,
        right: this.selectedImages.right + 1,
      };
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public initPlay(type: 'animation' | 'selection') {
    this.isPlaying = type;
  }

  public pauseAnimation() {
    if (this.isPlaying) {
      this.isPlaying = null;
      delete this.animationStart;
      delete this.animationStartFrame;
      cancelAnimationFrame(this.animationFrame);
      this.syncActiveFrame();
    }
  }

  private syncActiveFrame() {
    if (!this.isPlaying) {
      if (this.currentCarrousselFrame !== this.currentDisplayedFrame) {
        this.currentCarrousselFrame = this.currentDisplayedFrame;
        ImageCacheService.startPreloading(
          this.getActiveShot.images,
          this.currentCarrousselFrame,
          this.onImagePreloaded,
        );
      }
    }
  }

  @Watch('stream')
  public onStreamChange(newValue: MediaStream, _oldValue: MediaStream) {
    if (newValue) {
      (this.$refs.videoCapture as HTMLVideoElement).srcObject = newValue;
    }
  }

  @Watch('getActiveShot')
  public async onActiveShotChange(shot: Shot) {
    if (shot) {
      ImageCacheService.startPreloading(
        shot.images,
        this.currentCarrousselFrame,
        this.onImagePreloaded,
      );
    }
  }

  @Watch('activeCapture')
  public async onActiveCaptureChange(activeCapture: boolean) {
    const msg = activeCapture ? 'Vous entrez en mode Capture' : 'Vous sortez du mode Capture';
    this.$buefy.toast.open({
      duration: 2000,
      message: msg,
      position: 'is-bottom',
      type: 'is-success',
    });
    setTimeout(() => this.onActiveFrameChange(this.currentDisplayedFrame));
  }

  @Watch('getActiveShotImgCount')
  public async onActiveShotImgCountChange(nb: number) {
    if (nb) {
      this.displayFrame(this.currentCarrousselFrame);
    }
  }

  private onImagePreloaded(imageId: string): void {
    if (this.getActiveShot.images[this.currentDisplayedFrame].id === imageId) {
      this.displayFrame(this.currentDisplayedFrame);
    }
    (this.$refs.previewComponent as StoryboardPreviewComponent).imageReady(
      imageId,
    );
    (this.$refs.carrousel as CarrouselComponent).imageReady(imageId);
  }

  public moveFrame(moveOffset: number) {
    const computedFrame = this.currentDisplayedFrame + moveOffset;
    this.moveFrameAbsolute(computedFrame);
  }

  public moveHome() {
    this.onActiveFrameChange(0);
  }

  public moveEnd() {
    this.onActiveFrameChange(this.getActiveShot.images.length - 1);
  }

  private moveFrameAbsolute(frame: number): number {
    if (!this.isPlaying) {
      const minFrame = this.activeCapture ? -1 : 0;
      if (frame < minFrame) {
        this.currentDisplayedFrame = minFrame;
      } else if (frame > this.getActiveShot.images.length - 1) {
        this.currentDisplayedFrame = this.getActiveShot.images.length - 1;
      }
      this.currentDisplayedFrame = frame;
      this.displayFrame(this.currentDisplayedFrame);
    }
    return this.currentDisplayedFrame;
  }

  public onActiveFrameChange(newActiveFrame: number) {
    this.moveFrameAbsolute(newActiveFrame);
    this.syncActiveFrame();
  }

  public moveLeftBoundary() {
    this.onActiveFrameChange(this.selectedImages.left);
  }

  public moveRightBoundary() {
    this.onActiveFrameChange(this.selectedImages.right);
  }

  public setActiveCapture() {
    if (this.activeDevice) {
      this.currentCarrousselFrame = this.getActiveShot.images.length - 1;
      this.$store.dispatch('capture/setActiveCapture', !this.activeCapture);
    } else {
      this.$buefy.dialog.alert({
        message: 'Veuillez sélectionner une caméra',
        type: 'is-danger',
        hasIcon: true,
        icon: 'times-circle',
        iconPack: 'fa',
        ariaRole: 'alertdialog',
        ariaModal: true,
      });
    }
  }

  public nbHours(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps / 60 / 60)
      % 60}`.padStart(2, '0');
  }

  public nbMins(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps / 60) % 60}`.padStart(
      2,
      '0',
    );
  }

  public nbSecs(frame: number): string {
    return `${Math.floor((frame + 1) / this.movie.fps) % 60}`.padStart(2, '0');
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

.primary-button {
  color: #ffbd72;
}

.disabled-button {
  color: #cccccc;
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

.blinking {
  -webkit-animation: 2s blink ease infinite;
  -moz-animation: 2s blink ease infinite;
  -ms-animation: 2s blink ease infinite;
  -o-animation: 2s blink ease infinite;
  animation: 2s blink ease infinite;
}

@keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-moz-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-webkit-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-ms-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@-o-keyframes blink {
  from,
  to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

video::-webkit-media-controls-play-button, video::-webkit-media-controls-timeline, video::-webkit-media-controls-current-time-display
 {
  display: none;
}
</style>
