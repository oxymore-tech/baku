<template>
  <div class="mainFrame">
    <PlansStack
      v-if="displayPlansStack"
      :projectId="id"
      :plans="film.plans"
      :activePlanId="getActivePlanId"
      v-on:closestack="displayPlansStack=false"
    />
    <template v-else>
      <div class="previewBloc">
        <StoryboardPreviewComponent
          :plans="film.plans"
          :activePlanId="getActivePlanId"
          :displayPlansStack="displayPlansStack"
          v-on:changedisplayplansstack="displayPlansStack = true"
        />
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
          <div class="previewContainer">
            <img
              v-if="getActivePlan && getActivePlan.images[activeFrame]"
              id="previewImg"
              :src="`/default/images/${getActivePlan.id}/${getActivePlan.images[activeFrame]}?width=1280&height=720`"
            />
          </div>
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
        :activeImage="activeFrame"
        :activeCapture="activeCapture"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { namespace } from "vuex-class";
import CaptureToolboxComponent from "@/components/capture/CaptureToolboxComponent.vue";
import CarrouselComponent from "@/components/capture/CarrouselComponent.vue";
import store from "@/store";
import StoryboardPreviewComponent from "@/components/capture/StoryboardPreviewComponent.vue";
import PlansStack from "@/components/PlansStack.vue";
import { Film, Plan } from "@/api/film-service";

const CaptureNS = namespace("capture");
const ProjectNS = namespace("project");

@Component({
  components: {
    CaptureToolboxComponent,
    CarrouselComponent,
    StoryboardPreviewComponent,
    PlansStack
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

  isPlaying = false;

  displayPlansStack = false;

  private loop: any;

  public mounted() {}

  public playAnimation() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.loop = setInterval(() => {
        this.$store.dispatch("project/goToNextFrameAction");
      }, 1000 / 12);
    }
  }

  public pauseAnimation() {
    clearInterval(this.loop);
    this.isPlaying = false;
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
  height: 100%;
  max-width: 100%;
  background: white;
}

.previewContainer {
  width: 1100px;
  height: 619px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 4px solid #455054;
  border-radius: 4px;
  box-sizing: content-box;
}

#videoCapture {
  max-height: 720px;
}
</style>
