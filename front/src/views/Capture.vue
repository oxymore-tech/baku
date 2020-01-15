<template>
  <div class="mainFrame">
    <template>
      <div class="previewBloc">
        <StoryboardPreviewComponent
          :shots="movie.shots"
          :activeShotId="activeShotId"
        />
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
            class="image-selector"
            v-if="getActiveShot"
            :projectId="id"
            :activeShot="getActiveShot.id"
            :images="getActiveShot.images"
            :activeImage="activeFrame"
            :activeCapture="activeCapture"
            @moveactiveframe="moveActiveFrame"
          />
        </div>
        <CaptureToolboxComponent v-if="getActiveShot" />
      </div>

      <div class="toolbar">
        <div class="toolbar-button">
          <i
            class="icon-play baku-button"
            style="color:#FBB10D;"
            @click="playAnimation()"
          />
        </div>
        <div class="toolbar-button">
          <i
            class="icon-reapeat baku-button"
            style="color:#FBB10D;"
            @click="playSelection()"
          />
        </div>
        <div class="toolbar-button">
          <i
            class="icon-pause baku-button"
            @click="pauseAnimation()"
          />
        </div>
        <div
          class="toolbar-button"
          @click="setActiveCapture()"
        >
          <i class="icon-camera baku-button" />
          <span>Capture</span>
        </div>
      </div>
      <!-- <ImagesSelectorComponent
        v-if="getActiveShot"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
        @moveactiveframe="moveActiveFrame"
      /> -->
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
  public getActiveShot!: Shot;

  public activeFrame: number = 0;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  public animationFrame!: number;

  public animationLastUpdate!: number;

  public isPlaying = false;

  public mounted() {
    this.$store.dispatch('project/changeActiveShot', this.$route.params.shotId);
  }

  public async created() {
    this.activeFrame = this.getActiveShot && this.getActiveShot.images.length === 0 ? -1 : 0;
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

  public animateSelection(timestamp: number) {
    if (!this.animationLastUpdate) {
      this.animationLastUpdate = timestamp;
    }

    const timeFromLastUpdate = timestamp - this.animationLastUpdate;
    if (timeFromLastUpdate > 1000 / this.movie.fps) {
      this.animationLastUpdate = timestamp;
      if (this.activeFrame === this.selectedImagesBoundaries.right) {
        this.activeFrame = this.selectedImagesBoundaries.left;
      } else {
        this.activeFrame++;
      }
    }

    this.animationFrame = requestAnimationFrame(this.animateSelection);
  }

  public playAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.animationFrame = requestAnimationFrame(this.animate);
    }
  }

  public playSelection() {
    if (!this.isPlaying) {
      if (this.activeFrame < this.selectedImagesBoundaries.left || this.activeFrame > this.selectedImagesBoundaries.right) {
        this.activeFrame = this.selectedImagesBoundaries.left;
      }
      this.isPlaying = true;
      this.animationFrame = requestAnimationFrame(this.animateSelection);
    }
  }

  public pauseAnimation() {
    if (this.isPlaying) {
      this.isPlaying = false;
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
  border: 4px solid #ffffff;
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
</style>
