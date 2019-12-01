<template>
  <div class="main">
    <div class="leftPanel">
      <p>Page home du film: {{ movie.title }}</p>
      <p>{{ movie.synopsis }}</p>
      <button @click="onCreateProject">Accéder au film</button>
    </div>
    <div class="rightPanel"></div>
  </div>
</template>

<style>
.main {
  background: white;
  width: 100%;
  height: 100%;
}
</style>

<script lang="ts">
import { Movie } from "@/api/movie.service";
import { Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import Project from './Project.vue';

const ProjectNS = namespace('project');

@Component
export default class Init extends Project {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  public async onCreateProject() {
    await this.$router.push({
      name: 'captureShots',
      params: {
        projectId: this.id,
      }
    });
  }
}
</script>
