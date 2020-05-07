<style lang="scss" scoped>
  @import "@/styles/shots.scss";
</style>

<template>
  <div class="shots">
    <!--<div class="slidecontainer">
      <input type="range" min="1" max="100" value="50" class="slider" id="zoom">
    </div>-->
    <div class="shot-cards-container">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shot-card"
      >
        <b-dropdown
          aria-role="list"
          class="shot-menu is-pulled-right"
          position="is-bottom-left"
        >
          <a slot="trigger">
            <i class="icon-cog baku-button"></i>
          </a>
          <b-dropdown-item has-link aria-role="listitem">
            <a
              :href="getExportUrl(shot.id)"
              target="_blank"
            ><i class="icon-image-sequence baku-button"></i> Exporter en séquence d'image</a></b-dropdown-item>
          <b-dropdown-item has-link aria-role="listitem">
            <a
                    :href="getExportUrl(shot.id)"
                    target="_blank"
            ><i class="icon-movie baku-button"></i> Exporter en fichier vidéo</a></b-dropdown-item>
          <b-dropdown-item has-link aria-role="listitem">
            <a
                    :href="getExportUrl(shot.id)"
                    target="_blank"
            ><i class="icon-image-regular baku-button"></i> Attacher un storyboard</a></b-dropdown-item>
          <b-dropdown-item
                  v-if="canLock"
                  aria-role="listitem"
                  @click="lockShot(shot.id, !shot.locked)"
          ><template v-if="shot.locked"><i class="icon-unlock-solid baku-button"></i> Déverouiller le plan</template>
            <template v-else><i class="icon-lock-solid baku-button"></i> Verouiller le plan</template>
          </b-dropdown-item>
          <b-dropdown-item
                  v-if="!shot.locked && canEditMovie"
                  aria-role="listitem"
                  @click="removeShot(shot.id)"
          ><i class="icon-trash-alt baku-button"></i> Supprimer le plan</b-dropdown-item>
        </b-dropdown>
        <a
          class="activate-shot-link"
          @click="activateShot(shot.id)"
        >
          <img
            class="shot-preview"
            :src="shot.previewUrl"
            alt="shotPreview"
          />
          <div class="card-footer">
            <p>{{ shot.name }}</p>
          </div>
        </a>

      </div>
      <div
        class="shot-card create-shot"
        @click="createNewShot()"
      >
        <img
          src="@/assets/plus.svg"
          alt="plus"
          width="48px"
          height="48px"
        />
        <a class="activate-shot-link">Créer un plan</a>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Spinner } from '@/utils/spinner.class';
import { Quality } from '@/utils/uploadedImage.class';
import * as api from '@/api';

const ProjectNS = namespace('project');

type Shot = {
  id: string;
  name: string;
  previewUrl: string;
  locked: boolean;
};

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @ProjectNS.Getter('canLock')
  protected canLock!: boolean;

  @ProjectNS.Getter('canEditMovie')
  protected canEditMovie!: boolean;

  get shots(): Shots {
    return this.$store.getters['project/movie'].shots.map(
      (shot: any, index: any): Shot => {
        const previewUrl = shot.images[0] ? shot.images[0].getUrl(Quality.Original) : Spinner;

        return {
          id: shot.id,
          name: `Plan ${index + 1}`,
          previewUrl,
          locked: shot.locked,
        };
      },
    );
  }

  public async createNewShot() {
    const shotId = await this.$store.dispatch('project/createShot');
    await this.$store.dispatch('project/changeActiveShot', shotId);
    this.$emit('close');
  }

  public async activateShot(shotId: string) {
    await this.$store.dispatch('project/changeActiveShot', shotId);
    this.$emit('close');
  }

  public async removeShot(shotId: string) {
    await this.$store.dispatch('project/removeShot', shotId);
  }

  public async lockShot(shotId: string, shotLocked: boolean) {
    await this.$store.dispatch('project/lockShot', { shotId, locked: shotLocked });
  }

  public getExportUrl(shotId: string): string {
    return api.getExportUrl(this.projectId, shotId);
  }

  public close() {
    this.$emit('close');
  }
}
</script>
