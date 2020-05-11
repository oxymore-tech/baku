<template>
  <div v-if="activeShot" class="box-container storyboard-preview-container">

    <div
      class="flex-container"
      v-if="$route.name === 'captureShot' && activeShotIndex >= 0 "
    >
      <div
        v-if="nbShot > 1 && $route.name === 'captureShot'"
        class="previous-plan"
        @click="goToPreviousPlan()"
        title="Plan précédent"
      >&lt;
      </div>
      <div>
        <template
          v-if="$route.name === 'captureShot' && activeShotIndex >= 0"
        ><p class="plan-name">Plan {{ activeShotIndex + 1 }} </p>
        </template>
      </div>
      <div
        v-if="nbShot > 1 && $route.name === 'captureShot'"
        class="next-plan"
        @click="goToNextPlan()"
        title="Plan suivant"
      >&gt;
      </div>
    </div>

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

const ProjectNS = namespace('project');

  @Component
export default class StoryboardPreviewComponent extends Vue {
    @Prop()
    public activeShot!: Shot;

    @Prop()
    public shots!: Shot[];

    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter('getPreviousShotId')
    protected previousShotId!: string;

    @ProjectNS.Getter('getNextShotId')
    protected nextShotId!: string;

    @ProjectNS.Getter('getActiveShotIndex')
    public activeShotIndex!: Number;

    @ProjectNS.Getter('getShotCount')
    public nbShot!: Number;


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

    public async goToPreviousPlan() {
      const shotId = this.previousShotId;
      await this.moveToShot(shotId);
    }

    public async goToNextPlan() {
      const shotId = this.nextShotId;
      await this.moveToShot(shotId);
    }

    private async moveToShot(shotId: string) {
      return this.$router.push({
        name: 'captureShot',
        params: {
          projectId: this.id,
          shotId,
        },
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

  .ajout-storyboard > div {
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
