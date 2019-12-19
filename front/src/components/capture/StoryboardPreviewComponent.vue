<template>
  <div class="boxContainer storyboard-preview-container">
    <div class="storyboard-preview-header">
      <i class="icon-grid baku-button" @click="onDisplayShots()" />
      <h4>Plans</h4>
    </div>
    <img
      v-if="getActiveShot && getActiveShot.images[0]"
      class="shotPreview"
      :src="`${getActiveShot.images[0].thumbUrl}`"
    />
    <div class="shotPreview" v-else />
  </div>
</template>

<style lang="scss">
.storyboard-preview-container {
  width: 290px;
  height: 250px;

  .storyboard-preview-header {
    display: inline-flex;
    align-items: center;
    width: 100%;

    h4 {
      font-size: 28px;
      font-weight: lighter;
    }

    i {
      font-size: 28px;
      padding-right: 10px
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
