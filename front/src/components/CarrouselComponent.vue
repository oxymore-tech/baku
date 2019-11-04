<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="carrouselContainer">
    <ul>
      <img v-for="picture in pictures" v-bind:key="picture" :src="'/back/totoproject/' + picture + '.jpeg'">
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
import store from '../store'

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

<style lang="scss">
.captureContainer {
  width: 290px;
  height: 450px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  align-items: center;

  h3 {
    font-size: 23px;
    font-weight: bold;
  }
}
</style>