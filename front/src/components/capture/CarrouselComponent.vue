<template>
    <div class="carrouselContainer">
        <!-- LEFT PART OF THE CARROUSEL -->
        <template v-for="(image, index) in computedLeftCarrousel">
            <template v-if="image !== null">
                <div :key="'left'+index" class="imageContainer">
                    <img
                            class="carrouselThumb"
                            :alt="image"
                            :src="ImageCacheService.getThumbnail(image.id)"
                            v-bind:class="{'inSelection': isInSelection(index, 'left')}"
                            @click="moveToImage(index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
                    />
                </div>
            </template>
            <template v-else>
                <div :key="'left'+index" class="imageContainer">
                    <div
                            @click="moveToImage(index - computedLeftCarrousel.length + (activeCapture ? 1 : 0))"
                            class="carrouselThumb"
                    />
                </div>
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
                <div :key="'right'+index" class="imageContainer">
                    <img
                            class="carrouselThumb"
                            :alt="image"
                            :src="ImageCacheService.getThumbnail(image.id)"
                            v-bind:class="{'inSelection': isInSelection(index, 'right')}"
                            @click="moveToImage(index + 1)"
                    />
                </div>
            </template>
            <template v-else>
                <div :key="'right'+index" @click="moveToImage(index + 1)"/>
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
            border: 2px solid transparent;
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
                    border: 3px solid #FFBD72;
                    border-radius: 4px;
                    padding: 1px;
                    box-sizing: content-box;
                }
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
  import { ReadingSliderBoundaries } from '@/api/movie.service';

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

    mounted() {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        let indexToMove: number;
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
        this.$emit('activeImageChange', this.activeImage + indexToMove);
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

    public imageReady(imageId: string) {
      if (this.images.find(i => i.id === imageId)) {
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

    public async onCaptured(id: string, thumb: Blob) {
      ImageCacheService.putImageBlobInCache(id, b64);
      const newActiveFrame = this.activeImage + 1;
      await this.addImageToShot({
        shotId: this.activeShot,
        imageIndex: newActiveFrame,
        image: id,
        thumb,
      });
      this.$store.commit('project/incAction', 1);
      this.$emit('activeImageChange', newActiveFrame);
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
      return (
        cindex >= this.selectedImages.left
        && cindex <= this.selectedImages.right
      );
    }

    public moveToImage(indexToMove: number) {
      this.$emit('activeImageChange', this.activeImage + indexToMove);
    }
  }
</script>
