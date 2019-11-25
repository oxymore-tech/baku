<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="carrouselContainer">
      <img
       v-for="picture in pictures"
       v-bind:key="picture"
       :src="`/${id}/images/${activePlan}/${picture}?width=185&height=104`">
  </div>
</template>

<style lang="scss">
.carrouselContainer {
  background:white;
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
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const ProjectNS = namespace('project');

@Component
export default class CarrouselComponent extends Vue {
  @ProjectNS.State
  public pictures!: string[];

  @ProjectNS.State
  public activePlan!: string;

  @ProjectNS.State
  public id!: string;

  public mounted() {
    console.log(this.$store);
  }
}
</script>
