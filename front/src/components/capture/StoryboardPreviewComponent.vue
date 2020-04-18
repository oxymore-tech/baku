<template>
  <div class="box-container storyboard-preview-container">
    <div class="storyboard-preview-header"  @click="onDisplayShots()">
      <i class="icon-grid baku-button"/>
      <h4>Plans</h4>
    </div>
    <img
      class="shotPreview"
      alt="preview"
      ref="preview"
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
  }
</style>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/api/movie.service';
import { Spinner } from '@/api/spinner.class';
import { ImageCacheService } from '@/api/imageCache.service';

const ProjectNS = namespace('project');

  @Component
export default class StoryboardPreviewComponent extends Vue {
    @Prop({ required: true })
    public shots!: Shot[];

    @Prop()
    public activeShot!: Shot;

    @Prop()
    public displayShots!: boolean;

    @ProjectNS.State
    public id!: string;

    public onDisplayShots() {
      this.$router.push({
        name: 'captureShots',
        params: {
          projectId: this.id,
        },
      });
    }

    mounted() {
      (this.$refs.preview as HTMLImageElement).src = this.getPreview();
    }

    public imageReady(imageId: string) {
      if (this.activeShot && this.activeShot.images.length > 0) {
        if (this.activeShot.images[0].id === imageId) {
          (this.$refs.preview as HTMLImageElement).src = this.getPreview();
        }
      }
    }

    private getPreview() {
      if (this.activeShot && this.activeShot.images.length > 0) {
        const imageId = this.activeShot.images[0].id;
        return ImageCacheService.getImage(imageId);
      }
      return Spinner;
    }
}
</script>
