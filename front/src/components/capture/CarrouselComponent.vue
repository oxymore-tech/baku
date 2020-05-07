<style lang="scss" scoped>
@import "@/styles/carrousel.scss";
</style>

<template>
  <div>
    <div class="toolbar">
      <div
        class="toolbar-button"
        @click="onCopy()"
        :class="{disabled : isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-copy baku-button" />
        <span>Copier</span>
      </div>
      <div
        class="toolbar-button"
        @click="onCut()"
        :class="{disabled : isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-copy baku-button" />
        <span>Couper</span>
      </div>
      <div
        class="toolbar-button"
        @click="onPaste()"
        :class="{disabled: isFrameLiveView || !imagesToCopy.length || isPlaying || !canEdit}"
      >
        <i class="icon-paste baku-button" />
        <span>Coller</span>
      </div>
      <div
        class="toolbar-button"
        @click="onPasteAndReverse()"
        :class="{disabled: isFrameLiveView || imagesToCopy.length < 2 || isPlaying || !canEdit}"
      >
        <i class="icon-reverse baku-button" />
        <span>Coller & Inverser</span>
      </div>
      <div
        class="toolbar-button"
        @click="deleteFrame()"
        :class="{disabled: isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-trash-alt baku-button" />
        <span>Supprimer</span>
      </div>
    </div>
    <div ref="carrouselContainer" class="carrousel-container">
      <!-- LEFT PART OF THE CARROUSEL -->
      <template v-for="(image, index) in computedLeftCarrousel">
        <template v-if="image !== null">
          <div :key="'left'+index" class="image-container"  :class="{active : selectedImagesForReal.includes(activeImage - (computedLeftCarrousel.length - index))}">
            <span
              class="framenumber-indicator"
            >{{ activeImage +1 - (computedLeftCarrousel.length - index) }}</span>
            <img
              class="carrousel-thumb"
              :alt="image"
              :src="ImageCacheService.getThumbnail(image.id)"
              @click="moveToImage($event, index - computedLeftCarrousel.length)"
            />
          </div>
        </template>
        <template v-else>
          <div :key="'left'+index" class="image-container">
            <div
              @click="moveToImage($event, index - computedLeftCarrousel.length + (isFrameLiveView ? 1 : 0))"
              class="carrousel-thumb"
              style="width:100%; border:none"
            />
          </div>
        </template>
      </template>

      <!-- ACTIVE IMAGE OR CAPTURE FRAME -->
      <template v-if="computedActiveImage">
        <div class="image-container active" ref="carrouselActiveImg">
          <span class="framenumber-indicator">{{ activeImage + 1 }}</span>
          <img
            v-if="computedActiveImage !== undefined"
            class="carrousel-thumb previewed"
            :alt="computedActiveImage"
            :src="ImageCacheService.getThumbnail(computedActiveImage.id)"
          />
        </div>
      </template>
      <div class="image-container active active-capure" style="position:relative" v-else>
        <div class="carrousel-thumb active" :v-if="canEdit">En attente de capture</div>
      </div>

      <!-- RIGHT PART OF THE CARROUSEL -->
      <template v-for="(image, index) in computedRightCarrousel">
        <template v-if="image !== null">
          <div :key="'right'+index" class="image-container" :class="{active : selectedImagesForReal.includes(activeImage + index +1)}">
            <span v-if="image !== 'liveview' || canEdit" class="framenumber-indicator">{{ activeImage + index + 2 }}</span>
            <img
              v-if="image !== 'liveview'"
              class="carrousel-thumb"
              :alt="image"
              :src="ImageCacheService.getThumbnail(image.id)"
              @click="moveToImage($event,index + 1)"
            />
            <div
              v-else-if="canEdit"
              @click="moveToImage($event,index + 1)"
              class="carrousel-thumb active waiting-capture"
            >
             En attente de capture
            </div>
          </div>
        </template>
        <template v-if="image === null">
          <div :key="'right'+index" class="image-container">
            <div
              @click="moveToImage($event,index + 1)"
              class="carrousel-thumb"
              style="width:100%; border:none"
            />
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
import { ImageRef } from '@/utils/uploadedImage.class';
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
  public isFrameLiveView!: boolean;

  @Prop()
  public selectedImages!: ReadingSliderBoundaries;

  @Prop()
  public isPlaying!: boolean;

  @CaptureNS.State
  public activeDevice!: Device;

  @ProjectNS.Action('addImagesToShot')
  protected addImagesToShot!: ({}) => Promise<void>;

  @ProjectNS.Action('removeImagesFromShot')
  protected removeImagesFromShot!: ({}) => Promise<void>;

  @ProjectNS.Getter('canEditActiveShot')
  protected canEdit!: boolean;

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

  public async deleteFrame() {
    if (!this.isFrameLiveView && !this.isPlaying && this.canEdit) {
      const imagesToDelete = this.selectedImagesForReal;
      imagesToDelete.push(this.activeImage);
      imagesToDelete.sort((a: any, b: any) => b - a);
      await asyncForEach(imagesToDelete, (imgId: number) => this.removeImagesFromShot([{
        shotId: this.activeShot,
        imageIndex: imgId,
      }]));
    }
  }

  get computedActiveImage(): ImageRef | null {
    return this.images[this.activeImage];
  }

  get computedLeftCarrousel(): ImageRef[] {
    const count = 5;
    const sliceIndex = this.isFrameLiveView
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex).slice(-count);
    return new Array(count - leftImagesAvaible.length)
      .fill(null)
      .concat(leftImagesAvaible);
  }

  get computedRightCarrousel(): ImageRef[] {
    const count = 5;
    const sliceIndex = this.activeImage + 1;
    const rightImagesAvaible = this.images.slice(sliceIndex).slice(0, count);
    if (
      rightImagesAvaible.length < count
      && this.activeImage !== this.images.length
    ) {
      rightImagesAvaible.push(('liveview' as unknown) as ImageRef);
    }
    return rightImagesAvaible.concat(
      new Array(count - rightImagesAvaible.length).fill(null),
    );
  }

  get selectedImagesForReal() {
    if (this.selectedImages.left === this.selectedImages.right) {
      return [];
    }
    return _.range(this.selectedImages.left, this.selectedImages.right + 1);
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
    if (!this.isFrameLiveView && !this.isPlaying) {
      if (e.shiftKey) {
        // add to selection
        this.$emit('increaseSelection', this.activeImage + indexToMove);
      }
    }
    if (!e.shiftKey && !e.ctrlKey) {
      this.$emit('activeImageChange', this.activeImage + indexToMove);
    }
  }

  public onCopy() {
    if (!this.isFrameLiveView && !this.isPlaying && this.canEdit) {
      const tmpImgsToCopy = this.selectedImagesForReal;
      tmpImgsToCopy.push(this.activeImage);
      tmpImgsToCopy.sort((a: any, b: any) => a - b);
      this.imagesToCopy = tmpImgsToCopy.map(
        (index) => this.images[index].id as string,
      );
    }
  }

  public async onCut() {
    this.onCopy();
    await this.deleteFrame();
  }

  public async onPaste() {
    if (!this.isFrameLiveView && !this.isPlaying && this.canEdit) {
      await asyncForEach(this.imagesToCopy, (imgref: string, index: number) => this.addImagesToShot([
        {
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        },
      ]));
    }
  }

  public async onPasteAndReverse() {
    if (!this.isFrameLiveView && !this.isPlaying && this.imagesToCopy.length < 2 && this.canEdit) {
      const reverted = [...this.imagesToCopy].reverse();
      await asyncForEach(reverted, (imgref: string, index: number) => this.addImagesToShot([
        {
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        },
      ]));
    }
  }
}

async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
</script>
