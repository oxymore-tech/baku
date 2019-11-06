<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="carrouselContainer">
    <ul>
      <img v-for="picture in pictures" v-bind:key="picture" :src="'/back/totoproject/' + picture + '?width=185&height=104'">
    </ul>
  </div>
</template>

<style lang="scss">
.carrouselContainer {
  width: 100%;
  background: white;
  height: 17vh;
}
</style>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { mapState } from "vuex";
import store from '@/store'

@Component({
  computed: {
    ...mapState("plan", ["pictures"])
  },
  store
})
export default class CarrouselComponent extends Vue {
  mounted() {
    console.log(this.$store);
  }
}
</script>