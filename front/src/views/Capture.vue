<template>
  <div class="mainFrame">
    <div class="previewBloc">
      <ProjectPreviewComponent />
      <video
        v-if="activeCapture"
        id="videoCapture"
        width="1280"
        height="720"
        autoplay
        muted
        playsinline
      />
      <img
        v-else
        id="previewImg"
        width="1280"
        height="720"
        :src="`https://${location.host}/default/images/${activePlan}/${getActiveFrame}.jpg?width=1280&height=720`"
      />
      <CaptureToolboxComponent />
    </div>
    <div>
      <span @click="playAnimation()">play</span>
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
import { mapState, mapGetters } from "vuex";

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    ProjectPreviewComponent
  },
  computed: {
    ...mapState("capture", ["activeCapture", "stream"]),
    ...mapState("plan", ["activePlan"]),
    ...mapGetters("plan", ["getActiveFrame"])
  },
  watch: {
    stream(newValue, oldValue) {
      if (newValue) {
        (document.getElementById(
          "videoCapture"
        ) as HTMLVideoElement).srcObject = newValue;
      }
    },
  },
  store
})
export default class Capture extends Vue {
  private isPlaying = false;
  private loop: any;

  mounted() {}

  playAnimation() {
    this.isPlaying = true;
    this.loop = setInterval(() => this.$store.dispatch("plan/goToNextFrameAction"), 1000);
  }
}
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
  max-height: 720px;
  background: white;
}

#videoCapture {
  max-height: 720px;
}
</style>