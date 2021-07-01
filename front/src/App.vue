<template>
  <div id="app" class="app" :class="{ 'app-home': $route.name === 'home' }">
    <link
      href="https://fonts.googleapis.com/css?family=Montserrat&display=swap"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css"
    />

    <nav>
      <div class="left-nav">
        <div v-if="$route.name !== 'home'">
          <div class="logo is-success" role="button" @click="onPageAccueil()">
            <img
              src="@/assets/baku_logo_solo.png"
              class="baku-logo"
              alt="bakuanimation"
            />
          </div>
        </div>

        <b-dropdown
          append-to-body
          aria-role="list"
          v-if="$route.name !== 'home' && $route.name !== 'smartphone'"
        >
          <div class="label-menu" slot="trigger" role="button">
            <p v-if="$route.params.projectId">
              {{ this.movie.title }}
              <i class="icon-ellipsis-v baku-button" />
            </p>
            <p v-else>
              Mes films
              <i class="icon-ellipsis-v baku-button" />
            </p>
          </div>

          <b-dropdown-item class aria-role="listitem" v-if="$route.name !== 'library'">
            <div class="option-logo" @click="onClickMyLibrary()">
              <i class="icon-folder-open-regular baku-button"/>
              <span>Mes films</span>
            </div>
          </b-dropdown-item>

          <!--          <b-dropdown-item class aria-role="listitem">-->
          <!--            <div class="option-logo" @click="onClickMyLibrary()">-->
          <!--              <i class="icon-movie baku-button"/>-->
          <!--              <span>Mes films récents</span>-->
          <!--            </div>-->
          <!--          </b-dropdown-item>-->

          <b-dropdown-item class aria-role="listitem">
            <div class="option-logo" @click="onCreateProject()">
              <i class="icon-plus baku-button" />
              <span>Nouveau film</span>
            </div>
          </b-dropdown-item>
        </b-dropdown>

        <b-dropdown append-to-body aria-role="list"
                    v-if="$route.params.projectId && ($route.name === 'captureShot' || $route.name === 'movie'|| $route.name === 'audio') ">
          <div
            class="label-menu label-menu-sep-left"
            slot="trigger"
            role="button"
          >
            <p v-if="$route.name === 'captureShot'">
              Capture <i class="icon-angle-down baku-button" />
            </p>
            <p v-else-if="$route.name === 'movie'">
              Plans <i class="icon-angle-down baku-button" />
            </p>
            <!--            <p v-else-if="$route.name === 'movieEditing'">Edition <i-->
            <!--              class=" icon-angle-down baku-button"/></p>-->
            <!--            <p v-else-if="$route.name === 'library'">Mes films <i-->
            <!--              class=" icon-angle-down baku-button"/></p>-->
            <p v-else-if="$route.name === 'audio'">Audio <i
              class=" icon-angle-down baku-button"/></p>
            <p v-else>{{$route.name}} <i class="icon-angle-down baku-button"/></p>
          </div>

          <b-dropdown-item class aria-role="listitem"
                           :disabled="!this.activeShotId || $route.name === 'captureShot'">
            <div class="option-logo" @click="goToShot()">
              <i class="icon-camera baku-button"/>
              <span>Capture</span>
            </div>
          </b-dropdown-item>

          <b-dropdown-item class aria-role="listitem">
            <div class="option-logo" @click="onOpenPlan()">
              <i class="icon-grid baku-button"/>
              <span>Plans</span>
            </div>
          </b-dropdown-item>

          <b-dropdown-item class aria-role="listitem">
            <div class="option-logo" @click="goToAudio()">
              <i class="icon-grid baku-button"/>
              <span>Audio</span>
            </div>
          </b-dropdown-item>

          <!--          <b-dropdown-item class aria-role="listitem">-->
          <!--            <div class="option-logo" @click="onCreatePlan()">-->
          <!--              <i class="icon-plus baku-button"/>-->
          <!--              <span>Nouveau plan</span>-->
          <!--            </div>-->
          <!--          </b-dropdown-item>-->
        </b-dropdown>
      </div>

      <div
        class="plans-container"
        v-if="
          ($route.name === 'captureShot' && activeShotIndex >= 0) ||
          $route.name === 'movie'
        "
      >
      <div
          v-if="nbShot > 1 && $route.name === 'captureShot'"
          class="previous-plan"
          @click="goToPreviousPlan()"
          title="Plan précédent"
        >&lt;
        </div>

        <div class="baku-button">
          <template v-if="$route.name === 'captureShot' && activeShotIndex >= 0"
            >Plan {{ activeShotIndex + 1 }}
          </template>
        </div>
        <div
          v-if="nbShot > 1 && $route.name === 'captureShot'"
          class="next-plan"
          @click="goToNextPlan()"
          title="Plan suivant"
        >&gt;
        </div>
      </div>

      <div class="flex-container">
        <div class="flex-container connect-indicator">
          <div v-if="this.connectionIndicator" class="online">
          </div>
          <div v-else class="offline">
          </div>
        </div>
        <div
          class="flex-container bug"
          :class="{ 'bug-home': $route.name === 'home' }"
        >
          <div>
            <i
              class="icon-bullhorn-solid baku-button"
              @click="openIssue()"
              title="Reporter un bug"
            />
          </div>
        </div>
        <div
          class="flex-container right-nav"
          :class="{ 'right-nav-home': $route.name === 'home' }"
        >
          <!-- <i :class="'icon-user-'+getIcon" :style="{color: usercolor}" /> -->
          <div class="pseudo" @click="openRenamePopup()">{{ username }}</div>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss">
@import "styles/style.scss";
@import "styles/buefy.scss";
@import "assets/style.css";
@import "styles/mediaqueries.scss";

.left-nav {
  display: flex;
  align-items: center;
}

.movie-title {
  font-size: 2.4rem;
  margin: 0 24px;
  overflow: hidden;
  /* height: 100%; */
  text-overflow: clip;
  white-space: nowrap;
}

.plans-container {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
}

@media (max-height: 580px) {
  .plans-container {
    position: absolute;
    left: 18px;
    top: 60px;
  }
}
</style>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import ProjectSettingsPopup from "@/components/ProjectSettingsPopup.vue";
import { Movie } from "@/utils/movie.service";
import IssuePopup from "@/components/IssuePopup.vue";
import RenamePopup from "@/components/RenamePopup.vue";
import { createProject } from "@/api";

const ProjectNS = namespace("project");
const UserNS = namespace("user");

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

  @UserNS.State
  public usercolor!: string;

  @UserNS.Getter("getPersonalisedProjectTitle")
  public getPersonalisedProjectTitle!: string;

  @UserNS.Getter("getIcon")
  public getIcon!: string;

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

  @ProjectNS.State
  public activeShotId!: string;

  @ProjectNS.Action("loadProject")
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public pageName!: string;

  public connectionIndicator!: boolean;

  public mounted() {
    this.pageName = this.$route.name as string;
    this.getConnection();
  }

  public async getConnection() {
    setInterval(()=>{
      this.connectionIndicator = navigator.onLine
      // console.log(this.connectionIndicator)
    },2000)
  }

  public async onPageAccueil() {
    await this.$router.push({
      name: "home",
    });
  }

  public async onPersoFilm() {
    await this.$router.push({
      name: "movieEditing",
    });
  }

  public async onOpenLibrary() {
    await this.$router.push({
      name: "library",
    });
  }

  public async onOpenPlan() {
    if (this.$route.name === "captureShot") {
      await this.$router.push({
        name: "movie",
      });
    }
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
    return this.$router.push({
      name: "captureShot",
      params: {
        projectId: this.id,
        shotId,
      },
    });
    // return this.$store.dispatch('project/changeActiveShot', shotId);
  }

  public openIssue() {
    this.$buefy.modal.open({
      parent: this,
      component: IssuePopup,
      hasModalCard: true,
      canCancel: ["escape", "outside"],
    });
  }

  public openRenamePopup() {
    this.$buefy.modal.open({
      parent: this,
      component: RenamePopup,
      hasModalCard: true,
      canCancel: ["escape", "outside"],
    });
  }

  public async onCreateProject() {
    const projectId = await createProject();
    await this.loadProjectAction(projectId);
    const shotId = await this.createShotAction("Nouveau plan");
    await this.changeFps(12);
    await this.updateTitle(this.getPersonalisedProjectTitle);
    await this.$store.dispatch("project/changeActiveShot", shotId);
    await this.$router.push({
      name: "captureShot",
      params: {
        projectId,
        shotId,
      },
    });
  }

  public async onClickMyLibrary() {
    await this.$router.push({
      name: "library",
    });
  }

  public async goToShot() {
    await this.moveToShot(this.activeShotId);
  }

    public async goToAudio() {
      if (this.$route.name === 'captureShot' || 'movie') {
        await this.$router.push({
          name: 'audio',
          params: {
            projectId: this.id,
            //shotId: this.activeShotId,
          },
        });
      }
    }

}
 if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js',{type:'module'}).then(function(registration) {
      // Registration was successful
      //console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      //console.log('ServiceWorker registration failed:');
    });
  });
} 

</script>
