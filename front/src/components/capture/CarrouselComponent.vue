<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="carrouselContainer">
      <img v-for="picture in pictures" v-bind:key="picture" :src="`/default/images/${activePlan}/${picture}?width=185&height=104`">
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
import { Component, Vue, Watch } from "vue-property-decorator";
import { mapState } from "vuex";
import store from '@/store'

@Component({
  computed: {
    ...mapState("plan", ["pictures", "activePlan"])
  },
  store
})
export default class CarrouselComponent extends Vue {
  mounted() {
    console.log(this.$store);
  }
}
</script>