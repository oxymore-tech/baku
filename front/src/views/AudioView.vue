<style lang="scss" scoped>
  @import "@/styles/audio.scss"; 
</style>

<template>
  <div class="main-frame">
    <template>
      <div class="preview-bloc">

        <AudioListComponent
          :isPlaying="isPlaying"
          :projectId="id"
        />
        
        <div class="preview-container">

          <div class="preview-content-wrapper">

            <div class="preview-side-content-wrapper">
              <div class="small-preview-content">
                
                <template>
                  <img
                    v-if="this.allImages && this.allImages[activeFrame-1.0]  > 0"
                    :src="ImageCacheService.getImage(this.allImages[activeFrame-1.0].id)"
                    alt="prevGhostImg"
                    id="prev-ghost-img"
                  />
                </template>

                <img
                  id="prev-preview-img"
                  ref="prevPreviewImg"
                  src="@/assets/baku-cloud-spinner.svg"
                />
              </div>
            </div>

            <div class="preview-center-content-wrapper">
              <div class="preview-content">
                <template>
                  <img
                    v-if="this.allImages && this.allImages[activeFrame]  > 0"
                    :src="ImageCacheService.getImage(this.allImages[activeFrame].id)"
                    alt="ghostImg"
                    id="ghost-img"
                  />
                </template>

                <img
                  id="preview-img"
                  ref="previewImg"
                  src="@/assets/baku-cloud-spinner.svg"
                />
                  
              </div>
            </div>

            <div class="preview-side-content-wrapper">
              <div class="small-preview-content">
                
                <template>
                  <img
                    v-if="this.allImages && this.allImages[activeFrame+1.0]  > 0"
                    :src="ImageCacheService.getImage(this.allImages[activeFrame+1.0].id)"
                    alt="nextGhostImg"
                    id="next-ghost-img"
                  />
                </template>

                <img
                  id="next-preview-img"
                  ref="nextPreviewImg"
                  src="@/assets/baku-cloud-spinner.svg"
                />
              </div>
            </div>


          </div>

          <div class="preview-actions">
            <ImagesSelectorComponent
              ref="imageSelector"
              v-if="this.allImages"
              :projectId="id"
              :images="this.allImages"
              :activeImage="activeFrame"
              :canEdit="canEdit"
              @activeImageChange="onActiveFrameChange"
              :activeDevice=null
              v-model="selectedImages"
            />
            <div class="media-controls">
              <div class="clock">
                <span class="clock-digit">
                  <span class="clock-digit-indicator">min</span>
                  <span ref="minutes">{{ nbMins(this.activeFrame) }}</span>
                </span>
                <span class="clock-small">:</span>
                <span class="clock-digit">
                  <span class="clock-digit-indicator">sec</span>
                  <span ref="seconds">{{ nbSecs(this.activeFrame) }}</span>
                </span>
              </div>

              <div class="play-controls">
                <i
                  class="toolbar-button icon-backward baku-button"
                  style="color:#455054;"
                  @click="moveFrame(- 1)"
                />
                <template>
                  <i
                    class="toolbar-button toolbar-button-big icon-play"
                    :class="{'baku-button primary-button': isPlaying !== 'selection', 'disabled-button': isPlaying === 'selection'}"
                    @click="playAnimation()"
                    v-if="isPlaying !== 'animation'"
                  />
                  <i
                    class="toolbar-button toolbar-button-big icon-pause baku-button"
                    @click="pauseAnimation()"
                    v-else
                  />
                </template>
                <i
                  class="toolbar-button icon-forward baku-button"
                  style="color:#455054;"
                  @click="moveFrame(1)"
                />
              </div>

            </div>
          </div>
              
        </div>


        <HistoryComponent/>

      </div>

      <AudioDisplayComponent
        ref="audioDisplay"
        :isPlaying="isPlaying"
      />

    </template>
  </div>
</template>

<script lang="ts">
import { Component, } from 'vue-property-decorator';
import ProjectSettingsPopup from '@/components/ProjectSettingsPopup.vue';
import { namespace } from 'vuex-class';

import HistoryComponent from '@/components/capture/HistoryComponent.vue';
import AudioDisplayComponent from '@/components/audio/AudioDisplayComponent.vue';
import AudioListComponent from '@/components/audio/AudioListComponent.vue';


import * as _ from 'lodash';

import store from '@/store';
import AbstractProjectView from '@/views/AbstractProjectView.vue';
import ImagesSelectorComponent from '@/components/image-selector/ImagesSelectorComponent.vue';
import CaptureToolboxComponent from '@/components/capture/CaptureToolboxComponent.vue';
import StoryboardPreviewComponent from '@/components/capture/StoryboardPreviewComponent.vue';
import { ImageCacheService } from '@/utils/imageCache.service';
import { Movie, ReadingSliderBoundaries, Shot, SoundTimeline } from '@/utils/movie.service';
import { Howl } from 'howler';

const ProjectNS = namespace('project');


@Component({
    components: {
      ProjectSettingsPopup,
      HistoryComponent,
      AudioListComponent,
      AudioDisplayComponent,

      ImagesSelectorComponent,
      StoryboardPreviewComponent,
      CaptureToolboxComponent,

    },
    store,
})

export default class AudioView extends AbstractProjectView {

    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    public movie!: Movie;

    @ProjectNS.Getter
    public synchronizing!: boolean;

    @ProjectNS.Getter
    public getActiveShot!: Shot;
/*
    @ProjectNS.Getter
    public getActiveShotIndex!: Shot;

    @ProjectNS.Getter
    public getActiveShotImgCount!: number;
*/
    @ProjectNS.Getter('canEditActiveShot')
    public canEdit!: boolean;

    @ProjectNS.Getter
    public getFirstShot!: Shot;

    @ProjectNS.Getter
    public getFirstShotId!: number;

    @ProjectNS.Getter
    public getPreviousShotId!: number;

    @ProjectNS.Getter
    public getNextShotId!: number;

    @ProjectNS.Getter
    public getShotCount!: number;

    @ProjectNS.Getter
    public getAllShots!: Shot[];

    @ProjectNS.Getter
    public getSoundTimeline!: SoundTimeline[];

    @ProjectNS.Getter
    protected getAudioRecord!: any;

    @ProjectNS.Getter
    public getMovieFps!: number | undefined;

    @ProjectNS.Action('loadProject')
    protected loadProject!: (projectId: string) => Promise<void>;

    // Carroussel Frame
    public activeFrame: number = 0;

    // Displayed Frame (previewImg + imageSelector)
    public playingFrame: number = 0;

    public selectedImages: ReadingSliderBoundaries = { left: 0, right: 0 };

    public animationFrame!: number;

    public animationStart!: number;

    public animationStartFrame!: number;

    public animationBoundaries!: ReadingSliderBoundaries;

    public isPlaying: 'animation' | 'selection' | null = null;

    public allImages: Array<any> = [];

    private previewImg!: HTMLImageElement;
    private prevPreviewImg!: HTMLImageElement;
    private nextPreviewImg!: HTMLImageElement;

    private soundsTimeline!: SoundTimeline[];

    //private sounds: [Howl,number][] = [];

    private soundsPlayers: Howl[][] = [];

    private allLoaded : boolean = false;

    public async mounted() {


      //this.loadProject(this.$route.params.projectId);
      await this.$store.dispatch('project/loadProject', this.$route.params.projectId); 

      const audioDisplay = this.$refs.audioDisplay as AudioDisplayComponent;
      audioDisplay.setAllShots(this.getAllShots);

      this.previewImg = this.$refs.previewImg as HTMLImageElement;
      this.prevPreviewImg = this.$refs.prevPreviewImg as HTMLImageElement;
      this.nextPreviewImg = this.$refs.nextPreviewImg as HTMLImageElement;

      this.allImages = [];

      let allImagesLocal : any[] = [];

      //stockage de toutes les images dans allImages et allImagesLocal
      for(let shot of this.getAllShots){
        allImagesLocal = allImagesLocal.concat(shot.images);
        for(let image of shot.images){
          this.allImages.push({image});
        }
      }

      ImageCacheService.startPreloading(
        allImagesLocal,
        this.activeFrame,
        this.onImagePreloaded,
      );

      //const currentShot = this.getCurrentShot(0);
      //console.log(currentShot);
    }

    public animate(timestamp: number) {
      if (!this.animationStart) {
        this.animationStart = timestamp;
      }
      if (!this.animationStartFrame) {
        this.animationStartFrame = this.activeFrame - this.animationBoundaries.left;
        if (this.activeFrame === this.allImages.length) {
          this.animationStartFrame = this.animationBoundaries.left;
        }
      }


      const nextFrame = this.getNextFrame(timestamp);

      if (nextFrame !== this.playingFrame) {
        this.playingFrame = nextFrame;
        this.displayFrame(nextFrame);
      }
      if (this.isPlaying === 'animation'
        && nextFrame === this.allImages.length) {
        this.pauseAnimation();
        return;
      }
      this.animationFrame = requestAnimationFrame(this.animate);
    }

    private displayFrame(timeCode: number) {

      if (this.isPlaying=='animation' && this.soundsTimeline.length>0){
        if (this.soundsPlayers[this.playingFrame] != undefined){
            this.soundsPlayers[this.playingFrame].forEach(sound => {
              sound.play();
            })
        }
      }

      const audioDisplay = this.$refs.audioDisplay as AudioDisplayComponent;
      audioDisplay.actualizeDateMarker(timeCode+1);
      
      if (this.allImages) {

        let image = undefined;
        if(this.allImages[timeCode]){
          image = this.allImages[timeCode].image;
        }

        let prevImage = undefined;
        if(this.allImages[timeCode-1.0]){
          prevImage = this.allImages[timeCode-1.0].image;
        }

        let nextImage = undefined;
        if(this.allImages[timeCode+1.0]){
          nextImage = this.allImages[timeCode+1.0].image;
        }

        if (image) {
          this.previewImg!.src = ImageCacheService.getImage(image.id);
        }
        if(prevImage) {
          this.prevPreviewImg!.src = ImageCacheService.getImage(prevImage.id);
        }
        if(nextImage) {
          this.nextPreviewImg!.src = ImageCacheService.getImage(nextImage.id);
        }
        const imageSelector = this.$refs.imageSelector as ImagesSelectorComponent;
        if (imageSelector) {
          imageSelector!.setFrame(timeCode);
        }

        (this.$refs.minutes as HTMLElement).textContent = this.nbMins(timeCode);
        (this.$refs.seconds as HTMLElement).textContent = this.nbSecs(timeCode);
      }
    }

    private setActiveFrame(frame: number) {
      this.activeFrame = frame;
      this.playingFrame = this.activeFrame;
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

    // private getCurrentShot(timestamp: number) {
    //   const totalImageNumber = this.allImages.length;
    //   let imageNumberCalculation = totalImageNumber;
      
    //   const allShots = this.getAllShots;

    //   let shotLengths = Array();

    //   for(let shot of allShots){
    //     shotLengths.push(shot.images.length);
    //   }

    //   for(let i=0; i< shotLengths.length; i++){
    //     imageNumberCalculation = imageNumberCalculation - shotLengths[i];
    //     if (imageNumberCalculation<=0){
    //       if(allShots){
    //         return allShots[i];
    //       }
    //     }
    //   }
    //   return undefined;
    // }

    public togglePlay() {
      if (this.isPlaying && this.allLoaded) {
        this.pauseAnimation();
      } else {
        this.playAnimation();
      }
    }

    public async playAnimation() {
      if (!this.isPlaying && this.allImages.length > 0) {
        if (this.activeFrame === this.allImages.length) {
          this.moveFrame(0);
          this.syncActiveFrame();
        }
        this.initPlay('animation');
        this.animationBoundaries = {
          left: 0,
          right: this.allImages.length + 1,
        };
        this.allLoaded=false;
        await Promise.all(this.initSounds());
        this.allLoaded=true;
        this.animationFrame = requestAnimationFrame(this.animate);
      }
    }

    public playSelection() {
      if (!this.isPlaying && this.allImages.length > 0) {
        if (
          this.activeFrame < this.selectedImages.left
          || this.activeFrame > this.selectedImages.right
        ) {
          this.setActiveFrame(this.selectedImages.left);
        }
        this.initPlay('selection');
        this.animationBoundaries = {
          left: this.selectedImages.left,
          right: this.selectedImages.right + (this.canEdit ? 1 : 0),
        };
        this.animationFrame = requestAnimationFrame(this.animate);
      }
    }

    public initPlay(type: 'animation' | 'selection') {
      this.isPlaying = type;
    }

    public pauseAnimation() {
      if (this.isPlaying) {
        this.soundsPlayers.forEach(tab => {
          if (tab != undefined){
            tab.forEach(sound => {
              sound.pause();
            })
          }
        });
        this.isPlaying = null;
        delete this.animationStart;
        delete this.animationStartFrame;
        cancelAnimationFrame(this.animationFrame);
        this.syncActiveFrame();
      }
    }

    public stopMoving() {
      this.pauseAnimation();
      this.syncActiveFrame();
    }

    private syncActiveFrame() {
      if (!this.isPlaying) {
        if (this.activeFrame !== this.playingFrame) {
          this.activeFrame = this.playingFrame;
        }
      }
    }


    get IsFrameLiveView() {
      return !this.isPlaying && this.activeFrame === this.allImages.length;
    }

    private onImagePreloaded(imageId: string): void {
      if (this.allImages[this.activeFrame].id === imageId) {
        this.displayFrame(this.activeFrame);
      }
    }

    public moveFrame(moveOffset: number) {
      const computedFrame = this.activeFrame + moveOffset;
      this.setActiveFrame(this.computeMoveFrame(computedFrame));
      this.displayFrame(this.activeFrame);
    }

    public movePlayingFrame(moveOffset: number) {
      this.initPlay('animation');
      const computedFrame = this.playingFrame + moveOffset;
      this.playingFrame = this.computeMoveFrame(computedFrame);
      this.displayFrame(this.playingFrame);
    }

    public moveHome() {
      this.onActiveFrameChange(0);
    }

    public moveEnd() {
      this.onActiveFrameChange(this.allImages.length - 1);
    }

    private computeMoveFrame(frame: number): number {
      const minFrame = 0;
      if (frame < minFrame) {
        return minFrame;
      }
      if (frame > this.allImages.length) {
        return this.allImages.length;
      }
      return frame;
    }

    public onActiveFrameChange(newActiveFrame: number) {
      if (this.isPlaying) {
        this.pauseAnimation();
      }
      if (newActiveFrame < this.selectedImages.left || newActiveFrame > this.selectedImages.right) {
        this.selectedImages.left = 0;
        this.selectedImages.right = 0;
      }
      this.setActiveFrame(this.computeMoveFrame(newActiveFrame));
      this.displayFrame(this.activeFrame);
    }

    public moveLeftBoundary() {
      this.onActiveFrameChange(this.selectedImages.left);
    }

    public moveRightBoundary() {
      this.onActiveFrameChange(this.selectedImages.right);
    }


    public nbMins(frame: number): string {
      return `${Math.floor((frame + 1) / this.movie.fps / 60) % 60}`.padStart(2, '0');
    }

    public nbSecs(frame: number): string {
      return `${Math.floor((frame + 1) / this.movie.fps) % 60}`.padStart(2, '0');
    }

  private initSounds() {
    //this.sounds=[];
    let promiseArray : Promise<void>[] = [];
    this.soundsTimeline = this.getSoundTimeline;
    this.soundsPlayers= new Array(this.allImages.length);
    if (this.playingFrame>0 && this.playingFrame+1<this.allImages.length){
      this.soundsTimeline.forEach(async elm => {
        if (elm.start<this.playingFrame+1 && elm.end>this.playingFrame+1){
          //là faut lire qu'une partie du son
          let nbFrameTot = elm.end - elm.start;
          let nbFrameElapsed = (this.playingFrame+1) - elm.start;
          let ratio = nbFrameElapsed/nbFrameTot;
          let timeToSeek = ratio * this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).duration;
          let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).sound);
          let volume = this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).volume;
          let sound : Howl = new Howl({
              src: [url],
              format: ['wav'],
              html5: true,
              volume: parseFloat((volume/100).toFixed(2))
          });
          sound.seek(timeToSeek);
          //this.sounds.push([sound,this.playingFrame+1]);
          if (this.soundsPlayers[this.playingFrame+1] == undefined) {
            this.soundsPlayers[this.playingFrame+1] = [];
          }
          promiseArray.push(isLoaded(sound));
          this.soundsPlayers[this.playingFrame+1].push(sound);
        } else if (elm.start >= this.playingFrame+1) {
          //là on charge que les futurs sons (pas ceux déjà passés) mais en entier
          let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).sound);
          let volume = this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).volume;
          let sound : Howl = new Howl({
              src: [url],
              format: ['wav'],
              html5: true,
              volume: parseFloat((volume/100).toFixed(2))
          });
          if (this.soundsPlayers[elm.start] == undefined) {
            this.soundsPlayers[elm.start] = [];
          }
          promiseArray.push(isLoaded(sound));
          this.soundsPlayers[elm.start].push(sound);
        }
      })
    } else {
      this.soundsTimeline.forEach(async elm => {
        let url = (window.URL || window.webkitURL ).createObjectURL(this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).sound);
        let volume = this.getAudioRecord.find((audio: any) => audio.id === elm.audioId).volume;
        let sound : Howl = new Howl({
            src: [url],
            format: ['wav'],
            html5: true,
            volume: parseFloat((volume/100).toFixed(2))
          });
        if (this.soundsPlayers[elm.start] == undefined) {
          this.soundsPlayers[elm.start] = [];
        }
        promiseArray.push(isLoaded(sound));
        this.soundsPlayers[elm.start].push(sound);
      })
    }
    return promiseArray;
  }
}

function isLoaded(sound: Howl) {
  return new Promise<void>((resolve,reject) => {
    sound.once('load', () => {
      resolve();
    })
  })
}
</script>

