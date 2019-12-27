<template>
  <div>
    <b-field v-if="selectedImages">
      <b-slider
        v-model="selectedImages"
        :min="0"
        :max="max"
        :step="1"
        type="is-warning"
        ticks
      >
      </b-slider>
    </b-field>
  </div>
</template>

<style lang="scss">
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageRef } from '@/api/uploadedImage.class';

@Component
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

  public max = 6

  get selectedImages() {
    return this.$store.state.project.selectedImages;
  }

  set selectedImages(value: number[]) {
    this.$store.commit('project/setSelectedImages', value);
  }

  mounted() {
    this.max = this.images.length - 1;
  }
}
</script>
