<template>
  <div class="boxContainer storyboard-preview-container">
    <div class="storyboard-preview-header">
      <h4>Storyboard</h4>
      <i class="icon-grid baku-button" @click="onDisplayShots()" />
    </div>
    <img src="@/assets/storyboard.png" />
    <img
       v-if="getActiveShot && getActiveShot.images[0]"
       class="shotPreview"
       :src="`/api/${id}/images/${getActiveShot.id}/${getActiveShot.images[0]}?width=292&height=193`"
     />
    <div class="shotPreview" v-else/>
  </div>
</template>

<style lang="scss">
.storyboard-preview-container {
  width: 290px;
  height: 450px;

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

.shotPreview {
  width: 100%;
  height: 193px;
  background-color: #bce0fd;
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/api/movie.service';

const ProjectNS = namespace('project');
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

  @ProjectNS.Getter
  public getActiveShot!: Shot;

  public onDisplayShots() {
    this.$router.push({
      name: 'captureShots',
      params: {
        projectId: this.id,
      },
    });
  }
}
</script>
