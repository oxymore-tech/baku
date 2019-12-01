<template>
  <div class="carrouselContainer">
    <!-- LEFT PART OF THE CARROUSEL -->
    <template v-for="(image, index) in computedLeftCarrousel">
      <template v-if="image !== null">
        <img
          class="carrouselThumb"
          :key="'left'+index"
          :alt="image"
          :src="`/api/${projectId}/images/${activeShot}/${image}?width=185&height=104`"
          @click="moveToImage(index - computedLeftCarrousel.length)"
        />
      </template>
      <template v-else>
        <div :key="image" class="carrouselThumb"></div>
      </template>
    </template>

    <!-- ACTIVE IMAGE OR CAPTURE FRAME -->
    <template v-if="computedActiveImage !== null">
      <img
        v-if="computedActiveImage !== undefined"
        class="carrouselThumb active"
        :alt="computedActiveImage"
        :src="`/api/${projectId}/images/${activeShot}/${computedActiveImage}?width=185&height=104`"
      />
    </template>
    <template v-else>
      <div class="carrouselThumb active">
        <img class="captureIcon" src="@/assets/camera-solid-orange.svg" />
      </div>
    </template>

    <!-- RIGHT PART OF THE CARROUSEL -->
    <template v-for="(image, index) in computedRightCarrousel">
      <template v-if="image !== null">
        <img
          class="carrouselThumb"
          :key="'right-'+index"
          :alt="image"
          :src="`/api/${projectId}/images/${activeShot}/${image}?width=185&height=104`"
          @click="moveToImage(index + 1)"
        />
      </template>
      <template v-else>
        <div :key="image" class="carrouselThumb"></div>
      </template>
    </template>
    <template v-if="computedNextImages">
      <img
        style="display:none"
        v-for="image in computedNextImages"
        :key="image"
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

  .carrouselThumb {
    height: 78px;
    min-width: 140px;
    margin: 0 7px;
    border: 1px solid #f2f2f2;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .inSelection {
    border: 1px solid #27a2bb;
  }

  .active {
    border: 2px solid #455054;
    box-sizing: content-box;
    border-radius: 3px;
  }

  .captureIcon {
    width: 48px;
    height: 43px;
  }
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageRef } from '@/api/baku.service';

  @Component
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

  get computedLeftCarrousel(): ImageRef[] {
    const sliceIndex = this.activeCapture
      ? this.activeImage + 1
      : this.activeImage;
    const leftImagesAvaible = this.images.slice(0, sliceIndex).slice(-5);
    const leftCarrousel = Array(5 - leftImagesAvaible.length)
      .fill(null)
      .concat(leftImagesAvaible);
    return leftCarrousel;
  }

  get computedActiveImage(): ImageRef | null {
    return this.activeCapture ? null : this.images[this.activeImage];
  }

  get computedRightCarrousel(): ImageRef[] {
    const sliceIndex = this.activeImage + 1;
    const rightImagesAvaible = this.images.slice(sliceIndex).slice(0, 6);
    const rightCarrousel = rightImagesAvaible.concat(
      Array(6 - rightImagesAvaible.length).fill(null),
    );
    return rightCarrousel;
  }

  get computedNextImages(): ImageRef[] {
    const sliceIndex = this.activeImage + 7;
    return this.images.slice(sliceIndex, sliceIndex + 20);
  }

  public moveToImage(indexToMove: number) {
    this.$emit('moveactiveframe', indexToMove);
  }

  mounted() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      let indexToMove = 0;
      switch (e.keyCode) {
        case 37:
          indexToMove = this.activeImage > 0 ? -1 : 0;
          break;
        case 39:
          indexToMove = this.images.length - 1 > this.activeImage ? 1 : 0;
          break;
        default:
          indexToMove = 0;
      }
      this.$emit('moveactiveframe', indexToMove);
    });
  }
}
</script>
