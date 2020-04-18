<template>
  <div>
    <ReadingSliderComponent
      :value="sliderValue"
      @input="onSliderValueChange"
      :min="0"
      :max="images.length - 1"
      :step="1"
      :customFormatter="val => (parseInt(val,10) + 1).toString()"
      class="reading-slider-component"
    ></ReadingSliderComponent>
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
import {
  ReadingSliderBoundaries,
  ReadingSliderValue,
} from '@/api/movie.service';

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
  public value!: ReadingSliderBoundaries;

  get sliderValue() {
    return {
      left: this.value.left,
      right: Math.min(this.value.right, this.images.length - 1),
      selected: this.activeImage,
    };
  }

  onSliderValueChange(newSliderValue: ReadingSliderValue) {
    if (this.activeImage !== newSliderValue.selected) {
      this.$emit('activeImageChange', newSliderValue.selected);
    }
    if (
      this.value.left !== newSliderValue.left
      || this.value.right !== newSliderValue.right
    ) {
      this.$emit('input', {
        left: newSliderValue.left,
        right: newSliderValue.right,
      });
    }
  }
}
</script>
