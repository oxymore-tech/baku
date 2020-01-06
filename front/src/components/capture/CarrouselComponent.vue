<template>
  <div class="carrouselContainer">
    <!-- LEFT PART OF THE CARROUSEL -->
    <template v-for="(image, index) in computedLeftCarrousel">
      <template v-if="image !== null">
        <div
          :key="'left'+index"
          class="imageContainer"
          v-bind:class="{'inSelection': isInSelection(index, 'left')}"
        >
          <img
            class="carrouselThumb"
            :alt="image"
            :src="ImageCacheService.getThumbnail(image.id)"
            @click="moveToImage(index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
          />
        </div>
      </template>
      <template v-else>
        <div
          :key="'left'+index"
          @click="moveToImage(index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
          class="carrouselThumb"
        />
      </template>
    </template>

    <!-- ACTIVE IMAGE OR CAPTURE FRAME -->
    <template v-if="computedActiveImage !== null">
      <div
        class="imageContainer"
        v-bind:class="{'inSelection': isInSelection(activeImage, 'active')}"
      >
        <img
          v-if="computedActiveImage !== undefined"
          class="carrouselThumb active"
          :alt="computedActiveImage"
          :src="ImageCacheService.getThumbnail(computedActiveImage.id)"
        />
      </div>
    </template>
    <template v-else>
      <div class="carrouselThumb active">
        <CaptureButtonComponent
          v-if="activeDevice"
          :device="activeDevice"
          :projectId="projectId"
          :activeShot="activeShot"
          :activeIndex="activeImage+1"
          @captured="onCaptured"
          @uploaded="onUploaded"
          v-on:moveactiveframe="$emit('moveactiveframe', $event)"
        />
      </div>
    </template>

    <!-- RIGHT PART OF THE CARROUSEL -->
    <template v-for="(image, index) in computedRightCarrousel">
      <template v-if="image !== null">
        <div
          :key="'right'+index"
          class="imageContainer"
          v-bind:class="{'inSelection': isInSelection(index, 'right')}"
        >
          <img
            class="carrouselThumb"
            :alt="image"
            :src="ImageCacheService.getThumbnail(image.id)"
            @click="moveToImage(index + 1)"
          />
        </div>
      </template>
      <template v-else>
        <div
          :key="'right'+index"
          @click="moveToImage(index + 1)"
        />
      </template>
    </template>

    <template v-if="computedNextImages">
      <img
        style="display:none"
        v-for="image in computedNextImages"
        :key="image.id"
        :src="`/api/${projectId}/images/${activeShot}/${image}?width=185&height=104`"
      />
    </template>
  </div>
</template>

<style lang="scss">
.carrouselContainer {
  background: white;
  width: 100%;
  height: 104px;
  display: inline-flex;
  padding: 12px 21px;
  align-items: center;

  .imageContainer {
    border: 4px solid transparent;
    filter: grayscale(100%);

    .carrouselThumb {
      height: 78px;
      min-width: 140px;
      margin: 0px;
      border: 4px solid #f2f2f2;
      display: flex;
      justify-content: center;
      align-items: center;

      &.active {
        border: 4px solid #ff0000;
        box-sizing: content-box;
      }
    }

    &.inSelection {
      border: 4px solid #167df0;
      filter: grayscale(0%);
    }
  }
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import CaptureButtonComponent from '@/components/capture/CaptureButtonComponent.vue';
import { Device } from '@/api/device.class';
import { ImageCacheService } from '@/api/imageCache.service';
import { ImageRef, UploadedImage } from '@/api/uploadedImage.class';
import { ReadingSliderBoundaries } from '../../api/movie.service';

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

  @CaptureNS.State
  public activeDevice!: Device;

  @ProjectNS.Action('addImageToShot')
  protected addImageToShot!: ({ }) => Promise<void>;

  @ProjectNS.State
  public selectedImagesBoundaries!: ReadingSliderBoundaries;

  mounted() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      let indexToMove = 0;
      switch (e.keyCode) {
        case 37:
          indexToMove = -1;
          break;
        case 39:
          indexToMove = 1;
          break;
        default:
          indexToMove = 0;
      }
      this.$emit('moveactiveframe', indexToMove);
    });
  }

  get computedLeftCarrousel(): ImageRef[] {
    const sliceIndex = this.activeCapture
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex).slice(-5);
    return Array(5 - leftImagesAvaible.length)
      .fill(null)
      .concat(leftImagesAvaible);
  }

  get computedActiveImage(): ImageRef | null {
    return this.activeCapture ? null : this.images[this.activeImage];
  }

  public onUploaded(id: string) {
    ImageCacheService.startPreloadingImage(new UploadedImage(this.projectId, id), () => this.$forceUpdate());
  }

  public async onCaptured(id: string, thumb: Blob) {
    await this.addImageToShot({
      shotId: this.activeShot,
      imageIndex: this.activeImage + 1,
      image: id,
      thumb,
    });
    this.$emit('moveactiveframe', 1);
  }

  get computedRightCarrousel(): ImageRef[] {
    const sliceIndex = this.activeImage + 1;
    const rightImagesAvaible = this.images.slice(sliceIndex).slice(0, 6);
    return rightImagesAvaible.concat(
      Array(6 - rightImagesAvaible.length).fill(null),
    );
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
    return cindex >= this.selectedImagesBoundaries.left && cindex <= this.selectedImagesBoundaries.right;
  }

  public moveToImage(indexToMove: number) {
    this.$emit('moveactiveframe', indexToMove);
  }
}

</script>
