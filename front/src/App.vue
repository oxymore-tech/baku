<template>
  <div id="app" class="app" :class="{'app-home': $route.name === 'home'}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />
    <link
      rel="stylesheet"
      href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css"
    />

    <nav>
      <div class="left-nav">
        <b-dropdown append-to-body aria-role="list" v-if="$route.name !== 'home'">
          <div class="logo is-success" slot="trigger" role="button">
            <img
              src="@/assets/baku_logo_horizontal_menu_beta.svg"
              class="baku-logo"
              alt="bakuanimation"
            />
          </div>

          <b-dropdown-item class aria-role="listitem">
            <div class="option-logo" @click="onPageAccueil()">
              <i class="icon-movie-start-01 baku-button" />
              <span>Aller à la page d'accueil</span>
            </div>
          </b-dropdown-item>
          <b-dropdown-item aria-role="listitem">
            <div class="option-logo" @click="onPersoFilm()">
              <i class="icon-cog baku-button" />
              <span>Personnaliser votre film</span>
            </div>
          </b-dropdown-item>
          <b-dropdown-item aria-role="listitem">
            <div class="option-logo" @click="onOpenLibrary()">
              <i class="icon-cloud baku-button" />
              <span>Ouvrir ma librairie</span>
            </div>
          </b-dropdown-item>
          <b-dropdown-item aria-role="listitem">
            <div class="option-logo" @click="onOpenPlan()">
              <i class="icon-grid baku-button" />
              <span>Accéder aux plans</span>
            </div>
          </b-dropdown-item>
          <b-dropdown-item v-if="this.id" aria-role="listitem">
            <div class="option-logo" @click="onCreatePlan()">
              <i class="icon-plus baku-button" />
              <span>Créer un nouveau plan</span>
            </div>
          </b-dropdown-item>
        </b-dropdown>
      </div>

      <div
        class="flex-container"
        v-if="$route.name === 'captureShot' && activeShotIndex >= 0 || $route.name === 'movie'"
      >
        <div
          v-if="nbShot > 1 && $route.name === 'captureShot'"
          class="previous-plan"
          @click="goToPreviousPlan()"
          title="Plan précédent"
        >&lt;</div>
        <div class="baku-button" @click="onOpenPlan()">
          {{movie.title}}
          <template
            v-if="$route.name === 'captureShot' && activeShotIndex >= 0"
          >- Plan {{ activeShotIndex + 1 }}</template>
        </div>
        <div
          v-if="nbShot > 1 && $route.name === 'captureShot'"
          class="next-plan"
          @click="goToNextPlan()"
          title="Plan suivant"
        >&gt;</div>
      </div>

      <div class="flex-container">
        <div class="flex-container bug" :class="{'bug-home': $route.name === 'home'}">
          <div>
            <i
              class="icon-bullhorn-solid baku-button"
              @click="openIssue()"
              title="Reporter un bug"
            />
          </div>
        </div>
        <div class="flex-container right-nav" :class="{'right-nav-home': $route.name === 'home'}">
          <div>
            <i class="icon-user-dragon" />
          </div>
          <div class="pseudo">{{ username }}</div>
        </div>
      </div>
    </nav>
    <router-view :key="$route.fullPath" />
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
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import ProjectSettingsPopup from "@/components/ProjectSettingsPopup.vue";
import { Movie } from "@/utils/movie.service";
import IssuePopup from "@/components/IssuePopup.vue";

const ProjectNS = namespace("project");
const UserNS = namespace("user");

@Component({
  components: {
    ProjectSettingsPopup
  }
})
export default class App extends Vue {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Getter
  public movie!: Movie;

  @UserNS.State
  public username!: string;

  @UserNS.Getter("getPersonalisedProjectTitle")
  public getPersonalisedProjectTitle!: string;

  @ProjectNS.Action("createShot")
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action("changeFps")
  protected changeFps!: (fps: number) => Promise<void>;

  @ProjectNS.Action("updateTitle")
  protected updateTitle!: (title: string) => Promise<void>;

  @ProjectNS.Getter("getPreviousShotId")
  protected previousShotId!: string;

  @ProjectNS.Getter("getNextShotId")
  protected nextShotId!: string;

  @ProjectNS.Getter("getActiveShotIndex")
  public activeShotIndex!: Number;

  @ProjectNS.Getter("getShotCount")
  public nbShot!: Number;

  public openProjectSettings() {
    this.$buefy.modal.open({
      parent: this,
      component: ProjectSettingsPopup,
      hasModalCard: true,
      canCancel: ["escape", "outside"]
    });
  }

  public pageName!: string;

  public mounted() {
    this.pageName = this.$route.name as string;
  }

  public async onPageAccueil() {
    await this.$router.push({
      name: "home"
    });
  }

  public async onPersoFilm() {
    await this.$router.push({
      name: "movieEditing"
    });
  }

  public async onOpenLibrary() {
    await this.$router.push({
      name: "library"
    });
  }

  public async onOpenPlan() {
    await this.$router.push({
      name: "movie"
    });
  }

  public async onCreatePlan() {
    const shotId = await this.createShotAction("Nouveau plan");
    await this.moveToShot(shotId);
  }

  public async goToPreviousPlan() {
    const shotId = this.previousShotId;
    await this.moveToShot(shotId);
  }

  public async goToNextPlan() {
    const shotId = this.nextShotId;
    await this.moveToShot(shotId);
  }

  private async moveToShot(shotId: string) {
    return await this.$router.push({
      name: "captureShot",
      params: {
        projectId: this.id,
        shotId
      }
    });
  }

  public openIssue() {
    this.$buefy.modal.open({
      parent: this,
      component: IssuePopup,
      hasModalCard: true,
      canCancel: ["escape", "outside"]
    });
  }
}
</script>
