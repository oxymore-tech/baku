<template>
  <div>
    <!-- <b-field v-if="selectedImagesOLD">
            <b-slider
        v-model="selectedImagesOLD"
        :min="0"
        :max="max"
        :step="1"
        type="is-info"
        ticks
      ></b-slider>
    </b-field> -->
    <br />
    <b-field v-if="selectedImages">

      <ReadingSliderComponent
        v-model="selectedImages"
        :min="0"
        :max="max"
        :step="1"
      >
        <ReadingSliderTickComponent :value="activeImage">I</ReadingSliderTickComponent>
      </ReadingSliderComponent>
    </b-field>
  </div>
</template>

<style lang="scss">
span.b-slider-tick-label {
  background-color: #fbb10d;
  color: #fbb10d;
  width: 8px;
  border-radius: 2px;
  top: calc(-0.5rem / 2 - 2px) !important;
}
</style>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ImageRef } from '@/api/uploadedImage.class';
import ReadingSliderComponent from '@/components/capture/ReadingSliderComponent.vue';
import ReadingSliderTickComponent from '@/components/capture/ReadingSliderTickComponent.vue';
import { ReadingSliderValue } from '@/api/movie.service';

@Component({
  components: {
    ReadingSliderComponent,
    ReadingSliderTickComponent,
  },
})
export default class ImagesSelectorComponent extends Vue {
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

  public max = 6;

  get selectedImages() {
    console.log('GET selectedImages', this.$store.state.project.selectedImagesBoundaries);
    // return this.$store.state.project.selectedImagesBoundaries;
    return { ...this.$store.state.project.selectedImagesBoundaries, selected: this.activeImage };
  }

  set selectedImages(value: ReadingSliderValue) {
    console.log('SET selectedImages', value);
    this.$store.commit('project/setSelectedImagesBoundaries', { left: value.left, right: value.right });
  }

  // @Watch('selectedImages')
  // onChangeSelectedImages(value: ReadingSliderValue) {
  //   console.log('onChangeSelectedImages', value);
  // }

  // get selectedImagesOLD() {
  //   console.log('selectedImagesOLD', this.$store.state.project.selectedImages);
  //   return [this.$store.state.project.selectedImages.left, this.$store.state.project.selectedImages.right];
  // }

  // set selectedImagesOLD(value: number[]) {
  //   console.log('SET selectedImagesOLD', value);
  //   this.$store.commit('project/setSelectedImages', value);
  // }

  mounted() {
    this.max = this.images.length - 1;
  }
}
</script>
