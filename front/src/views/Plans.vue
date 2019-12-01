<template>
  <div class="mainFrame">
    <div class="planBloc">
      <span>Choisir un plan</span>
      <div class="plansContainer">
          <img v-for="picture in pictures" v-bind:key="picture" :src="`/default/images/${activePlan}/${picture}?width=185&height=104`">
      </div>
    </div>
    <div>
      <button @click="addNewPlan()">play</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import store from '@/store';

const CaptureNS = namespace('capture');
const PlanNS = namespace('plan');

@Component({
  store,
})
export default class Capture extends Vue {
  @CaptureNS.State
  public activeCapture!: boolean;

  @PlanNS.State
  public activePlan!: string;

  @CaptureNS.State
  public stream!: MediaStream | null;

  @PlanNS.Getter
  public getActiveFrame!: string;

  public isPlaying = false;

  private loop: any;

  public mounted() {
  }

  public playAnimation() {
    this.isPlaying = true;
    this.loop = setInterval(() => this.$store.dispatch('plan/goToNextFrameAction'), 1000 / 12);
  }

  public pauseAnimation() {
    clearInterval(this.loop);
  }

  @Watch('stream')
  public onStreamChange(newValue: MediaStream, _oldValue: MediaStream) {
    console.log('onStreamChange');
    if (newValue) {
      (document.getElementById(
        'videoCapture',
      ) as HTMLVideoElement).srcObject = newValue;
    }
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
