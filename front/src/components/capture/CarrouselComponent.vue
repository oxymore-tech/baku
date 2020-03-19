<template>
  <div>
    <div class="toolbar">
      <div class="toolbar-button" @click="onCopy()" :class="{disabled : activeCapture}">
        <i class="icon-copy baku-button" />
        <span>Copier</span>
      </div>
      <div class="toolbar-button" @click="onPaste()" :class="{disabled: activeCapture}">
        <i class="icon-paste baku-button" />
        <span>Coller</span>
      </div>
      <div class="toolbar-button" @click="onReverse()" :class="{disabled: activeCapture}">
        <i class="icon-reverse baku-button" />
        <span>Inverser</span>
      </div>
      <div class="toolbar-button" @click="deleteFrame()" :class="{disabled: activeCapture}">
        <i class="icon-trash-alt baku-button" />
        <span>Supprimer</span>
      </div>
    </div>
    <div id="carrouselContainer" class="carrouselContainer">
      <!-- LEFT PART OF THE CARROUSEL -->
      <template v-for="(image, index) in computedLeftCarrousel">
        <template v-if="image !== null">
          <div :key="'left'+index" class="imageContainer">
            <span class="framenumber-indicator">{{ index + 1 }}</span>
            <img
              class="carrouselThumb"
              :alt="image"
              :class="{active : selectedImagesForReal.includes(index)}"
              :src="ImageCacheService.getThumbnail(image.id)"
              @click="moveToImage($event, index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
            />
          </div>
        </template>
        <template v-else>
          <div :key="'left'+index" class="imageContainer">
            <div
              @click="moveToImage($event, index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
              class="carrouselThumb"
            />
          </div>
        </template>
      </template>

      <!-- ACTIVE IMAGE OR CAPTURE FRAME -->
      <template v-if="computedActiveImage !== null">
        <div class="imageContainer">
          <span class="framenumber-indicator">{{ activeImage + 1 }}</span>
          <img
            v-if="computedActiveImage !== undefined"
            class="carrouselThumb active previewed"
            :alt="computedActiveImage"
            :src="ImageCacheService.getThumbnail(computedActiveImage.id)"
          />
        </div>
      </template>
      <template v-else>
        <div id="captureButtonComponent" class="carrouselThumb active">
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
          <div :key="'right'+index" class="imageContainer">
            <span class="framenumber-indicator">{{ activeImage + index + 2 }}</span>
            <img
              class="carrouselThumb"
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

      <template v-if="computedNextImages">
        <img
          style="display:none"
          v-for="image in computedNextImages"
          :key="image.id"
          :src="ImageCacheService.getThumbnail(image.id)"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.toolbar {
  display: inline-flex;
  width: 100%;
  background: #ffffff;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #f2f2f2;
  padding: 11px 28px;
}

.toolbar-button {
  margin: 0 5px;
  cursor: pointer;
}

.disabled {
  color: lightgray;
  cursor: not-allowed;
}

.carrouselContainer {
  background: white;
  width: 100%;
  height: 104px;
  display: inline-flex;
  flex-wrap: nowrap;
  overflow-x: scroll;
  overflow-y: hidden;
  padding: 12px 21px;
  align-items: center;

  .framenumber-indicator {
    position: absolute;
    left: 0;
    top: 0;
    padding: 0px 3px;
    border-radius: 60%;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.8);
  }

  .imageContainer {
    border: 2px solid transparent;
    position: relative;
    // filter: grayscale(100%);

    .carrouselThumb {
      height: 78px;
      min-width: 140px;
      margin: 0px 15px;
      border: 2px solid #f2f2f2;
      display: flex;
      justify-content: center;
      align-items: center;

      &.active {
        border: 3px solid #ffbd72;
        border-radius: 4px;
        padding: 1px;
        box-sizing: content-box;
      }

      &.previewed {
        background-color: red;
      }
    }
  }
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
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
    const container = document.getElementById('carrouselContainer');
    const captureButtonComponent = document.getElementById(
      'captureButtonComponent',
    );
    if (container && captureButtonComponent) {
      console.log(captureButtonComponent.offsetWidth);
      container.scrollTo(captureButtonComponent.offsetLeft, 0);
    }
  }

  public async deleteFrame() {
    if (!this.activeCapture) {
      const imagesToDelete = this.selectedImagesForReal;
      imagesToDelete.push(this.activeImage);
      imagesToDelete.sort();
      await asyncForEach(imagesToDelete, (imgId: number, index: number) => this.removeImageFromShot({
        shotId: this.activeShot,
        imageIndex: imgId - index,
      }));
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
      await asyncForEach(this.imagesToCopy, (imgref: string, index: number) => this.addImageToShot({
        shotId: this.activeShot,
        imageIndex: this.activeImage + 1 + index,
        image: imgref,
      }));
    }
  }

  public async onReverse() {
    if (!this.activeCapture) {
      await asyncForEach(
        _.reverse(this.imagesToCopy),
        (imgref: string, index: number) => this.addImageToShot({
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        }),
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
