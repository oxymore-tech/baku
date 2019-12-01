<template>
  <div class="boxContainer storyboard-preview-container">
    <div class="storyboard-preview-header">
      <h4>Storyboard</h4>
      <i class="icon-grid baku-button" @click="onDisplayShots()" />
    </div>
    <img src="@/assets/storyboard.png" />
  </div>
</template>

<style lang="scss">
.storyboard-preview-container {
  width: 290px;
  height: 256px;

  .storyboard-preview-header {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    h4 {
      font-size: 28px;
      font-weight: bold;
    }

    i {
      font-size: 28px;
    }
  }
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Shot } from '@/api/movie.service';
import { namespace } from "vuex-class";

const ProjectNS = namespace("project");
@Component
export default class StoryboardPreviewComponent extends Vue {
  @Prop({ required: true })
  public shots!: Shot[];

  @Prop()
  public activeShotId!: string;

  @Prop()
  public displayShots!: boolean;

  @ProjectNS.State
  public id!: string;

  public onDisplayShots() {
    this.$router.push({
      name: 'captureShots',
      params: {
        projectId: this.id,
      }
    });
  }
}
</script>
