<style lang="scss" scoped>
@import "@/styles/shots.scss";
</style>

<template>
  <div class="shots">
    <div id="movie-header">
      <div>
        <p>Nombres d'images : {{ getImageCount }}</p>
        <p>Durée du film : {{ getDurationString(movieDuration) }}</p>
      </div>

      <b-switch v-if="canUnLock" :value="movie.locked" @input="lockMovie({projectId: projectId, locked: !movie.locked})">Vérouiller le film</b-switch>
    </div>

    <div class="shot-cards-container">
      <div
        @click.prevent="activateShot(shot.id)"
        v-for="shot in shots"
        :key="shot.id"
        class="shot-card"
        :style="{background:'url(' + shot.previewUrl +') no-repeat, white', 'background-size': 'contain'}"
      >
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
                    class="dropdown-item-bloc"
                    aria-role="listitem"
                    @click="lockShot(shot.id, !shot.locked)"
            >
              <template v-if="shot.locked && canUnLock && !movie.locked">
                <i class="icon-unlock-solid baku-button"></i> Déverouiller le plan
              </template>
              <template v-if="!shot.locked && !movie.locked">
                <i class="icon-lock-solid baku-button"></i> Verouiller le plan
              </template>
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
            <div>
              <span class="shot-name">{{ shot.name }}</span>
              <br>
              <span class="shot-details">{{ getDurationString(shot.duration) }}</span>
              <br>
              <span class="shot-details">{{ getImagesString(shot.imageNb) }}</span>
              <br>
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
import { Component, Prop, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { Duration } from "@/utils/types";
import { Spinner } from "@/utils/spinner.class";
import { Quality } from "@/utils/uploadedImage.class";
import { Movie, MovieService } from "@/utils/movie.service";
import * as api from "@/api";

const ProjectNS = namespace("project");

type Shot = {
  id: string;
  name: string;
  previewUrl: string;
  locked: boolean;
  imageNb: number;
  duration: Duration;
  synopsis: string;
};

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @ProjectNS.Getter("canUnLock")
  protected canUnLock!: boolean;

  @ProjectNS.Getter("canEditMovie")
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
  protected lockMovie!: ({}) => Promise<void>;

  get shots(): any {
    return this.movie.shots.map(
      (shot: any, index: any): Shot => {
        const previewUrl = shot.images[0]
          ? shot.images[0].getUrl(Quality.Original)
          : Spinner;
        return {
          id: shot.id,
          name: `Plan ${index + 1}`,
          previewUrl,
          imageNb: shot.images.length,
          locked: shot.locked,
          synopsis: shot.synopsis,
          duration: {
            hours: this.getHours(index),
            minutes: this.getMinutes(index),
            seconds: this.getSeconds(index),
          },
        };
      },
    );
  }

  public async createNewShot() {
    const shotId = await this.$store.dispatch("project/createShot");
    await this.$store.dispatch("project/changeActiveShot", shotId);
    this.$emit("close");
  }

  public async activateShot(shotId: string) {
    await this.$store.dispatch("project/changeActiveShot", shotId);
    this.$emit("close");
  }

  public async removeShot(shotId: string) {
    await this.$store.dispatch("project/removeShot", shotId);
  }

  public async lockShot(shotId: string, shotLocked: boolean) {
    await this.$store.dispatch("project/lockShot", {
      shotId,
      locked: shotLocked
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
    this.$emit("close");
  }
}
</script>
