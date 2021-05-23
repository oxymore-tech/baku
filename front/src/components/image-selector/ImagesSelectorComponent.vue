<template>
  <div>
    <ReadingSliderComponent
      :value="sliderValue"
      @input="onSliderValueChange"
      ref="slider"
      :min="0"
      :max="canEdit ? images.length : images.length - 1"
      :step="1"
      :customFormatter="(val) => (parseInt(val, 10) + 1).toString()"
      v-on:dragging="dragging($event)"
      class="reading-slider-component"
    ></ReadingSliderComponent>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { ImageRef } from "@/utils/uploadedImage.class";
import ReadingSliderComponent from "@/components/image-selector/ReadingSliderComponent.vue";
import {
  ReadingSliderBoundaries,
  ReadingSliderValue,
} from "@/utils/movie.service";

@Component({
  components: {
    ReadingSliderComponent,
  },
})
export default class ImagesSelectorComponent extends Vue {
  @Prop()
  public images!: ImageRef[];

  @Prop()
  public activeImage!: number;

  @Prop()
  public value!: ReadingSliderBoundaries;

  @Prop()
  public canEdit!: boolean;

  get sliderValue() {
    return {
      left: this.value.left,
      right: Math.min(this.value.right, this.images.length - 1),
      selected: this.activeImage,
    };
  }

  public setFrame(value: number) {
    const slider = this.$refs.slider as ReadingSliderComponent;
    slider.setFrame(value);
  }

  onSliderValueChange(newSliderValue: ReadingSliderValue) {
    if (this.activeImage !== newSliderValue.selected) {
      this.$emit("activeImageChange", newSliderValue.selected);
      this.$emit("draggingValueChange", null);
    }
    if (
      this.value.left !== newSliderValue.left ||
      this.value.right !== newSliderValue.right
    ) {
      this.$emit("input", {
        left: newSliderValue.left,
        right: newSliderValue.right,
      });
    }
  }

  dragging(value: number) {
    this.$emit("draggingValueChange", value);
  }
}
</script>
