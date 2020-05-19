<style lang="scss" scoped>
@import "@/styles/home.scss";
</style>

<template>
  <div class="main">
    <div class="top-panel panel">
      <div class="welcome-div">
        <div class="welcome-div-header">
          <div class="welcome-div-logo"></div>
          <div class="welcome-div-description">
            <h3>Libérez votre imagination</h3>
            <div class="description">
              <div>
                <span>{{ description1 }}</span>
              </div>
              <div>
                <span class="name">{{ name }}</span>
                <span>{{ description2 }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="welcome-div-actions">
          <div class="create-button-container">
            <button class="create-button" @click="onCreateProject">Créer un film</button>
            <div class="create-button-top-right"></div>
          </div>
          <div id="libandyt">
            <div class="option-home" @click="onClickMyLibrary">
              <i class="icon-movie baku-button" />
              <span class="baku-button">Mes Films</span>
            </div>
            <a class="option-home" href="https://www.youtube.com/channel/UCpohf5pTeU-lVfl9V3g7v1Q">
              <i class="icon-youtube-brands baku-button" />
              <span>Tutoriels et films</span>
            </a>
          </div>
          <div class="mini-icons-container">
            <a href="https://www.instagram.com/bakuanim/">
              <img src="@/assets/instagram_logo.svg" />
            </a>
            <a href="https://twitter.com/bakuanimation">
              <img src="@/assets/twitter_logo.svg" />
            </a>
            <a href="https://bakuanimation.com">
              <img src="@/assets/facebook_logo.svg" />
            </a>
            <a href="https://bakuanimation.com">
              <img src="@/assets/baku_solo.svg" />
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-home">ver {{ version }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
import { createProject, getVersion } from "@/api";

const ProjectNS = namespace("project");
const UserNS = namespace("user");

@Component
export default class HomeView extends Vue {
  @UserNS.State("seenProjects")
  public seenProjects!: string[];

  @UserNS.Getter("getPersonalisedProjectTitle")
  public getPersonalisedProjectTitle!: string;

  @ProjectNS.Action("createShot")
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action("loadProject")
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  @ProjectNS.Action("changeFps")
  protected changeFps!: ({}) => Promise<void>;

  @ProjectNS.Action("updateTitle")
  protected updateTitle!: (title: string) => Promise<void>;

  public description1 =
    "Sortez vos crayons, pinceaux et couleurs, et racontez une histoire.";

  public name = "Baku ";

  public description2 =
    "est une plateforme collaborative de création de film d'animation.";

  version = "";

  // public premierSynopsis = `Ce film d’animation a été réalisé par des enfants de l’école de
  //   Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous
  //   souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées.`;

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  public async created() {
    if (!this.seenProjects) {
    }
    if (this.isMobile()) {
      this.$router.push({ name: "smartphone" });
    }
    const { projectId } = this.$route.params;
    if (projectId) {
      await this.loadProjectAction(projectId);
      await this.$router.push({
        name: "movie",
        params: { projectId }
      });
    }
    this.version = await getVersion();
  }

  public async onClickMyLibrary() {
    await this.$router.push({
      name: "library"
    });
  }

  public async onCreateProject() {
    const projectId = await createProject();
    await this.loadProjectAction(projectId);
    const shotId = await this.createShotAction("Nouveau plan");
    await this.changeFps({ projectId, fps: 12 });
    await this.updateTitle(this.getPersonalisedProjectTitle);
    this.$store.dispatch("project/changeActiveShot", shotId);
    await this.$router.push({
      name: "captureShot",
      params: {
        projectId,
        shotId
      }
    });
  }

  public async open(projectId: string) {
    await this.$router.push({
      name: "movie",
      params: { projectId }
    });
  }
}
</script>
