<style lang="scss" scoped>
  @import "@/styles/home.scss";
</style>

<template>
  <div class="main">

    <div class="top-panel panel">
      <div style="position:absolute; left: 0">
        <img src="@/assets/baku_solo.svg" />
      </div>
      <div class="welcome-div">
        <h3>Bienvenue sur Baku</h3>
        <div class="description">
          <div>
            <span> {{ description1 }} </span>
          </div>
          <div>
            <span> {{ description2 }} </span>
          </div>
        </div>
        <div>
          <button class="create-button" @click="onCreateProject">Créer un film</button>
        </div>
      </div>
    </div>

    <div class="bottom-panel panel">
      <div class="title">
        <span>{{ bottomPanelTitle() }}</span>
      </div>

      <div class="movie-gallery">
        <div
          v-for="project in seenProjects"
          :key="project.id"
          class="movie-card"
          @click="open(project.id)"
        >
          <img :src="project.posterUrl" />
          <div class="card-footer">
            <p>{{ project.title }}</p>
          </div>
        </div>
      </div>


    </div>

  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as uuid from 'uuid';

const ProjectNS = namespace('project');
const UserNS = namespace('user');

@Component
export default class HomeView extends Vue {
  @UserNS.State('seenProjects')
  public seenProjects!: string[];

  @ProjectNS.Action('createShot')
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action('loadProject')
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  @ProjectNS.Action('changeFps')
  protected changeFps!: (fps: number) => Promise<void>;

  @ProjectNS.Action('updateTitle')
  protected updateTitle!: (title: string) => Promise<void>;

  public description1 = 'Baku est une rencontre entre instituteurs, artistes et développeurs.';

  public description2 = 'C’est une plateforme de création de films d’animation collaborative destinée aux enfants.';

  // public premierSynopsis = `Ce film d’animation a été réalisé par des enfants de l’école de
  //   Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous
  //   souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées.`;

  public bottomPanelTitle() {
    if (this.seenProjects.length == 0) {
      return "Quelques films de démonstration"
    } else {
      return "Mes films"
    }
  }

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  public async created() {
    if (!this.seenProjects) {
    }
    if (this.isMobile()) {
      this.$router.push({ name: 'smartphone' });
    }
    const { projectId } = this.$route.params;
    if (projectId) {
      await this.loadProjectAction(projectId);
      await this.$router.push({
        name: 'captureShots',
        params: { projectId },
      });
    }
  }

  public async onCreateProject() {
    const projectId = uuid.v4();
    await this.loadProjectAction(projectId);
    const shotId = await this.createShotAction('Nouveau plan');
    await this.changeFps(12);
    await this.updateTitle('Projet sans nom');
    await this.$router.push({
      name: 'captureShot',
      params: {
        projectId,
        shotId,
      },
    });
  }

  public async open(projectId: string) {
    await this.$router.push({
      name: 'movieHome',
      params: { projectId },
    });
  }
}
</script>
