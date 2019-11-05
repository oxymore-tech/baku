<template>
  <div class="mainFrame">
    <div class="previewBloc">
      <ProjectPreviewComponent />
      <img id="previewImg" width="1240" height="674" />
      <CaptureToolboxComponent />
    </div>
    <CarrouselComponent />
  </div>
</template>

<script lang="ts">
import CaptureToolboxComponent from "@/components/capture/CaptureToolboxComponent.vue";
import CarrouselComponent from "@/components/capture/CarrouselComponent.vue";
import ProjectPreviewComponent from "@/components/capture/ProjectPreviewComponent.vue";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Getter } from "vuex-class";
import store from "../store";
@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    ProjectPreviewComponent
  },
  store
})
export default class Capture extends Vue {}
</script>

<style lang="scss">
.mainFrame {
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
}

.previewBloc {
  display: flex;
  width: 100%;
  flex: 1;
  justify-content: space-around;
  padding: 10px 0;
}

#previewImg {
  min-width: 640px;
  min-height: 480px;
  background: white;
}
</style>