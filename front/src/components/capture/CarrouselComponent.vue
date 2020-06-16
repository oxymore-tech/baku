<style lang="scss" scoped>
@import "@/styles/carrousel.scss";
</style>

<template>
  <div class="carrousel-root-div">
    <div class="toolbar">
      <div v-if="!isMultiSelect"
        class="toolbar-button"
        @click="changeSelection(0, images.length - 1)"
        :class="{disabled : isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-copy baku-button" />
        <span>Tout sélectionner</span>
      </div>
      <div v-else
        class="toolbar-button"
        @click="$emit('resetSelection')"
        :class="{disabled : isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-copy baku-button" />
        <span>Tout désélectionner</span>
      </div>
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
        <i class="icon-cut baku-button" />
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
        :class="{disabled: isFrameLiveView || !isMultiSelect || isPlaying || !canEdit}"
      >
        <i class="icon-reverse baku-button" />
        <span>Inverser</span>
      </div>
      <div
        class="toolbar-button delete-button"
        @click="deleteFrame()"
        :class="{disabled: isFrameLiveView || isPlaying || !canEdit}"
      >
        <i class="icon-trash-alt baku-button" />
        <span>Supprimer</span>
      </div>
    </div>
    <div ref="carrouselContainer" class="carrousel-container">
      <template v-for="(image, index) in computedPreviousShotImages">
        <template v-if="image !== null">
          <div
            :key="'left'+index+'-prev'"
            class="image-container previous-shot-images"
          >
            <img
              class="carrousel-thumb"
              :alt="image"
              :src="ImageCacheService.getThumbnail(image.id)"
            />
          </div>
        </template>
        <template v-else>
          <div :key="'left'+index+'-prev'" class="image-container image-container-empty">
            <div
              class="carrousel-thumb"
              style="width:100%; border:none"
            />
          </div>
        </template>
      </template>
      <!-- LEFT PART OF THE CARROUSEL -->
      <template v-for="(image, index) in computedLeftCarrousel">
        <template v-if="image !== null">
          <div
            :key="'left'+index"
            class="image-container"
            :class="{active : selectedImagesForReal.includes(activeImage - (computedLeftCarrousel.length - index))}"
          >
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
          <div :key="'left'+index" class="image-container image-container-empty">
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
          <div
            :key="'right'+index"
            class="image-container"
            :class="{active : selectedImagesForReal.includes(activeImage + index +1)}"
          >
            <span
              v-if="image !== 'liveview' || canEdit"
              class="framenumber-indicator"
            >{{ activeImage + index + 2 }}</span>
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
            >En attente de capture</div>
          </div>
        </template>
        <template v-if="image === null">
          <div :key="'right'+index" class="image-container image-container-empty">
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
import { KeyCodes, ReadingSliderBoundaries, Shot } from '@/utils/movie.service';

const CaptureNS = namespace('capture');
const ProjectNS = namespace('project');
const ClipboardNS = namespace('clipboard');

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

  @ProjectNS.Action('reverseImages')
  protected reverseImages!: ({}) => Promise<void>;

  @ProjectNS.Getter('canEditActiveShot')
  protected canEdit!: boolean;

  @ProjectNS.Getter('getPreviousShot')
  protected previousShot!: Shot | undefined;

  @ProjectNS.Getter('getActiveShotIndex')
  protected getActiveShotIndex!: number;

  @ClipboardNS.State('images')
  private imagesToCopy!: string[];

  @ClipboardNS.Action('changeClipboard')
  protected changeClipboard!: (images: string[]) => Promise<void>;

  mounted() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e as any).target.id != 'shotSynopsis') {
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
            if (e.shiftKey) {
              if (this.activeImage - 1 < this.selectedImages.left && this.isMultiSelect) {
                this.$emit('increaseSelection', this.activeImage - 1);
              } else if (!this.isMultiSelect) {
                this.$emit('changeSelection', { left: this.activeImage - 1, right: this.activeImage });
              }
            } else if (this.isMultiSelect && this.activeImage - 1 < this.selectedImages.left) {
              this.$emit('resetSelection');
            }
            this.$emit('moveFrame', -1);
            break;
          case KeyCodes.RIGHT_ARROW:
            if (e.shiftKey) {
              if (this.activeImage + 1 > this.selectedImages.right && this.isMultiSelect) {
                this.$emit('increaseSelection', this.activeImage + 1);
              } else if (!this.isMultiSelect) {
                this.$emit('changeSelection', { left: this.activeImage, right: this.activeImage + 1 });
              }
            } else if (this.isMultiSelect && this.activeImage + 1 > this.selectedImages.right) {
              this.$emit('resetSelection');
            }
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
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if ((e as any).target.id != 'shotSynopsis') {
        switch (e.keyCode) {
          case KeyCodes.LEFT_ARROW:
          case KeyCodes.RIGHT_ARROW:
            this.$emit('stopMovingFrame', e);
            break;
          default:
            break;
        }
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
      imagesToDelete.sort((a: any, b: any) => b - a);
      this.removeImagesFromShot(
        imagesToDelete.map((imgId: number) => ({
          shotId: this.activeShot,
          imageIndex: imgId,
        })),
      );
      this.$emit('activeImageChange', imagesToDelete[0] - 1);
      this.$emit('resetSelection');
    }
  }

  get computedActiveImage(): ImageRef | null {
    return this.images[this.activeImage];
  }

  get computedPreviousShotImages(): ImageRef[] {
    const count = 5 - this.computedLeftCarrousel.length;
    const images = this.previousShot ? (this.previousShot.images || []) : [];
    let leftImagesAvaible = images.slice(-count);
    if (this.getActiveShotIndex === 0 || count === 0) {
      leftImagesAvaible = [];
    }
    return new Array(Math.max(0, count - leftImagesAvaible.length))
      .fill(null)
      .concat(leftImagesAvaible);
  }

  get computedLeftCarrousel(): ImageRef[] {
    const count = 5;
    const sliceIndex = this.isFrameLiveView
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex).slice(-count);
    return leftImagesAvaible;
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
      return [this.activeImage];
    }
    return _.range(this.selectedImages.left, this.selectedImages.right + 1);
  }

  get computedNextImages(): ImageRef[] {
    const sliceIndex = this.activeImage + 7;
    return this.images.slice(sliceIndex, sliceIndex + 20);
  }

  get isMultiSelect(): boolean {
    return this.selectedImages.left !== this.selectedImages.right;
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
      tmpImgsToCopy.sort((a: any, b: any) => a - b);
      this.changeClipboard(tmpImgsToCopy.map(
        (index) => this.images[index].id as string,
      ));
    }
  }

  public async onCut() {
    this.onCopy();
    await this.deleteFrame();
    this.$emit('resetSelection');
  }

  public async onPaste() {
    if (!this.isFrameLiveView && !this.isPlaying && this.canEdit) {
      this.addImagesToShot(
        this.imagesToCopy.map((imgref: string, index: number) => ({
          shotId: this.activeShot,
          imageIndex: this.activeImage + 1 + index,
          image: imgref,
        })),
      );
      this.$emit('activeImageChange', this.activeImage + 1);
      this.changeSelection(this.activeImage + 1, this.activeImage + this.imagesToCopy.length);
    }
  }

  public changeSelection(left: number, right: number) {
    this.$emit('changeSelection', {
      left,
      right,
    });
  }

  public async onPasteAndReverse() {
    if (
      !this.isFrameLiveView
      && !this.isPlaying
      && this.isMultiSelect
      && this.canEdit
    ) {
      this.reverseImages({
        shotId: this.activeShot,
        imageIndexLeft: this.selectedImages.left,
        imageIndexRight: this.selectedImages.right,
      });
      // const reverted = [...this.imagesToCopy].reverse();
      // this.addImagesToShot(
      //   reverted.map((imgref: string, index: number) => ({
      //     shotId: this.activeShot,
      //     imageIndex: this.activeImage + 1 + index,
      //     image: imgref,
      //   })),
      // );
      // this.$emit('resetSelection');
    }
  }
}
</script>
