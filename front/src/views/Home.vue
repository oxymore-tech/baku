<template>
  <div class="main">
    <div class="leftPanel panel">
      <div class="welcomediv">
        <img src="@/assets/baku_logo_solo.png" />
        <h3>Bienvenue sur Baku</h3>
      </div>
      <span>{{ description }}</span>
      <button class="createButton" @click="onCreateProject">Créer un film</button>
    </div>
    <div class="rightPanel panel"></div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  background: white;
  width: 100%;
  height: calc(100% - 48px);
  display: inline-flex;
  align-items: center;
}

.leftPanel {
  flex: 1;

  .welcomediv {
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    font-size: 96px;
    font-weight: bold;
  }

  img {
    width: 364px;
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

.rightPanel {
  width:519px;
}

.panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
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

  public description = `Baku est une rencontre entre instituteurs, artistes et développeurs.
  C’est une plateforme de création de films d’animation collaborative destinée aux enfants.`;

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
      }
    });
  }
}
</script>
