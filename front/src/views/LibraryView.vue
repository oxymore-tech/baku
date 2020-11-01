<style lang="scss">
  @import "@/styles/library.scss";
</style>

<template>

  <div class="main-frame library">

    <div class="top-section">

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
        <b-switch v-model="showDemoProjects">Afficher films démos</b-switch>
      </div>

    </div>

    <div class="movie-gallery">

      <div class="library-list">
        <div
          v-for="(project, index) in projects"
          :key="`project-${index}`"
          class="movie-card"
        >

          <div class="column-img">
            <div v-bind:style="{ backgroundImage: 'url(' + project.posterUrl + ')' }"
                 class="project-image-container"
                 @click="onOpen(project.adminId || project.id)"></div>
          </div>

          <div class="movie-info">

            <div class="flex-row">

              <inline-input :value="project.title"
                            :disabled="project.locked"
                            placeholder="Titre"
                            custom-class="movie-card-title"
                            editTitle="Cliquez pour renommer le film" style="flex:1"
                            @input="setTitle(project, $event)"/>

            </div>

            <inline-input :value="project.synopsis"
                          type="textarea"
                          :disabled="project.locked"
                          placeholder="Synopsis"
                          custom-class="movie-synopsis"
                          editTitle="Cliquez pour changer le synopsis"
                          @input="setSynopsis(project, $event)"/>

          </div>

          <!-- <div class="movie-toolbars"> -->

            <div class="movie-toolbar-1">

              <div style="margin-right: 10px">
                <div v-if="project.lastUpdate">
                  <div class="indication">Mise à jour :</div>
                  <div>{{ project.lastUpdate | formatDate }}</div>
                </div>
                <div v-if="project.totalImages">
                  <div class="indication">Durée :</div>
                  <div>{{getDurationString(project)}}</div>
                </div>
              </div>

              <div class="button-open">
                <b-button type="is-primary" @click="onOpen(project.adminId || project.id)">Ouvrir
                </b-button>
              </div>

              <!--<div v-if="project.totalImages">
                <span class="indication">Images : </span>
                <span>{{project.totalImages}}</span>
              </div>-->

            </div>

            <div class="movie-toolbar-2">

              <div class="movie-action" @click="onCopy(project.id)">
                <i class="icon-copy-regular"/>
                <span class="baku-button">Copier l'url de partage</span>
              </div>

              <div class="movie-action" v-if="project.adminId"
                   @click="onCopy(project.adminId)">
                <i class="icon-copy-solid"/>
                <span class="baku-button">Copier l'url d'administration</span>
              </div>

              <div class="movie-action" @click="onMovieExportUrl(project.id)">
                <i class="icon-image-sequence"/>
                <span class="baku-button">Exporter les images</span>
              </div>

              <video-button :id="project.id"/>

              <div v-if="project.adminId && !project.locked" @click="onDelete(project.id)">
                <i class="icon-close"/>
                <span class="baku-button">Supprimer</span>
              </div>
              <div v-if="!project.isDemo" @click="onRemoveFromSeenProject(project.id)">
                <i class="icon-close"/>
                <span class="baku-button">Effacer de l'historique</span>
              </div>

            </div>

          <!-- </div> -->

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
import InlineInput from '@/components/InlineInput.vue';
import { SeenProject } from '@/store/store.types';
import { computeHours, computeMinutes, computeSeconds } from '@/store/project';
import { MovieService } from '@/utils/movie.service';
import VideoButton from '@/components/VideoButton.vue';
import moment from 'moment';

Vue.filter('formatDate', (value: any) => {
  if (value) {
    return moment(String(value)).format('MM/DD/YYYY HH:mm');
  }
});

const UserNS = namespace('user');
const ProjectNS = namespace('project');

  @Component({
    components: { VideoButton, InlineInput },
    store,
  })
export default class LibraryView extends Vue {
    @UserNS.State('seenProjects')
    public seenProjects!: SeenProject[];

    @UserNS.Action('refreshSeenProjectsMetadata')
    refreshSeenProjectsMetadata!: Function;

    @UserNS.Action('deleteProject')
    deleteProject!: Function;

    @UserNS.Action('deleteSeenProject')
    deleteSeenProject!: Function;

    @ProjectNS.Getter('synchronizing')
    projectSynchronizing!: boolean;

    @ProjectNS.Action('emptyState')
    emptyProjectState!: Function;

    public url = window.location.origin;

    showDemoProjects = false;

    mounted() {
      this.showDemoProjects = this.seenProjects.length == 0;
      this.refreshSeenProjectsMetadata();
      if (!this.projectSynchronizing) {
        this.emptyProjectState();
      }
    }

    get projects() {
      if (this.showDemoProjects) {
        return getDemoProjects().map((project) => ({ ...project, isDemo: true }));
      }
      return this.seenProjects;
    }

    public onCopy(projectId: string) {
      const input = document.createElement('input');
      input.value = this.getLink(projectId);
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999);
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    getLink(projectId: string): string {
      const path = this.getMovieUrl(projectId);

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
        onConfirm: () => this.deleteProject(projectId),
      });
    }

    public onRemoveFromSeenProject(projectId: string) {
      this.$buefy.dialog.confirm({
        title: "Retirer de l'historique",
        message: 'Etes vous sûr de vouloir <b>retirer</b> votre film de votre historique ?',
        confirmText: "Retirer le film de l'historique",
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.deleteSeenProject(projectId),
      });
    }

    public onMovieExportUrl(projectId: string) {
      window.open(api.getExportUrl(projectId), '_blank');
    }

    public onOpen(projectId: string) {
      this.$router.push({
        name: 'movie',
        params: {
          projectId,
        },
      });
    }

    exportUrls() {
      const rows = [
        ['titre', 'admin', 'partage'],
        ...this.seenProjects.map((s) => {
          const admin = this.getMovieUrl(s.adminId);
          const share = this.getMovieUrl(s.id);
          return [s.title, admin, share];
        }),
      ];

      let csvContent = 'data:text/csv;charset=utf-8,';

      rows.forEach((rowArray) => {
        const row = rowArray.join(',');
        csvContent += `${row}\r\n`;
      });
      const csv = encodeURI(csvContent);

      window.open(csv);
    }

    private getMovieUrl(id?: string) {
      if (id) {
        return this.url + this.$router.resolve({
          name: 'movie',
          params: {
            projectId: id,
          },
        }).href;
      }
      return '';
    }

    getDurationString(project: SeenProject) {
      if (project.totalImages && project.fps) {
        const hours = computeHours(project.totalImages, project.fps);
        const minutes = computeMinutes(project.totalImages, project.fps);
        const seconds = computeSeconds(project.totalImages, project.fps);
        const duration = {
          hours, minutes, seconds,
        };
        return MovieService.getDurationString(duration, true);
      }
      return null;
    }

    setTitle(seenProject: SeenProject, event: string) {
      if (event) {
        const newTitle = event;
        if (newTitle !== seenProject.title) {
          this.$store.dispatch('project/updateTitle', { projectId: seenProject.id, title: newTitle });
        }
      }
    }

    setSynopsis(seenProject: SeenProject, event: string) {
      if (event) {
        const newSynopsis = event;
        if (newSynopsis !== seenProject.synopsis) {
          this.$store.dispatch('project/updateSynopsis', {
            projectId: seenProject.id,
            synopsis: newSynopsis,
          });
        }
      }
    }

    setFps(seenProject: SeenProject, event: number) {
      const newFps = event;
      if (newFps !== seenProject.fps) {
        this.$store.dispatch('project/updateFps', { projectId: seenProject.id, fps: newFps });
      }
    }
}
</script>
