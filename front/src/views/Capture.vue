<template>
    <div class="mainFrame">
        Yo
        <CaptureComponent />
        <CarrouselComponent />
    </div>
</template>

<script lang="ts">
import CaptureComponent from "@/components/CaptureComponent.vue";
import CarrouselComponent from "@/components/CarrouselComponent.vue";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";
import store from '../store'
@Component({
  components: {
    CaptureComponent,
    CarrouselComponent
  },
  store
})
export default class Capture extends Vue {
}
</script>

<style lang="scss">
    
</style>