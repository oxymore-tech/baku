<style lang="scss" scoped>
@import "@/styles/shots.scss";
</style>

<template>
  <div class="shots">
    <div id="movie-header">
      <p style="display: flex; align-items: center;">
      Statut du film :
      <b-switch style="margin-left: 10px" :disabled="!canUnLock" :value="movie.locked" @input="lockMovie(!movie.locked)">{{ movie.locked ? 'Verrouillé' : 'Déverrouillé'}}</b-switch>
      </p>
        <p>Nombres d'images : {{ getImageCount }}</p>
        <p>Durée du film : {{ getDurationString(movieDuration) }}</p>
    </div>

    <div class="shot-cards-container">
      <div
        @click.prevent="activateShot(shot.id)"
        v-for="(shot, index) in movie.shots"
        :key="shot.id"
        class="shot-card"
        :style="{backgroundImage:'url(' + (shot.images[0] ? shot.images[0].getUrl('original') : spinner) +')' }">
          <b-dropdown position="is-bottom-right" aria-role="list" class="shot-menu" @click.native.stop>
            <a class="settings-icon" slot="trigger">
              <i class="icon-cog baku-button"></i>
            </a>
            <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
              <a :href="getExportUrl(shot.id)" target="_blank">
                <i class="icon-image-sequence baku-button"></i> Exporter en séquence d'image
              </a>
            </b-dropdown-item>
            <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
              <a :href="getExportUrl(shot.id)" target="_blank">
                <i class="icon-movie baku-button"></i> Exporter en fichier vidéo
              </a>
            </b-dropdown-item>
            <!--
            <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
              <a
                :href="getExportUrl(shot.id)"
                target="_blank"
                ><i class="icon-image-regular baku-button"></i> Attacher un storyboard</a>
                    </b-dropdown-item>
            -->
            <b-dropdown-item
                    v-if="shot.locked"
                    class="dropdown-item-bloc"
                    aria-role="listitem"
                    @click="lockShot(shot.id, !shot.locked)" :disabled="!canUnLock"
            >
                <i class="icon-unlock-solid baku-button"></i> Déverrouiller le plan

            </b-dropdown-item>
            <b-dropdown-item
                    v-if="!shot.locked"
                    class="dropdown-item-bloc"
                    aria-role="listitem"
                    @click="lockShot(shot.id, !shot.locked)" :disabled="!canEditMovie"
            >
                <i class="icon-lock-solid baku-button"></i> Verrouiller le plan
            </b-dropdown-item>
            <b-dropdown-item
                    v-if="!shot.locked && canEditMovie"
                    class="dropdown-item-bloc"
                    aria-role="listitem"
                    @click="removeShot(shot.id)"
            >
              <i class="icon-trash-alt baku-button"></i> Supprimer le plan
            </b-dropdown-item>
          </b-dropdown>
          <div class="card-footer">
            <div style="width: 100%">
              <template v-if="shot.locked">
                <i class="icon-lock-solid baku-button" style="color:#FE676F"></i>
              </template>
              <template v-if="!shot.locked">
                <i class="icon-unlock-solid baku-button"></i>
              </template>
              <span class="shot-name">{{`Plan ${index + 1}`}}</span>
              <span class="shot-details">{{ getImagesString(shot.images.length) }}</span>
              <p class="shot-storyboard">Synopsis: {{ shot.synopsis }}</p>
            </div>
          </div>
      </div>
      <div class="shot-card create-shot" @click="createNewShot()">
        <div class="add-footer">
          <img src="@/assets/plus.svg" alt="plus" /><br>
          <a class="activate-shot-link">Créer un plan</a>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Duration } from '@/utils/types';
import { Movie, MovieService } from '@/utils/movie.service';
import * as api from '@/api';
import { Spinner } from "@/utils/spinner.class";

const ProjectNS = namespace('project');

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @ProjectNS.Getter('canUnLock')
  protected canUnLock!: boolean;

  @ProjectNS.Getter('canEditMovie')
  protected canEditMovie!: boolean;

  @ProjectNS.Getter
  protected movie!: Movie;

  @ProjectNS.Getter
  protected movieDuration!: any;

  @ProjectNS.Getter
  protected getHours!: any;

  @ProjectNS.Getter
  protected getMinutes!: any;

  @ProjectNS.Getter
  protected getSeconds!: any;

  @ProjectNS.Getter
  protected getImageCount!: number;

  @ProjectNS.Action('lockMovie')
  protected lockMovie!: (locked: boolean) => Promise<void>;

  public spinner: string = Spinner;

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
    await this.$store.dispatch('project/lockShot', {
      shotId,
      locked: shotLocked,
    });
  }

  public getImagesString(imageNumber: number): string {
    return MovieService.getImagesString(imageNumber);
  }

  public getDurationString(duration: Duration): string {
    return MovieService.getDurationString(duration);
  }

  public getExportUrl(shotId: string): string {
    return api.getExportUrl(this.projectId, shotId);
  }

  public close() {
    this.$emit('close');
  }
}
</script>
