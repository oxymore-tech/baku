<style lang="scss" scoped>
@import "@/styles/storyboard.scss";
</style>

<template>
  <div v-if="activeShot" class="box-container storyboard-preview-container">
    <div class="planTitle"><span>&#8592;</span><h3>Plan {{ getActiveShotIndex + 1}}</h3></div>
    <textarea
      class="synopsis-storyboard"
      id="shotSynopsis"
      ref="shotSynopsis"
      rows="2"
      maxlength="124"
      :value="activeShot.synopsis"
      placeholder="Présenter votre plan avec un résumé ..."
      @blur="changeShotSynopsis()"
    ></textarea>
    <!-- <div class="ajout-storyboard">
      <div>
        <i class="icon-camera baku-button storyboard-icon"/>
        <i class="icon-attachment baku-button storyboard-icon"/>
      </div>
      <div style="margin-top: 10px">
        Ajouter votre storyboard
      </div>
    </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Shot } from "@/utils/movie.service";
// import { Spinner } from "@/utils/spinner.class";
// import { ImageCacheService } from "@/utils/imageCache.service";

const ProjectNS = namespace("project");

@Component
export default class StoryboardPreviewComponent extends Vue {
  @Prop()
  public activeShot!: Shot;

  @Prop()
  public shots!: Shot[];

  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter("getActiveShotIndex")
  protected getActiveShotIndex!: number;

  mounted() {
  }

  public async changeShotSynopsis() {
    const shotId = this.activeShot?.id;
    const synopsis = (this.$refs.shotSynopsis as any).value;

    await this.$store.dispatch("project/changeShotSynopsis", {
      shotId,
      synopsis,
    });
  }
}
</script>
