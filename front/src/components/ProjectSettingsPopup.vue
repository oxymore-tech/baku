<template>
  <div
    class="modal-card"
    style="width: auto"
  >
    <header class="modal-card-head">
      <p class="modal-card-title">Réglages du film</p>
    </header>
    <section class="modal-card-body">
      <span>Votre film est automatiquement installé à l'adresse suivante :</span><br>
      <a :href="url+'/'+id">{{url+'/'+id}}</a><br>
      <span>Titre du film</span><br>
      <input type="text" :value="movie.title" @blur="setTitle($event)"/><br>
      <span>Synopsis</span><br>
      <input type="text" :value="movie.synopsis" @blur="setSynopsis($event)"/><br>
      <span>Frequence</span><br>
      <input type="number" :value="movie.fps" @blur="setFps($event)"/><br>
    </section>
  </div>
</template>

<style lang="scss">
</style>


<script lang="ts">

import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { Movie } from '@/api/movie.service';

const ProjectNS = namespace('project');

  @Component
export default class ProjectSettingsPopup extends Vue {
    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    public movie!: Movie;

    public url = window.location.origin;

    public setTitle(event: any) {
      const newTitle = event.target.value;
      if (newTitle !== this.movie.title) {
        this.$store.dispatch('project/updateTitle', newTitle);
      }
    }

    public setSynopsis(event: any) {
      const newSynopsis = event.target.value;
      if (newSynopsis !== this.movie.synopsis) {
        this.$store.dispatch('project/updateSynopsis', newSynopsis);
      }
    }

    public setFps(event: any) {
      const newFps = event.target.value;
      if (newFps !== this.movie.fps) {
        this.$store.dispatch('project/changeFps', newFps);
      }
    }
}
</script>
