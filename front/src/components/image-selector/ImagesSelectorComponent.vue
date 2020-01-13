<template>
  <div>
    <b-field v-if="selectedImages">

      <ReadingSliderComponent
        v-model="selectedImages"
        :min="0"
        :max="max"
        :step="1"
        class="reading-slider-component"
      >
      </ReadingSliderComponent>
    </b-field>
  </div>
</template>

<style lang="scss">
.reading-slider-component {
  margin-left: 4px;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageRef } from '@/api/uploadedImage.class';
import ReadingSliderComponent from '@/components/image-selector/ReadingSliderComponent.vue';
import ReadingSliderTickComponent from '@/components/image-selector/ReadingSliderTickComponent.vue';
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
    return { ...this.$store.state.project.selectedImagesBoundaries, selected: this.activeImage };
  }

  set selectedImages(value: ReadingSliderValue) {
    this.$emit('moveactiveframe', value.selected - this.activeImage);
    this.$store.commit('project/setSelectedImagesBoundaries', { left: value.left, right: value.right });
  }

  mounted() {
    this.max = this.images.length - 1;
  }
}
</script>
