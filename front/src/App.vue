<template>
  <div id="app" class="app" :class="{'app-home': $route.name === 'home'}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css">

    <nav>
      <div class="left-nav">
        <b-dropdown append-to-body aria-role="list"  v-if="$route.name !== 'home'">
            <div
                class="logo is-success"
                slot="trigger"
                role="button"
                >
                <img src="@/assets/baku_logo.svg" class="baku-logo" alt="bakuanimation" />
            </div>

            <b-dropdown-item class="" aria-role="listitem">
              <div class="option-logo" @click="onPageAccueil()">
                <i class="icon-movie-start-01 baku-button"/>
                <span>Aller à la page d'accueil</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item aria-role="listitem">
              <div class="option-logo" @click="onPersoFilm()">
                <i class="icon-cog baku-button"/>
                <span>Personnaliser votre film</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item aria-role="listitem">
              <div class="option-logo" @click="onOpenLibrary()">
                <i class="icon-cloud baku-button"/>
                <span>Ouvrir ma librairie</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item aria-role="listitem">
               <div class="option-logo" @click="onOpenPlan()">
                <i class="icon-grid baku-button"/>
                <span>Accéder aux plans</span>
              </div>
            </b-dropdown-item>
            <b-dropdown-item v-if="this.id" aria-role="listitem">
              <div class="option-logo" @click="onCreatePlan()">
                <i class="icon-plus baku-button"/>
                <span>Créer un nouveau plan</span>
              </div>
            </b-dropdown-item>
        </b-dropdown>

        <span class="movie-title" v-if="id && movie !==undefined">{{movie.title}}</span>
        <i v-if="id" class="icon-cog baku-button" @click="openProjectSettings()" />
      </div>

      <div class="routerlinks" v-if="id">
        <!--
          <router-link :to="{ name: 'scenario', params: { projectId: id } }">
          Scenario
          </router-link>
          <router-link :to="{ name: 'storyboard', params: { projectId: id } }">
          Storyboard
          </router-link>
        -->
        <router-link :to="{ name: 'captureShots', params: { projectId: id } }">
          Capture
        </router-link>
        <!--
          <router-link :to="{ name: 'movieEditing', params: { projectId: id } }">
          Montage
          </router-link>
        -->
        <router-link :to="{ name: 'collaboration', params: { projectId: id } }">
          Collaboratif
        </router-link>
      </div>
      <div class="right-nav" :class="{'right-nav-home': $route.name === 'home'}">
        <i class="icon-user-dragon"/>
        {{ username }}
      </div>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss" >
@import "styles/style.scss";
@import "styles/buefy.scss";
@import "assets/style.css";

.left-nav {
  display: flex;
  align-items: center;
}

.movie-title {
  font-size: 24px;
  margin: 0 24px;
  overflow: hidden;
  /* height: 100%; */
  text-overflow: clip;
  white-space: nowrap;
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import ProjectSettingsPopup from '@/components/ProjectSettingsPopup.vue';
import { Movie } from '@/utils/movie.service';
import IssuePopup from '@/components/IssuePopup.vue';

const ProjectNS = namespace('project');
const UserNS = namespace('user');

@Component({
  components: {
    ProjectSettingsPopup,
  },
})
export default class App extends Vue {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @UserNS.State
  public username!: string;

  @UserNS.Getter('getPersonalisedProjectTitle')
  public getPersonalisedProjectTitle!: string;

  @ProjectNS.Action('createShot')
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action('changeFps')
  protected changeFps!: (fps: number) => Promise<void>;

  @ProjectNS.Action('updateTitle')
  protected updateTitle!: (title: string) => Promise<void>;

  public openProjectSettings() {
    this.$buefy.modal.open({
      parent: this,
      component: ProjectSettingsPopup,
      hasModalCard: true,
      canCancel: ['escape', 'outside'],
    });
  }

  public pageName!: string;

  public mounted () {
    this.pageName = this.$route.name as string;
  }

  public async onPageAccueil() {
    await this.$router.push({
      name: 'home'
    });
  }


  public async onPersoFilm() {
    await this.$router.push({
      name: 'movieEditing'
    });
  }

  public async onOpenLibrary() {
    await this.$router.push({
      name: 'captureShots' //a changer quand page my library dispo
    });
  }

  public async onOpenPlan() {
    await this.$router.push({
      name: 'captureShots'
    });
  }

  public async onCreatePlan() {
    const shotId = await this.createShotAction('Nouveau plan');
    await this.$router.push({
      name: 'captureShot',
      params: {
        projectId: this.id,
        shotId,
      },
    });
  }

  public openIssue() {
    this.$buefy.modal.open({
      parent: this,
      component: IssuePopup,
      hasModalCard: true,
      canCancel: ['escape', 'outside'],
    });
  }
}
</script>
