<template>
  <div class="movie-home-main">
    <div class="movieCard">
      <!--
        TODO: use image poster
         <img
        v-if="shot.images[0]"
        class="shotPreview"
        :src="`/images/thumb/${projectId}/${shot.images[0]}`"
      /> -->
      <div class="moviePreview"></div>
      <div class="cardFooter">
        <p class="movieTitle">{{ movie.title }}</p>
        <p>{{ movie.synopsis }}</p>
      </div>
    </div>
    <button class="openButton" @click="onAccessProject">Accéder au film</button>
  </div>
</template>

<style lang="scss" scoped>
.movie-home-main {
  background: #f2f2f2;
  width: 100%;
  height: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  padding: 24px;
  justify-content: space-evenly;
}

.movieCard {
  margin: 0 auto;
  width: 608px;
  max-height: 620px;
  min-height: 400px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border-radius: 16px;
  opacity: 1;
  font-size: 16px/6px;
  letter-spacing: 0;
  box-shadow: 0px 0px 20px #00000029;
  display: flex;
  flex-direction: column;

  .cardFooter {
    padding: 7px;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;

    .movieTitle {
      font-size: 32px;
    }
  }

  .moviePreview {
    width: 100%;
    flex: 3;
    background-color: #bce0fd;
  }
}

.openButton {
  margin: 0 auto;
  width: 292px;
  height: 48px;
  background: #e66359 0% 0% no-repeat padding-box;
  box-shadow: 0px 0px 20px #00000029;
  border-radius: 44px;
  color: white;
  border: 0;
  cursor: pointer;
  font-size: 16px;
}
</style>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Movie } from '@/api/movie.service';
import Project from './Project.vue';

const ProjectNS = namespace('project');

@Component
export default class Init extends Project {
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
}
</script>
