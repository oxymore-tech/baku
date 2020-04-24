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
      <div class="link-container">
        <a :href="getLink()">{{getLink()}}</a>
        <i class="baku-button"
           v-bind:class="{ 'icon-copy': !copied, 'icon-check': copied }"
           v-bind:title="copied ? 'Lien copié' : 'Copier dans le presse-papier'"
           @click="copyLink()">
        </i>
      </div>

      <hr>
      <p>Titre du film</p>
      <input type="text" :value="movie.title" @blur="setTitle($event)"/><br>
      <p>Synopsis</p>
      <textarea v-model="movie.synopsis" @blur="setSynopsis($event)" rows="4"></textarea><br>
      <p>Frequence</p>
      <input type="number" :value="movie.fps" @blur="setFps($event)"/><br>
      <hr>
      <p>Export du film :</p><br>
      <div style="display:flex; justify-content: space-around;">
        <a
          :href="getMovieExportUrl()"
          target="_blank"
        >Séquence d'images</a>

        <div v-if="isVideoAvailable" :title="videoTitle">
          <a
            :href="getVideoUrl()"
            target="_blank"
          >Vidéo (mp4)</a>
          <i class="baku-button icon-check" :class="{ isWarning: true }">
          </i>
        </div>
        <div v-else>
          <div v-if="isVideoPending" title="Génération en cours...">
            <span>Vidéo (mp4)</span>
            <button :loading="true"/>
          </div>
          <div v-else title="Générer une vidéo">
            <a
              @click="generateVideo()"
              target="_blank"
            >Vidéo (mp4)</a>
            <i class="baku-button icon-reapeat">
            </i>
          </div>
        </div>
      </div>
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
  import { Movie } from '@/utils/movie.service';
  import * as api from '@/api';
  import { VideoStatus, VideoStatusEnum } from "@/utils/types";

  const ProjectNS = namespace('project');

  @Component
  export default class ProjectSettingsPopup extends Vue {
    @ProjectNS.State
    public id!: string;

    @ProjectNS.Getter
    public movie!: Movie;

    public url = window.location.origin;

    public copied: boolean = false;

    videoStatus: VideoStatus = {status: VideoStatusEnum.Pending, lastModified: 0};

    private refreshVideoStatusTimer?: number;

    async mounted() {
      this.videoStatus = await api.getVideoStatus(this.id);
      this.refreshVideoStatusTimer = setInterval(this.refreshVideoStatus, 1000);
    }

    beforeDestroy() {
      if (this.refreshVideoStatusTimer) {
        clearInterval(this.refreshVideoStatusTimer);
      }
    }

    get isVideoAvailable() {
      return this.videoStatus.status === VideoStatusEnum.UpToDate || this.videoStatus.status === VideoStatusEnum.NotUpToDate;
    }


    get isVideoPending() {
      return this.videoStatus.status === VideoStatusEnum.Pending
    }

    get isVideoUpToDate() {
      return this.videoStatus.status === VideoStatusEnum.UpToDate;
    }

    get videoTitle() {
      if (this.isVideoUpToDate) {
        return 'La dernière vidéo est disponible';
      } else {
        return `Dernière vidéo est disponible : ${new Date(this.videoStatus.lastModified).toDateString()}`;
      }
    }

    generateVideo() {
      return api.generateVideo(this.id);
    }

    getVideoUrl() {
      return api.getVideoUrl(this.id);
    }

    getMovieExportUrl() {
      return api.getExportUrl(this.id);
    }

    setTitle(event: any) {
      const newTitle = event.target.value;
      if (newTitle !== this.movie.title) {
        this.$store.dispatch('project/updateTitle', newTitle);
      }
    }

    setSynopsis(event: any) {
      const newSynopsis = event.target.value;
      if (newSynopsis !== this.movie.synopsis) {
        this.$store.dispatch('project/updateSynopsis', newSynopsis);
      }
    }

    setFps(event: any) {
      const newFps = event.target.value;
      if (newFps !== this.movie.fps) {
        this.$store.dispatch('project/changeFps', newFps);
      }
    }

    getLink(): string {
      const path = this.$router.resolve({
        name: 'movieHome',
        params: {
          projectId: this.id,
        },
      }).href;
      return this.url + path;
    }

    copyLink(): void {
      const input = document.createElement('input');
      input.value = this.getLink();
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(input);
      this.copied = true;
    }

    private async refreshVideoStatus() {
      this.videoStatus = await api.getVideoStatus(this.id)
    }
  }
</script>
