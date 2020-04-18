<style lang="scss" scoped>
  @import "../styles/movieHome.scss";
</style>

import {Quality} from "@/api/baku.service";
<template>
  <div class="movie-home-main">
    <div class="movie-card">
      <img
        v-if="poster"
        alt="poster"
        class="movie-preview"
        :src="poster"
      />
      <div class="card-footer">
        <p class="movie-title">{{ movie.title }}</p>
        <p>{{ movie.synopsis }}</p>
      </div>
    </div>
    <button class="open-button" @click="onAccessProject">Accéder au film</button>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Movie } from '@/api/movie.service';
import { Spinner } from '@/api/spinner.class';
import { Quality } from '@/api/uploadedImage.class';
import AbstractProjectView from './AbstractProjectView.vue';

const ProjectNS = namespace('project');

  @Component
export default class MovieHomeView extends AbstractProjectView {
    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    public movie!: Movie;

    public async onAccessProject() {
      await this.$router.push({
        name: 'captureShots',
        params: {
          projectId: this.id,
        },
      });
    }

    public get poster() {
      if (this.movie && this.movie.shots && this.movie.shots.length > 0 && this.movie.shots[0].images && this.movie.shots[0].images.length > 0) {
        return this.movie.shots[0].images[0].getUrl(Quality.Original);
      }
      return Spinner;
    }
}
</script>
