<style lang="scss" scoped>
  @import "../styles/shots.scss";
</style>

<template>
  <div class="shots">
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
            <b-icon custom-class="icon-cog"></b-icon>
          </a>
          <b-dropdown-item aria-role="listitem">
            <a
              :href="getExportUrl(shot.id)"
              target="_blank"
            >Exporter le plan</a></b-dropdown-item>
          <b-dropdown-item
            aria-role="listitem"
            @click="removeShot(shot.id)"
          >Supprimer le plan</b-dropdown-item>
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
import { Spinner } from '@/api/spinner.class';
import { Quality } from '@/api/uploadedImage.class';
import { BakuService } from '@/api/baku.service';

type Shot = {
  id: string;
  name: string;
  previewUrl: string;
};

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  get shots(): Shots {
    return this.$store.getters['project/movie'].shots.map(
      (shot: any, index: any): Shot => {
        const previewUrl = shot.images[0] ? shot.images[0].getUrl(Quality.Original) : Spinner;

        return {
          id: shot.id,
          name: `Plan ${index + 1}`,
          previewUrl,
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

  public getExportUrl(shotId: string): string {
    return BakuService.getExportUrl(this.projectId, shotId);
  }

  public close() {
    this.$emit('close');
  }
}
</script>
