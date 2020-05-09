<style lang="scss" scoped>
  @import "@/styles/shots.scss";
</style>

<template>
  <div class="shots">

		<div id="movie-header">
			<div class="movie-header-container">
				<div class="title-and-info">
					<p class="movie-title"> {{ movie.title }} </p>
					<div class="movie-info">
						<p>{{ getImagesString(getImageCount) }}</p>
						<p> {{ getDurationString(movieDuration) }} </p>
					</div>
				</div>
				<div
					v-if="movie.synopsis != 'Synopsis vide'"
					class="synopsis">
					{{ movie.synopsis }}
				</div>
			</div>
		</div>

    <div class="shot-cards-container">
      <div
        v-for="shot in shots"
        :key="shot.id"
        class="shot-card"
      >
        <b-dropdown
          position="is-top-left"
          aria-role="list"
          class="shot-menu"
          >
          <a class="settings-icon" slot="trigger">
            <i class="icon-cog baku-button"></i>
          </a>
          <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
            <a
              :href="getExportUrl(shot.id)"
              target="_blank"
              ><i class="icon-image-sequence baku-button"></i> Exporter en séquence d'image</a></b-dropdown-item>
          <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
            <a
              :href="getExportUrl(shot.id)"
              target="_blank"
              ><i class="icon-movie baku-button"></i> Exporter en fichier vidéo</a></b-dropdown-item>
					<!--
          <b-dropdown-item class="dropdown-item-bloc" has-link aria-role="listitem">
            <a
              :href="getExportUrl(shot.id)"
              target="_blank"
              ><i class="icon-image-regular baku-button"></i> Attacher un storyboard</a>
				  </b-dropdown-item>
					-->
          <b-dropdown-item
            v-if="canLock"
						class="dropdown-item-bloc"
            aria-role="listitem"
            @click.prevent="lockShot(shot.id, !shot.locked)"
            >
						<template v-if="shot.locked"><i class="icon-unlock-solid baku-button"></i> Déverouiller le plan</template>
            <template v-else><i class="icon-lock-solid baku-button"></i> Verouiller le plan</template>
          </b-dropdown-item>
          <b-dropdown-item
            v-if="!shot.locked && canEditMovie"
						class="dropdown-item-bloc"
            aria-role="listitem"
            @click="removeShot(shot.id)"
            ><i class="icon-trash-alt baku-button"></i> Supprimer le plan</b-dropdown-item>
        </b-dropdown>
        <a
          class="activate-shot-link"
          @click.prevent="activateShot(shot.id)"
        >
          <img
            class="shot-preview"
            :src="shot.previewUrl"
            alt="shotPreview"
          />
          <div class="card-footer">
            <p class="shot-name">{{ shot.name }}</p>
						<div class="info-text">
							<p>{{ getImagesString(shot.imageNb) }}</p>
							<p>{{ getDurationString(shot.duration) }}</p>
						</div>

          </div>
        </a>

      </div>
      <div class="shot-card create-shot" @click="createNewShot()">
        <img src="@/assets/plus.svg" alt="plus"/>
        <a class="activate-shot-link">Créer un nouveau plan</a>
      </div>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Duration } from '@/utils/types';
import { Spinner } from '@/utils/spinner.class';
import { Quality } from '@/utils/uploadedImage.class';
import { Movie } from '@/utils/movie.service';
import * as api from '@/api';

const ProjectNS = namespace('project');

type Shot = {
  id: string;
  name: string;
  previewUrl: string;
  locked: boolean;
  imageNb: number;
  duration: Duration
};

@Component
export default class Shots extends Vue {
  @Prop({ required: true })
  public projectId!: string;

  @ProjectNS.Getter('canLock')
  protected canLock!: boolean;

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

  get shots(): any {
    return this.movie.shots.map(
      (shot: any, index: any): Shot => {
        const previewUrl = shot.images[0] ? shot.images[0].getUrl(Quality.Original) : Spinner;
        return {
          id: shot.id,
          name: `Plan ${index + 1}`,
          previewUrl,
          imageNb: shot.images.length,
          locked: shot.locked,
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

  public getImagesString(imageNumber: number): string {
    if (!imageNumber) {
      return "pas encore d'image"
    } else if (imageNumber == 1) {
      return "1 image"
		} else {
      return imageNumber + " images"
    }
  }

  public getDurationString(duration: Duration): string {
    if (duration.hours) {
      return duration.hours + "h " + duration.minutes + "min " + duration.seconds + "sec"
    } else if (duration.minutes) {
      return duration.minutes + "min " + duration.seconds + "sec"
    } else if (duration.seconds > 1) {
      return duration.seconds + " secondes"
    } else if (duration.seconds == 1) {
      return duration.seconds + " seconde"
		} else {
      return "moins d'une seconde"
		}
  }

  public getExportUrl(shotId: string): string {
    return api.getExportUrl(this.projectId, shotId);
  }

  public close() {
    this.$emit('close');
  }
}
</script>
