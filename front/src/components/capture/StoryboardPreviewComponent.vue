<template>
  <div v-if="activeShot" class="box-container storyboard-preview-container">
    <textarea
      id="shotSynopsis"
      ref="shotSynopsis"
      rows="5"
      maxlength="124"
      :value="activeShot.synopsis"
      placeholder="Présenter votre plan avec un résumé"
      @blur="changeShotSynopsis()"
    ></textarea>

    <div class="ajout-storyboard">
      <div>
        <div>
          <i class="icon-camera baku-button storyboard-icon"/>
          <i class="icon-attachment baku-button storyboard-icon"/>
        </div>
        <div>
          Ajouter votre storyboard
        </div>
      </div>
    </div>
  </div>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Shot } from '@/utils/movie.service';
// import { Spinner } from "@/utils/spinner.class";
// import { ImageCacheService } from "@/utils/imageCache.service";

const ProjectNS = namespace('project');

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
    const shotId = this.activeShot?.id;
    const synopsis = (this.$refs.shotSynopsis as any).value;

    await this.$store.dispatch('project/changeShotSynopsis', {
      shotId,
      synopsis,
    });
  }
}
</script>

<style lang="scss">
#shotSynopsis {
  width: 300px;
  resize: none;
}

.ajout-storyboard {
  border: 1px solid lightgray;
  border-radius: 15px;
  width: 300px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.ajout-storyboard>div {
  line-height: 1.5;
  display: inline-block;
  vertical-align: middle;
  color: gray;
  size: 30px;
}

.storyboard-icon {
  margin-left: 30px;
  margin-right: 30px;
}
</style>
