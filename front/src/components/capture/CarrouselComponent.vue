<style lang="scss" scoped>
@import "@/styles/carrousel.scss";
</style>

<template>
  <div>
    <div class="toolbar">
      <div
        class="toolbar-button"
        @click="onCopy()"
        :class="{disabled : activeCapture || isPlaying}"
      >
        <i class="icon-copy baku-button" />
        <span>Copier</span>
      </div>
      <div
        class="toolbar-button"
        @click="onPaste()"
        :class="{disabled: activeCapture || !imagesToCopy.length || isPlaying}"
      >
        <i class="icon-paste baku-button" />
        <span>Coller</span>
      </div>
      <div
        class="toolbar-button"
        @click="onReverse()"
        :class="{disabled: activeCapture || !imagesToCopy.length || isPlaying}"
      >
        <i class="icon-reverse baku-button" />
        <span>Coller & Inverser</span>
      </div>
      <div
        class="toolbar-button"
        @click="deleteFrame()"
        :class="{disabled: activeCapture || isPlaying}"
      >
        <i class="icon-trash-alt baku-button" />
        <span>Supprimer</span>
      </div>
    </div>
    <div ref="carrouselContainer" class="carrousel-container">
      <template v-for="(image, index) in computedLeftCarrousel">
        <template v-if="image !== null">
          <div :key="'left'+index" class="image-container">
            <span
              class="framenumber-indicator"
            >{{ activeImage +1 - (computedLeftCarrousel.length - index) }}</span>
            <img
              class="carrousel-thumb"
              :alt="image"
              :class="{active : selectedImagesForReal.includes(index)}"
              :src="ImageCacheService.getThumbnail(image.id)"
              @click="moveToImage($event, index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
            />
          </div>
        </template>
        <template v-else>
          <div :key="'left'+index" class="image-container">
            <div
              @click="moveToImage($event, index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
              class="carrousel-thumb"
            />
          </div>
        </template>
      </template>

      <!-- ACTIVE IMAGE OR CAPTURE FRAME -->
      <template v-if="computedActiveImage">
        <div class="image-container" ref="carrouselActiveImg">
          <span class="framenumber-indicator">{{ activeImage + 1 }}</span>
          <img
            v-if="computedActiveImage !== undefined"
            class="carrousel-thumb active previewed"
            :alt="computedActiveImage"
            :src="ImageCacheService.getThumbnail(computedActiveImage.id)"
          />
        </div>
      </template>
      <template v-else>
        <div ref="captureButtonComponent" class="image-container active" style="position:relative">
          <CaptureButtonComponent
            v-if="activeDevice"
            :device="activeDevice"
            :projectId="projectId"
            :activeShot="activeShot"
            :activeIndex="activeImage+1"
            @captured="onCaptured"
            @uploaded="onUploaded"
          />
        </div>
      </template>

      <!-- RIGHT PART OF THE CARROUSEL -->
      <template v-for="(image, index) in computedRightCarrousel">
        <template v-if="image !== null && image !== 'liveview'">
          <div :key="'right'+index" class="image-container">
            <span class="framenumber-indicator">{{ activeImage + index + 2 }}</span>
            <img
              class="carrousel-thumb"
              :alt="image"
              :class="{active : selectedImagesForReal.includes(activeImage + index +1)}"
              :src="ImageCacheService.getThumbnail(image.id)"
              @click="moveToImage($event,index + 1)"
            />
          </div>
        </template>
        <template v-if="image === null">
          <div :key="'right'+index" class="image-container">
            <div @click="moveToImage($event,index + 1)" class="carrousel-thumb" />
          </div>
        </template>
      </template>

      <template v-if="computedNextImages">
        <img
          style="display:none"
          v-for="(image, index) in computedNextImages"
          :key="image.id + index"
          :src="ImageCacheService.getThumbnail(image.id)"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as _ from 'lodash';
import CaptureButtonComponent from '@/components/capture/CaptureButtonComponent.vue';
import { Device } from '@/utils/device.class';
import { ImageCacheService } from '@/utils/imageCache.service';
import { ImageRef, UploadedImage } from '@/utils/uploadedImage.class';
import { KeyCodes, ReadingSliderBoundaries } from '@/utils/movie.service';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');

@Component({
  components: {
    CaptureButtonComponent,
  },
})
export default class CarrouselComponent extends Vue {
  @Prop()
  public images!: ImageRef[];

  @Prop()
  public projectId!: string;

  @Prop()
  public activeShot!: string;

  @Prop()
  public activeImage!: number;

  @Prop()
  public activeCapture!: boolean;

  @Prop()
  public selectedImages!: ReadingSliderBoundaries;

  @Prop()
  public isPlaying!: boolean;

  @CaptureNS.State
  public activeDevice!: Device;

  @ProjectNS.Action('addImagesToShot')
  protected addImagesToShot!: ({}) => Promise<void>;

  @ProjectNS.Action('removeImageFromShot')
  protected removeImageFromShot!: ({}) => Promise<void>;

  protected selectedImagesForReal: number[] = [];

  private imagesToCopy: string[] = [];

  private totalCarrouselThumbnails = 10;

  mounted() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case KeyCodes.HOME:
        case KeyCodes.PAGE_UP:
          this.$emit('moveHome', e);
          break;
        case KeyCodes.END:
        case KeyCodes.PAGE_DOWN:
          this.$emit('moveEnd', e);
          break;
        case KeyCodes.LEFT_ARROW:
          this.$emit('moveFrame', -1);
          break;
        case KeyCodes.RIGHT_ARROW:
          this.$emit('moveFrame', 1);
          break;
        case KeyCodes.SPACE:
          this.$emit('togglePlay', e);
          break;
        case KeyCodes.DELETE:
          this.deleteFrame();
          break;
        case KeyCodes.C:
          if (e.ctrlKey || e.metaKey) {
            this.onCopy();
          }
          break;
        case KeyCodes.V:
          if (e.ctrlKey || e.metaKey) {
            this.onPaste();
          }
          break;
        default:
          break;
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      switch (e.keyCode) {
        case KeyCodes.LEFT_ARROW:
        case KeyCodes.RIGHT_ARROW:
          this.$emit('stopMovingFrame', e);
          break;
        default:
          break;
      }
    });
  }

  public imageReady(imageId: string) {
    if (this.images.find((i) => i.id === imageId)) {
      this.$forceUpdate();
    }
  }

  public onUploaded(id: string) {
    ImageCacheService.startPreloadingImage(
      new UploadedImage(this.projectId, id),
      () => this.$forceUpdate(),
    );
    console.log('onUploaded -1');
    this.$store.commit('project/incAction', -1);
  }

  public async onCaptured(id: string, thumb: Blob, b64: string) {
    ImageCacheService.putImageBlobInCache(id, b64);
    const newActiveFrame = this.activeImage + 1;
    await this.addImagesToShot([{
      shotId: this.activeShot,
      imageIndex: newActiveFrame,
      image: id,
    }]);
    this.$emit('activeImageChange', newActiveFrame);
  }

  public async deleteFrame() {
    if (!this.activeCapture && !this.isPlaying) {
      const imagesToDelete = this.selectedImagesForReal;
      imagesToDelete.push(this.activeImage);
      imagesToDelete.sort((a: any, b: any) => b - a);
      await asyncForEach(imagesToDelete, (imgId: number) => this.removeImageFromShot({
        shotId: this.activeShot,
        imageIndex: imgId,
      }));
      this.selectedImagesForReal = [];
    }
  }

  get computedActiveImage(): ImageRef | null {
    return this.images[this.activeImage];
  }

  get computedLeftCarrousel(): ImageRef[] {
    const count = this.totalCarrouselThumbnails / 2;
    const sliceIndex = this.activeCapture
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex).slice(-count);
    return new Array(count - leftImagesAvaible.length)
      .fill(null)
      .concat(leftImagesAvaible);
  }

  get computedRightCarrousel(): ImageRef[] {
    const count = this.totalCarrouselThumbnails / 2 + 1;
    const sliceIndex = this.activeImage + 1;
    const rightImagesAvaible = this.images.slice(sliceIndex).slice(0, count);
    return rightImagesAvaible;
  }

  get computedNextImages(): ImageRef[] {
    const sliceIndex = this.activeImage + 7;
    return this.images.slice(sliceIndex, sliceIndex + 20);
  }

  public isInSelection(index: number, position: string) {
    let cindex = index;
    if (position === 'right') {
      cindex = this.activeImage + index + 1;
    }
    if (position === 'left') {
      const leftSelectionSize = 5;
      cindex = this.activeImage - (leftSelectionSize - index);
    }
    return (
      cindex >= this.selectedImages.left && cindex <= this.selectedImages.right
    );
  }

  public moveToImage(e: MouseEvent, indexToMove: number) {
    if (!this.activeCapture && !this.isPlaying) {
      if (e.ctrlKey) {
        // add to selection
        if (
          this.selectedImagesForReal.includes(this.activeImage + indexToMove)
        ) {
          this.selectedImagesForReal.splice(
            this.selectedImagesForReal.indexOf(this.activeImage + indexToMove),
            1,
          );
        } else {
          this.selectedImagesForReal.push(this.activeImage + indexToMove);
        }
      }
      if (e.shiftKey) {
        this.selectedImagesForReal = [];
        if (indexToMove > 0) {
          this.selectedImagesForReal = _.uniq(
            this.selectedImagesForReal.concat(
              _.range(this.activeImage + 1, this.activeImage + indexToMove + 1),
            ),
          );
        } else {
          this.selectedImagesForReal = _.uniq(
            this.selectedImagesForReal.concat(
              _.range(this.activeImage + indexToMove, this.activeImage),
            ),
          );
        }
      }
    }
    if (!e.shiftKey && !e.ctrlKey) {
      this.$emit('activeImageChange', this.activeImage + indexToMove);
      this.selectedImagesForReal = [];
    }
  }

  public onCopy() {
    if (!this.activeCapture && !this.isPlaying) {
      const tmpImgsToCopy = this.selectedImagesForReal;
      tmpImgsToCopy.push(this.activeImage);
      tmpImgsToCopy.sort((a: any, b: any) => a - b);
      this.imagesToCopy = tmpImgsToCopy.map(
        (index) => this.images[index].id as string,
      );
    }
  }

  public async onPaste() {
    if (!this.activeCapture && !this.isPlaying) {
      await asyncForEach(this.imagesToCopy, (imgref: string, index: number) => this.addImagesToShot([{
        shotId: this.activeShot,
        imageIndex: this.activeImage + 1 + index,
        image: imgref,
      }]));
      this.selectedImagesForReal = _.range(
        this.activeImage + 1,
        this.activeImage + 1 + this.imagesToCopy.length,
      );
    }
  }

  public async onReverse() {
    if (!this.activeCapture && !this.isPlaying) {
      const reverted = [...this.imagesToCopy].reverse();
      await asyncForEach(reverted, (imgref: string, index: number) => this.addImagesToShot([{
        shotId: this.activeShot,
        imageIndex: this.activeImage + 1 + index,
        image: imgref,
      }]));
      this.selectedImagesForReal = _.range(
        this.activeImage + 1,
        this.activeImage + 1 + this.imagesToCopy.length,
      );
    }
  }
}

async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
</script>
