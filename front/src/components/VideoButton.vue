<style lang="scss" scoped>

  a {
    color: #4a4a4a;
  }

</style>

<template>
  <div v-if="isVideoAvailable" :title="videoTitle">
    <i class="icon-movie-done"></i>&nbsp;
    <a :href="getVideoUrl()" target="_blank">Exporter en vidéo (mp4)</a>
  </div>
  <div v-else>
    <div v-if="isVideoPending" title="Génération en cours...">
      <i class="icon-loading spin"></i>&nbsp;
      <span>Exporter en vidéo (mp4)</span>
    </div>
    <div v-else title="Générer une vidéo">
      <i class="icon-movie"></i>&nbsp;
      <a @click="generateVideo()">Exporter en vidéo (mp4)</a>
    </div>
  </div>
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { VideoStatus, VideoStatusEnum } from '@/utils/types';
import * as api from '@/api';

  @Component
export default class InlineInput extends Vue {
    @Prop({ required: true })
    id!: string;

    videoStatus: VideoStatus = { status: VideoStatusEnum.Pending, lastModified: 0 };

    private refreshVideoStatusTimer?: number;

    async mounted() {
      this.videoStatus = await api.getVideoStatus(this.id);
      this.refreshVideoStatusTimer = setInterval(this.refreshVideoStatus, 5000);
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
      return this.videoStatus.status === VideoStatusEnum.Pending;
    }

    get isVideoUpToDate() {
      return this.videoStatus.status === VideoStatusEnum.UpToDate;
    }

    get videoTitle() {
      if (this.isVideoUpToDate) {
        return 'La dernière vidéo est disponible';
      }
      return `Dernière vidéo est disponible : ${new Date(this.videoStatus.lastModified * 1000).toDateString()}`;
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

    private async refreshVideoStatus() {
      this.videoStatus = await api.getVideoStatus(this.id);
    }
}
</script>
