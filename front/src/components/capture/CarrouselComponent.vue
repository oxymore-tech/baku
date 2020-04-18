<style lang="scss" scoped>
  @import "../../styles/carrousel.scss";
</style>

<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-button" @click="onCopy()" :class="{disabled : activeCapture}">
        <i class="icon-copy baku-button" />
        <span>Copier</span>
      </div>
      <div
        class="toolbar-button"
        @click="onPaste()"
        :class="{disabled: activeCapture || !imagesToCopy.length}"
      >
        <i class="icon-paste baku-button" />
        <span>Coller</span>
      </div>
      <div
        class="toolbar-button"
        @click="onReverse()"
        :class="{disabled: activeCapture || !imagesToCopy.length}"
      >
        <i class="icon-reverse baku-button" />
        <span>Coller & Inverser</span>
      </div>
      <div class="toolbar-button" @click="deleteFrame()" :class="{disabled: activeCapture}">
        <i class="icon-trash-alt baku-button" />
        <span>Supprimer</span>
      </div>
    </div>
    <div ref="carrouselContainer" class="carrousel-container">
      <!-- LEFT PART OF THE CARROUSEL -->
      <!-- Five divs to center capture button -->
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <template v-for="(image, index) in computedLeftCarrousel">
        <template v-if="image !== null">
          <div :key="'left'+index" class="image-container">
            <span class="framenumber-indicator">{{ index + 1 }}</span>
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
      <template v-if="computedActiveImage !== null">
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
        <div ref="captureButtonComponent" class="carrousel-thumb active">
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
        <template v-if="image !== null">
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
        <template v-else>
          <div :key="'right'+index" @click="moveToImage($event,index + 1)" />
        </template>
      </template>

      <!-- Five divs to center capture button -->
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
      <div class="image-container"  :style="{ display: activeCapture? 'block':'none'}">
        <div class="carrousel-thumb" />
      </div>
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
import {
  Component, Prop, Vue, Watch,
} from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as _ from 'lodash';
import CaptureButtonComponent from '@/components/capture/CaptureButtonComponent.vue';
import { Device } from '@/api/device.class';
import { ImageCacheService } from '@/api/imageCache.service';
import { ImageRef, UploadedImage } from '@/api/uploadedImage.class';
import { KeyCodes, ReadingSliderBoundaries } from '@/api/movie.service';

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
  public isPlaying!: 'animation' | 'selection' | null;

  @CaptureNS.State
  public activeDevice!: Device;

  @ProjectNS.Action('addImageToShot')
  protected addImageToShot!: ({}) => Promise<void>;

  @ProjectNS.Action('removeImageFromShot')
  protected removeImageFromShot!: ({}) => Promise<void>;

  protected selectedImagesForReal: number[] = [];

  private imagesToCopy: string[] = [];

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
          if (e.ctrlKey) {
            this.onCopy();
          }          
          break;
        case KeyCodes.V:
          if (e.ctrlKey) {
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
    this.$store.commit('project/incAction', -1);
  }

  public async onCaptured(id: string, thumb: Blob, b64: string) {
    ImageCacheService.putImageBlobInCache(id, b64);
    const newActiveFrame = this.activeImage + 1;
    await this.addImageToShot({
      shotId: this.activeShot,
      imageIndex: newActiveFrame,
      image: id,
    });
    this.$store.commit('project/incAction', 1);
    this.$emit('activeImageChange', newActiveFrame);
    const container = this.$refs.carrouselContainer as HTMLElement;
    const captureButtonComponent = this.$refs
      .captureButtonComponent as HTMLElement;

    if (container && captureButtonComponent) {
      container.scrollTo(
        captureButtonComponent.offsetLeft
          - container.clientWidth / 2
          + captureButtonComponent.clientWidth * 1.5,
        0,
      );
    }
  }

  public async deleteFrame() {
    if (!this.activeCapture) {
      const imagesToDelete = this.selectedImagesForReal;
      imagesToDelete.push(this.activeImage);
      imagesToDelete.sort();
      imagesToDelete.reverse();
      Promise.all(
        imagesToDelete.map((imgId: number) => this.removeImageFromShot({
          shotId: this.activeShot,
          imageIndex: imgId,
        })),
      );
      this.selectedImagesForReal = [];
    }
  }

  get computedActiveImage(): ImageRef | null {
    return this.activeCapture ? null : this.images[this.activeImage];
  }

  get computedLeftCarrousel(): ImageRef[] {
    const sliceIndex = this.activeCapture
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex);
    return leftImagesAvaible;
  }

  get computedRightCarrousel(): ImageRef[] {
    const sliceIndex = this.activeImage + 1;
    const rightImagesAvaible = this.images.slice(sliceIndex);
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
    if (!this.activeCapture) {
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
    if (!this.activeCapture) {
      const tmpImgsToCopy = this.selectedImagesForReal;
      tmpImgsToCopy.push(this.activeImage);
      tmpImgsToCopy.sort();
      this.imagesToCopy = tmpImgsToCopy.map(
        (index) => this.images[index].id as string,
      );
    }
  }

  public async onPaste() {
    if (!this.activeCapture) {
      Promise.all(
        this.imagesToCopy.map((imgref: string, index: number) => this.addImageToShot({
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        })),
      );
      this.selectedImagesForReal = _.range(
        this.activeImage + 1,
        this.activeImage + 1 + this.imagesToCopy.length,
      );
    }
  }

  public async onReverse() {
    if (!this.activeCapture) {
      const reverted = [...this.imagesToCopy].reverse();
      Promise.all(
        reverted.map((imgref: string, index: number) => this.addImageToShot({
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        })),
      );
      this.selectedImagesForReal = _.range(
        this.activeImage + 1,
        this.activeImage + 1 + this.imagesToCopy.length,
      );
    }
  }

  @Watch('activeImage')
  public moveToActiveImageOnPause() {
    if (!this.activeCapture) {
      // trick to start after vue change detection
      setTimeout(() => {
        const carrouselActiveImg = this.$refs.carrouselActiveImg as HTMLElement;
        if (carrouselActiveImg) {
          carrouselActiveImg.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    } else {
      setTimeout(() => {
        const container = this.$refs.carrouselContainer as HTMLElement;
        const captureButtonComponent = this.$refs
          .captureButtonComponent as HTMLElement;

        if (container && captureButtonComponent) {
          container.scrollTo(
            captureButtonComponent.offsetLeft
              - container.clientWidth / 2
              + captureButtonComponent.clientWidth / 2,
            0,
          );
        }
      });
    }
  }
}
</script>
