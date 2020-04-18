<style lang="scss" scoped>
  @import "../styles/home.scss";
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
        <span> Quelques films de démonstration</span>
      </div>
      <div class="movie-gallery">
        <div class="movie-card" @click="open('premier_montage')">
          <img src="@/assets/PremFois.jpg" />
          <div class="card-footer">
            <p>Mes premières fois</p>
          </div>
        </div>
        <div class="movie-card" @click="open('491df190-9c30-4e86-8e0a-c3bb06763379')">
          <img src="@/assets/PremFois.jpg" />
          <div class="card-footer">
            <p>Custom</p>
          </div>
        </div>
        <div class="movie-card" @click="open('premier')">
          <img src="@/assets/PremFois.jpg" />
          <div class="card-footer">
            <p>Test performance</p>
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

@Component
export default class HomeView extends Vue {
  @ProjectNS.Action('createShot')
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action('loadProject')
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public description1 = 'Baku est une rencontre entre instituteurs, artistes et développeurs.';

  public description2 = 'C’est une plateforme de création de films d’animation collaborative destinée aux enfants.';

  // public premierSynopsis = `Ce film d’animation a été réalisé par des enfants de l’école de
  //   Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous
  //   souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées.`;

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  public async created() {
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
    await this.$router.push({
      name: 'captureShot',
      params: {
        projectId,
        shotId,
      },
    });
  }

  public async open(movie: string) {
    await this.$router.push({
      name: 'movieHome',
      params: {
        projectId: movie,
      },
    });
  }
}
</script>
