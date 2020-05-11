<style lang="scss">
  @import "@/styles/library.scss";
</style>

<template>
  <div class="main-frame">
    <div class="title">
      <span>{{ title() }}</span>
    </div>

    <div class="movie-export-message">
      <div class="export-message">
        <p>
          Cette liste est une aide pour faciliter l'utilisation de Baku. Elle n'est pas
          sauvegardée dans nos serveurs. Si vous changez de navigateur, elle sera perdue. Nous
          vous conseillons de sauvegarder les url des films que vous souhaitez conserver.
        </p>
        <b-button class="export-url-button" @click="exportUrls">
          <i class="icon-attachment"></i>
          Exporter les url
        </b-button>
      </div>
    </div>

    <div class="toolbar">
      <b-switch v-model="showDemoProjects">Afficher les films de démonstration</b-switch>
    </div>

    <div class="movie-gallery">

      <div class="library-list">
        <div
          v-for="(project, index) in projects"
          :key="`project-${index}`"
          class="movie-card"
        >

          <div class="column-img">
            <img :src="project.posterUrl" :alt="`${project.title} poster`" @click="onOpen(project.id)"/>
          </div>

          <div class="flex-row">

            <div class="flex-column movie-info">

              <inline-input :value="project.title"
                            :disabled="project.locked"
                            custom-class="movie-card-title"
                            editTitle="Cliquez pour renommer le film" style="flex:1"
                            @input="setTitle(project, $event)"/>

              <inline-input :value="project.synopsis"
                            type="textarea"
                            :disabled="project.locked"
                            custom-class="movie-synopsis"
                            editTitle="Cliquez pour changer le synopsis"
                            @input="setSynopsis(project, $event)"/>

            </div>

            <div class="movie-toolbar-1">

              <div>
                <div v-if="project.lastUpdate">
                  <div class="indication">Dernière mise à jour</div>
                  <div>{{ project.lastUpdate | formatDate }}</div>
                </div>
                <div v-if="project.totalImages">
                  <div class="indication">Durée</div>
                  <div>{{getDurationString(project)}}</div>
                </div>
                <div v-if="project.totalImages">
                  {{getImagesString(project)}}
                </div>
              </div>

              <div class="button-open">
                <b-button type="is-primary" @click="onOpen(project.id)">Ouvrir</b-button>
              </div>

            </div>

            <div class="flex-column">

              <div class="movie-action" @click="onCopy(project.id, true)">
                <i class="icon-copy-regular"/>
                <span class="baku-button">Copier l'url de partage</span>
              </div>

              <div class="movie-action" v-if="project.adminId"
                   @click="onCopy(project.adminId, false)">
                <i class="icon-copy-solid"/>
                <span class="baku-button">Copier l'url d'administration</span>
              </div>

              <div class="movie-action">
                <a
                  :href="getMovieExportUrl()"
                  target="_blank"
                >
                  <i class="icon-image-sequence"/>
                  <span class="baku-button">Exporter les images</span>
                </a>
              </div>

              <video-button :id="project.id"/>

              <div @click="onDelete(project.id)">
                <i class="icon-close"/>
                <span class ="baku-button">Supprimer</span>
              </div>

            </div>

            <!--<div>
              <b-switch @input="onLock($event, project.id)">Verrouiller</b-switch>
            </div>-->

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
  import { getDemoProjects } from '@/api';
  import InlineInput from "@/components/InlineInput.vue";
  import { SeenProject } from "@/store/store.types";
  import { computeHours, computeMinutes, computeSeconds } from "@/store/project";
  import { MovieService } from "@/utils/movie.service";
  import VideoButton from "@/components/VideoButton.vue";
  import moment from 'moment'

  Vue.filter('formatDate', function(value: any) {
    if (value) {
      return moment(String(value)).format('MM/DD/YYYY hh:mm')
    }
  });

  const UserNS = namespace('user');

  @Component({
    components: {VideoButton, InlineInput},
    store
  })
  export default class LibraryView extends Vue {
    @UserNS.State('seenProjects')
    public seenProjects!: SeenProject[];

    @UserNS.Action('refreshSeenProjectsMetadata')
    refreshSeenProjectsMetadata!: Function;

    @UserNS.Action('deleteSeenProject')
    deleteSeenProject!: Function;

    public url = window.location.origin;

    showDemoProjects = false;

    mounted() {
      this.showDemoProjects = this.seenProjects.length == 0;
      this.refreshSeenProjectsMetadata();
    }

    get projects() {
      if (this.showDemoProjects) {
        return MovieService.removeDoublons([...getDemoProjects(), ...this.seenProjects]);
      } else {
        return this.seenProjects;
      }
    }

    public title() {
      if (this.seenProjects.length == 0) {
        return 'Quelques films de démonstration';
      }
      return 'Mes films';
    }

    public onCopy(projectId: string, share: boolean) {
      const input = document.createElement('input');
      input.value = this.getLink(projectId, share);
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    getLink(projectId: string, share: boolean): string {
      const path = this.url + this.$router.resolve({
        name: 'movie',
        params: {
          projectId
        }
      }).href;

      this.$buefy.toast.open('Lien copié');

      return path;
    }

    public onDelete(projectId: string) {
      this.$buefy.dialog.confirm({
        title: 'Suppression du film',
        message: 'Etes vous sûr de vouloir <b>supprimer</b> votre film ?',
        confirmText: 'Supprimer le film',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.deleteSeenProject(projectId)
      })
    }

    public onOpen(projectId: string) {
      this.$router.push({
        name: 'movie',
        params: {
          projectId
        }
      });
    }

    public async onLock(lock: boolean, projectId: string) {
      await this.$store.dispatch('project/lockMovie', {projectId, lock});
    }

    getMovieExportUrl(id: string) {
      return api.getExportUrl(id);
    }

    getVideoUrl(id: string) {
      return api.getVideoUrl(id);
    }

    exportUrls() {
      const rows = [
        ["titre", "url"],
        this.seenProjects.map(s => {
          const path = this.url + this.$router.resolve({
            name: 'movie',
            params: {
              projectId: s.adminId || s.id
            }
          }).href;
          return `"${s.title}", "${path}"`;
        })
      ];

      let csvContent = "data:text/csv;charset=utf-8,";

      rows.forEach(function (rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
      });
      const csv = encodeURI(csvContent);

      window.open(csv);
    }

    getImagesString(project: SeenProject) {
      if (project.totalImages) {
        return MovieService.getImagesString(project.totalImages);
      } else {
        return null;
      }
    }

    getDurationString(project: SeenProject) {
      if (project.totalImages && project.fps) {
        const hours = computeHours(project.totalImages, project.fps);
        const minutes = computeMinutes(project.totalImages, project.fps);
        const seconds = computeSeconds(project.totalImages, project.fps);
        const duration = {
          hours, minutes, seconds
        }
        return MovieService.getDurationString(duration);
      } else {
        return null;
      }
    }

    setTitle(seenProject: SeenProject, event: any) {
      if (event) {
        const newTitle = event.target.value;
        if (newTitle !== seenProject.title) {
          this.$store.dispatch('project/updateTitle', {projectId: seenProject.id, title: newTitle});
        }
      }
    }

    setSynopsis(seenProject: SeenProject, event: any) {
      if (event) {
        const newSynopsis = event.target.value;
        if (newSynopsis !== seenProject.synopsis) {
          this.$store.dispatch('project/updateSynopsis', {
            projectId: seenProject.id,
            synopsis: newSynopsis
          });
        }
      }
    }

    setFps(seenProject: SeenProject, event: any) {
      const newFps = event.target.value;
      if (newFps !== seenProject.fps) {
        this.$store.dispatch('project/updateFps', {projectId: seenProject.id, fps: newFps});
      }
    }

  }
</script>
