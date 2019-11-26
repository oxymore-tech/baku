<template>
  <div class="carrouselContainer">
    <img v-for="image in images" :key="image"
         :alt="image"
         :src="`/${projectId}/images/${activePlan}/${image}?width=185&height=104`">
  </div>
</template>

<style lang="scss">
  .carrouselContainer {
    background: white;
    width: 100%;
    height: 104px;
    overflow-x: scroll;
    display: inline-flex;

    img {
      margin: 0 7px;
      max-height: 104px;
    }
  }
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ImageRef } from '@/api/film-service';

  @Component
export default class CarrouselComponent extends Vue {
    @Prop()
    public images!: ImageRef[];

    @Prop()
    public projectId!: string;

    @Prop()
    public activePlan!: string;
}
</script>
