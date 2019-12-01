<template>
  <div class="mainFrame">
    <template>
      <div class="previewBloc">
        <StoryboardPreviewComponent
          :shots="movie.shots"
          :activeShotId="getActiveShotId"
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
              :src="`/api/${id}/images/${getActiveShot.id}/${getActiveShot.images[activeFrame]}?width=1280&height=720`"
            />
          </div>
          <template v-if="computedPremiewImages">
            <img
              style="display:none"
              v-for="(image, index) in computedPremiewImages"
              :key="index"
              :src="`/api/${id}/images/${getActiveShot.id}/${image}?width=1280&height=720`"
            />
          </template>
        </div>
        <CaptureToolboxComponent
          v-if="getActiveShot"
          :projectId="id"
          :activeShot="getActiveShot.id"
          :activeIndex="activeFrame + 1"
          v-on:moveactiveframe="moveActiveFrame($event)"
        />
      </div>
      <div>
        <i class="icon-play baku-button" style="color:#FBB10D;" @click="playAnimation()" />
        <i class="icon-pause baku-button" @click="pauseAnimation()" />
      </div>
      <CarrouselComponent
        v-if="getActiveShot"
        :projectId="id"
        :activeShot="getActiveShot.id"
        :images="getActiveShot.images"
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
        v-on:moveactiveframe="moveActiveFrame($event)"
      />
    </template>
  </div>
</template>

<script lang="ts">

import { Component, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import CaptureToolboxComponent from "@/components/capture/CaptureToolboxComponent.vue";
import CarrouselComponent from "@/components/capture/CarrouselComponent.vue";
import store from "@/store";
import StoryboardPreviewComponent from "@/components/capture/StoryboardPreviewComponent.vue";
import { Movie, Shot } from "@/api/movie.service";
import Project from "./Project.vue";
import { ImageRef } from '@/api/baku.service';

const CaptureNS = namespace("capture");
const ProjectNS = namespace("project");

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

  @ProjectNS.Getter
  public getActiveShotId!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  public activeFrame: number = -1;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  public isPlaying = false;

  private loop: any;

  public mounted() {}

  public playAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.loop = setInterval(() => this.animate(), 1000 / this.movie.fps);
    }
  }

  public animate() {
    if (this.activeFrame === this.getActiveShot.images.length - 1) {
      this.activeFrame = 0;
    } else {
      this.activeFrame++;
    }
  }

  public pauseAnimation() {
    clearInterval(this.loop);
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

  get computedPremiewImages(): ImageRef[] {
    if (!this.getActiveShot) {
      return [];
    }
    return this.getActiveShot.images.slice(this.activeFrame, this.activeFrame + 25);
  }

  public moveActiveFrame(event: number) {
    this.activeFrame += event;
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
