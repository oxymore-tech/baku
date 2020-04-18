<template>
  <div class="main-frame">
    <template>
      <div class="preview-bloc">
        <StoryboardPreviewComponent
          ref="previewComponent"
          :shots="movie.shots"
          :activeShot="getActiveShot"
        />
        <div class="preview-container">
          <div class="preview-content">
            <template v-if="onionSkin">
              <img
                v-if="getActiveShot && getActiveShot.images[currentCarrousselFrame - onionSkin +1] && activeCapture && onionSkin > 0"
                alt="ghostImg"
                id="ghost-img"
                :src="ImageCacheService.getImage(getActiveShot.images[currentCarrousselFrame - onionSkin +1].id)"
              />
              <template v-for="ghostIndex in onionSkinAsArray">
                <img
                  :key="ghostIndex"
                  v-if="getActiveShot && getActiveShot.images[currentCarrousselFrame - ghostIndex] && activeCapture"
                  alt="ghostImg"
                  class="onion-skin"
                  :src="ImageCacheService.getImage(getActiveShot.images[currentCarrousselFrame - ghostIndex].id)"
                />
              </template>
            </template>
            <video
              v-if="activeCapture"
              id="video-capture"
              ref="videoCapture"
              :style="{transform: 'scale(' + scaleX +', ' +scaleY +')', 'opacity': onionSkin > 0 ? 0.4 : 1}"
              autoplay
              muted
              playsinline
            />
            <img
              id="preview-img"
              ref="previewImg"
              src="@/assets/baku-cloud-spinner.svg"
              :class="{hidden: activeCapture}"
            />
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
          <div class="media-controls">
            <div class="clock">
              <span>{{nbHours(this.currentDisplayedFrame)}}</span>
              <span class="clock-small">:</span>
              <span>{{ nbMins(this.currentDisplayedFrame) }}</span>
              <span class="clock-small">:</span>
              <span>{{ nbSecs(this.currentDisplayedFrame) }}</span>
              <span class="clock-small">:</span>
              <span class="clock-small">{{ frameNb(this.currentDisplayedFrame) }}</span>
            </div>
            <i
              class="toolbar-button icon-step-backward baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="moveHome()"
            />
            <i
              class="toolbar-button icon-backward baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="activeCapture ? () => {} : moveFrame(- 1)"
            />
            <i
              class="toolbar-button toolbar-button-big icon-play"
              :class="{'baku-button primary-button': isPlaying !== 'selection', 'disabled-button': isPlaying === 'selection', 'disabled': activeCapture}"
              @click="playAnimation()"
              v-if="isPlaying !== 'animation'"
              v-bind:disabled="true"
            />
            <i
              class="toolbar-button toolbar-button-big icon-pause baku-button"
              @click="pauseAnimation()"
              v-else
            />
            <i
              class="toolbar-button toolbar-button-big icon-play_loop"
              :class="{'baku-button primary-button': isPlaying !== 'selection', 'disabled-button': isPlaying === 'selection', 'disabled': activeCapture}"
              @click="playSelection()"
              v-if="isPlaying !== 'selection'"
            />
            <i
              class="toolbar-button toolbar-button-big icon-pause baku-button"
              @click="pauseAnimation()"
              v-else
            />
            <i
              class="toolbar-button icon-forward baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="activeCapture ? () => {} :  moveFrame(1)"
            />
            <i
              class="toolbar-button icon-step-forward baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="moveEnd()"
            />
            <i
              class="toolbar-button icon-set_begin baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="moveLeftBoundary()"
            />
            <i
              class="toolbar-button icon-set_end baku-button"
              style="color:#455054;"
              :class="{disabled : activeCapture}"
              @click="moveRightBoundary()"
            />
            <div
              class="toolbar-button toolbar-capture-button"
              :class="{'active-capture': activeCapture}"
              @click="setActiveCapture(activeCapture)">
            Mode Capture
            </div>
            <div class="toolbar-button">
              <img
                style="height: 28px; width:28px"
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
        :isPlaying="isPlaying"
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
    <video
      v-if="activeCapture"
      id="video-capture-fullscreen"
      ref="videoCaptureFullscreen"
      :style="{transform: 'scale(' + scaleX +', ' +scaleY +')'}"
      autoplay
      muted
      playsinline
    />
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
import * as _ from 'lodash';
import AbstractProjectView from './AbstractProjectView.vue';
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
export default class CaptureView extends AbstractProjectView {
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

  @CaptureNS.State('onionSkin')
  protected onionSkin!: number;

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
    if (this.getActiveShot.images[frame]) {
      const imageId = this.getActiveShot.images[frame].id;
      this.previewImg!.src = ImageCacheService.getImage(imageId);
    }
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
    if (!this.isPlaying && !this.activeCapture) {
      this.initPlay('animation');
      this.animationBoundaries = {
        left: 0,
        right: this.getActiveShot.images.length,
      };
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public playSelection() {
    if (!this.isPlaying && !this.activeCapture) {
      if (
        this.currentCarrousselFrame < this.selectedImages.left
        || this.currentCarrousselFrame > this.selectedImages.right
      ) {
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
    if (this.isPlaying && !this.activeCapture) {
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
      // (this.$refs.videoCaptureFullscreen as HTMLVideoElement).srcObject = newValue;
    }
  }

  @Watch('getActiveShot')
  public async onActiveShotChange(shot: Shot) {
    console.log('[Capture] onActiveShotChange()');
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
    const msg = activeCapture
      ? 'Vous entrez en mode Capture'
      : 'Vous sortez du mode Capture';
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

  get onionSkinAsArray() {
    return _.range(this.onionSkin - 2, -1, -1);
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
    if (!this.activeCapture) {
      this.onActiveFrameChange(0);
    }
  }

  public moveEnd() {
    if (!this.activeCapture) {
      this.onActiveFrameChange(this.getActiveShot.images.length - 1);
    }
  }

  private moveFrameAbsolute(frame: number): number {
    if (!this.isPlaying) {
      const minFrame = this.activeCapture ? -1 : 0;
      if (frame < minFrame) {
        this.currentDisplayedFrame = minFrame;
      } else if (frame > this.getActiveShot.images.length - 1) {
        this.currentDisplayedFrame = this.getActiveShot.images.length - 1;
      } else {
        this.currentDisplayedFrame = frame;
      }
      this.displayFrame(this.currentDisplayedFrame);
    }
    return this.currentDisplayedFrame;
  }

  public onActiveFrameChange(newActiveFrame: number) {
    this.moveFrameAbsolute(newActiveFrame);
    this.syncActiveFrame();
  }

  public moveLeftBoundary() {
    if (!this.activeCapture) {
      this.onActiveFrameChange(this.selectedImages.left);
    }
  }

  public moveRightBoundary() {
    if (!this.activeCapture) {
      this.onActiveFrameChange(this.selectedImages.right);
    }
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
  @import "../styles/capture.scss";
</style>
