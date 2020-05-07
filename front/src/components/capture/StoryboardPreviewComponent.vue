<template>
  <div v-if="activeShot" class="box-container storyboard-preview-container">
    <textarea
      id="shotSynopsis"
      ref="shotSynopsis"
      rows="4"
      cols="50"
      :value="activeShot.synopsis"
      placeholder="Présenter votre plan avec un résumé"
      @blur="changeShotSynopsis()"
    ></textarea>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Shot } from "@/utils/movie.service";
//import { Spinner } from "@/utils/spinner.class";
//import { ImageCacheService } from "@/utils/imageCache.service";

const ProjectNS = namespace("project");

@Component
export default class StoryboardPreviewComponent extends Vue {
  @Prop()
  public activeShot!: Shot;

  @Prop()
  public shots!: Shot[];

  @ProjectNS.State
  public id!: string;


  mounted() {  
  }

  
  public async changeShotSynopsis() {
    let shotId = this.activeShot?.id;
    let synopsis = (this.$refs.shotSynopsis as any).value;

    await this.$store.dispatch("project/changeShotSynopsis", {
      shotId: shotId,
      synopsis: synopsis,
    });
  }
}
</script>

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
      padding-right: 10px;
    }
  }
}

.shot-preview {
  width: 292px;
  height: 164px;
}
</style>
