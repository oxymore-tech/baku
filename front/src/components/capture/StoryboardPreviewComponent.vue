<template>
  <div class="boxContainer storyboard-preview-container">
    <div class="storyboard-preview-header">
      <i class="icon-grid baku-button" @click="onDisplayShots()"/>
      <h4>Plans</h4>
    </div>
    <img
      class="shotPreview"
      alt="preview"
      :src="preview"
    />
  </div>
</template>

<style lang="scss">
  .storyboard-preview-container {
    max-width: 292px;

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
    width: 292px;
    height: 164px;
    background-color: #bce0fd;
  }
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/api/movie.service';
import { Spinner } from '@/api/spinner.class';
import { Quality } from '@/api/uploadedImage.class';

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

    public get preview() {
      if (this.shots && this.shots.length > 0 && this.shots[0].images && this.shots[0].images.length > 0) {
        return this.shots[0].images[0].getUrl(Quality.Original);
      }
      return Spinner;
    }
}
</script>
