<template>
  <div class="mainFrame">
    <div class="previewBloc">
      <StoryboardPreviewComponent :plans="film.plans" :activePlanId="getActivePlanId" />
      <video
        v-if="activeCapture"
        id="videoCapture"
        width="720"
        height="480"
        autoplay
        muted
        playsinline
      />
      <div v-else>
        <img
          v-if="getActivePlan"
          id="previewImg"
          width="720"
          height="480"
          :src="`/default/images/${getActivePlan.id}/${getActivePlan.images[activeFrame]}?width=1280&height=720`"
        />
      </div>
      <CaptureToolboxComponent
        v-if="getActivePlan"
        :projectId="id"
        :activePlan="getActivePlan.id"
        :activeIndex="getActivePlan.images.length"
      />
    </div>
    <div>
      <button @click="playAnimation()">play</button>
      <button @click="pauseAnimation()">pause</button>
    </div>
    <CarrouselComponent
      v-if="getActivePlan"
      :projectId="id"
      :activePlan="getActivePlan.id"
      :images="getActivePlan.images"
    />
  </div>
</template>

<script lang="ts">
import CaptureToolboxComponent from "@/components/capture/CaptureToolboxComponent.vue";
import CarrouselComponent from "@/components/capture/CarrouselComponent.vue";
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import { namespace } from "vuex-class";
import StoryboardPreviewComponent from "@/components/capture/StoryboardPreviewComponent.vue";
import { Film, Plan } from "@/api/film-service";

const CaptureNS = namespace("capture");
const ProjectNS = namespace("project");

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    StoryboardPreviewComponent
  },
  store
})
export default class Capture extends Vue {
  @ProjectNS.State
  public id!: string; 
  
  @ProjectNS.Getter
  public getActivePlanId!: string;

  @ProjectNS.Getter
  public film!: Film;  
  
  @ProjectNS.Getter
  public getActivePlan!: Plan;
  
  @ProjectNS.State
  public activeFrame!: number;

  @CaptureNS.State
  public activeCapture!: boolean;

  @CaptureNS.State
  public stream!: MediaStream | null;

  private isPlaying = false;
  private loop: any;

  public mounted() {
  }

  public playAnimation() {
    this.isPlaying = true;
    this.loop = setInterval(
      () => {this.$store.dispatch("project/goToNextFrameAction")},
      1000 / 12
    );
  }

  public pauseAnimation() {
    clearInterval(this.loop);
  }

  @Watch("stream")
  public onStreamChange(newValue: MediaStream, oldValue: MediaStream) {
    console.log("onStreamChange");
    if (newValue) {
      (document.getElementById(
        "videoCapture"
      ) as HTMLVideoElement).srcObject = newValue;
    }
  }

  public onActivePlanSelected(plan: Plan) {
    console.log("plan selected", plan);
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