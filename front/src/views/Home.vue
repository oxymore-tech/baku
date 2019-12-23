<template>
  <div class="main">
    
    <div class="topPanel panel">
      <div>
        <img src="@/assets/baku_logo_solo.png" />
      </div>
      <div class="welcomediv">
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
          <button class="createButton" @click="onCreateProject">Créer un film</button>
        </div>
      </div>
    </div>

    <div class="bottomPanel panel">
      <div class="title">
        <span> Quelques films de démonstration </span>
      </div>
      <div class="movieGallery">
        <div class="movieCard" @click="openPremier">
          <img src="@/assets/PremFois.jpg" />
          <div class="cardFooter">
            <p>Mes premières fois</p>
          </div>
        </div>
        <div class="movieCard" @click="openPremier">
          <img src="@/assets/PremFois.jpg" />
          <div class="cardFooter">
            <p>Mes premières fois</p>
          </div>
        </div>
        <div class="movieCard" @click="openPremier">
          <img src="@/assets/PremFois.jpg" />
          <div class="cardFooter">
            <p>Mes premières fois</p>
          </div>
        </div>
        <div class="movieCard" @click="openPremier">
          <img src="@/assets/PremFois.jpg" />
          <div class="cardFooter">
            <p>Mes premières fois</p>
          </div>
        </div>
        <div class="movieCard" @click="openPremier">
          <img src="@/assets/PremFois.jpg" />
          <div class="cardFooter">
            <p>Mes premières fois</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  background: white;
  width: 100%;
  height: calc(100% - 48px);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
}

.topPanel {
  flex-direction: row;
  margin-top: 4.5%;

  .welcomediv {
    margin-top: 50px;
    display: inline-flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
  }

  h3 {
    font-size: 96px;
    font-weight: bold;
  }

  span {
    font-size: 24px;
  }

  img {
    width: 364px;
    display: inline-flex;
  }

  .createButton {
    margin: 0 0 0 auto;
    width: 292px;
    height: 48px;
    background: #e66359 0% 0% no-repeat padding-box;
    box-shadow: 0px 0px 20px #00000029;
    border-radius: 44px;
    color: white;
    border: 0;
    cursor: pointer;
    font-size: 16px;
  }
}

.bottomPanel {
  width: 100%;
  flex-direction: column;
  margin-top: 4.5% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;

  .title {
    text-align: center;
    font-size: 18px;
    font-weight: normal;
  }
  .movieGallery {
    background-color: #fe676f;
    box-shadow: 0 0 20px #00000055;
    display: flex;
  }
  .movieCard {
    cursor: pointer;
    width: 200px;
    height: 150px;
    background: #ffffff 0% 0% no-repeat padding-box;
    border-radius: 16px;
    opacity: 1;
    margin: 24px 0px 24px 24px;
    letter-spacing: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    text-align: center;
    font-size: 14px;

    img {
      width: 200px;
      height: 119px;
    }

    .cardFooter {
      padding: 7px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }
}

.panel {
  padding: 24px;
  display: flex;
}
</style>


<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import * as uuid from 'uuid';

const ProjectNS = namespace('project');

@Component
export default class Init extends Vue {
  @ProjectNS.Action('createShot')
  private createShotAction!: (name?: string) => Promise<string>;

  @ProjectNS.Action('loadProject')
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public description1 = `Baku est une rencontre entre instituteurs, artistes et développeurs.`;
  public description2 = `C’est une plateforme de création de films d’animation collaborative destinée aux enfants.`;

  public premierSynopsis = `Ce film d’animation a été réalisé par des enfants de l’école de
  Tournefeuille en collaboration avec la Ménagerie. Vous pouvez faire les modifications que vous
  souhaitez pour vous familiariser avec Baku. Vos modifications ne seront pas sauvegardées.`;

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

  public async openPremier() {
    await this.$router.push({
      name: 'movieHome',
      params: {
        projectId: 'premier',
      },
    });
  }
}
</script>
