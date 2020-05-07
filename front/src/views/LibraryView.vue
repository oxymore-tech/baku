<style lang="scss" scoped>
@import "@/styles/library.scss";
</style>

<template>
  <div class="main-frame">
    <div class="title">
      <span>{{ title() }}</span>
    </div>

    <div class="movie-gallery">
      <div
        v-for="project in seenProjects"
        :key="project.id"
        class="movie-card"
      >
        <img :src="project.posterUrl" />
        <div class="flex-column">
          <div class="movie-toolbar">

            <div class="movie-card-title">
              {{ project.title }}
            </div>

            <div class="movie-action" @click="onCopy(project.id)">
              <i class="icon-copy-regular baku-button" />
              <span class="baku-button">Copier l'url de partage</span>
            </div>

            <div class="movie-action" v-if="project.adminId" @click="onCopy(project.adminId)">
              <i class="icon-copy-solid baku-button" />
              <span class="baku-button">Copier l'url d'administration</span>
            </div>

            <div class="movie-action">

              <b-dropdown aria-role="list">

                <div
                  slot="trigger"
                  role="button">
                  <i class="icon-grid baku-button" />
                  <span class="baku-button">Actions...</span>
                </div>

                <b-dropdown-item class="" aria-role="listitem">
                  <div class="option-logo" @click="onDuplicate(project.id)">
                    <i class="icon-clone-regular baku-button"/>
                    <span>Dupliquer le film</span>
                  </div>
                </b-dropdown-item>
                <b-dropdown-item aria-role="listitem">
                  <a :href="getMovieExportUrl(project.id)" target="_blank" >
                    <div class="option-logo">
                      <i class="icon-image-regular baku-button"/>
                      <span>Exporter le film en séquence d'image</span>
                    </div>
                  </a>
                </b-dropdown-item>
                <b-dropdown-item aria-role="listitem">
                  <!-- TODO. This seems mor complicated. See ProjectSettingPopup -->
                  <a :href="getVideoUrl(project.id)" target="_blank" >
                    <div class="option-logo">
                      <i class="icon-movie baku-button"/>
                      <span>Exporter le film en fichier vidéo</span>
                    </div>
                  </a>
                </b-dropdown-item>
                <b-dropdown-item aria-role="listitem">
                  <div class="option-logo" @click="onDelete(project.id)">
                    <i class="icon-close baku-button"/>
                    <span>Supprimer le film</span>
                  </div>
                </b-dropdown-item>
              </b-dropdown>

            </div>

          </div>

          <div class="movie-synopsis">
            {{ project.synopsis }}
          </div>

        </div>

        <div class="movie-toolbar-2">

          <div>
            <b-button type="is-primary" @click="onOpen(project.id)">Ouvrir</b-button>
          </div>

          <!--<div>05/05/2020</div>-->

          <div>
            <b-switch @input="onLock($event, project.id)">Verrouiller</b-switch>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import store from '@/store';
import * as api from '@/api';

const UserNS = namespace('user');
@Component({
  components: {},
  store,
})
export default class LibraryView extends Vue {
  @UserNS.State('seenProjects')
  public seenProjects!: string[];

  public url = window.location.origin;

  public title() {
    if (this.seenProjects.length == 0) {
      return "Quelques films de démonstration"
    } else {
      return "Mes films"
    }
  }

  public onCopy(projectId: string, mode: string = 'share') {
    const input = document.createElement('input');
    input.value = this.getLink(projectId, mode);
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  getLink(projectId: string, mode: string): string {
    let path = this.url + this.$router.resolve({
      name: 'movieHome',
      params: {
        projectId: projectId,
      },
    }).href;

    this.$buefy.toast.open('Lien copié');

    return path;
  }

  public onDuplicate(projectId: string) {
    console.log('DUPLICATE MOVIE', projectId); //TODO
  }

  public onExportImage(projectId: string) {

  }

  public onExportVideo(projectId: string) {

  }

  public onDelete(projectId: string) {
    console.log('DELETE MOVIE', projectId); //TODO
  }

  public onOpen(projectId: string) {
    this.$router.push({
      name: 'captureShots',
      params: {
        projectId: projectId,
      },
    });
  }

  public onLock(lock: boolean, projectId: string) {
    console.log('LOCK', lock, projectId);
    // this.$store.dispatch('project/lockMovie', projectId);
    // TODO. When action can accept projectId and lock status.
  }

  getMovieExportUrl(id: string) {
    return api.getExportUrl(id);
  }

  getVideoUrl(id: string) {
      return api.getVideoUrl(id);
    }

}
</script>
