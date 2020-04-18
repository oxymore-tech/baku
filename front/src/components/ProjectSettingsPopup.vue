<template>
  <div
    class="modal-card"
    style="width: auto"
    >
    <header class="modal-card-head">
      <p class="modal-card-title">Réglages du film</p>
      <i @click="$emit('close')" class="icon-close baku-button"></i>
    </header>
    <section class="modal-card-body">
      <span>Votre film est automatiquement installé à l'adresse suivante :</span><br>
      <!-- TODO: use router -->
      <div class="link-container">
        <a :href="getLink()">{{getLink()}}</a>
        <i class="baku-button"
           v-bind:class="{ 'icon-copy': !copied, 'icon-check': copied }"
           v-bind:title="copied ? 'Lien copié' : 'Copier dans le presse-papier'"
           @click="copyLink()">
        </i>
      </div>
      <br>
      <span>Titre du film</span><br>
      <input type="text" :value="movie.title" @blur="setTitle($event)"/><br>
      <span>Synopsis</span><br>
      <textarea v-model="movie.synopsis" @blur="setSynopsis($event)" rows="4"></textarea><br>
      <span>Frequence</span><br>
      <input type="number" :value="movie.fps" @blur="setFps($event)"/><br>
    </section>
  </div>
</template>

<style lang="scss">
input, textarea {
  width: 100%;
}
.baku-button {
  margin-left: 5px;

  &.icon-check {
    color: #009600;
  }
}
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

  public copied: boolean = false;

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

  public getLink(): string {
    return `${this.url}/movies/${this.id}`;
  }

  public copyLink(): void {
    const input = document.createElement('input');
    input.value = this.getLink();
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(input);
    this.copied = true;
  }
}
</script>
