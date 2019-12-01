<template>
  <div class="main">
    <div class="leftPanel panel">
      <img src="@/assets/baku_logo_vert.png" />
      <h3>Bienvenue de Baku</h3>
      <span>{{ lorem }}</span>
      <button class="createButton" @click="onCreateProject">Créer un film</button>
    </div>
    <div class="rightPanel panel"></div>
  </div>
</template>

<style lang="scss">
.main {
  background: white;
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
}

.leftPanel {
  h3 {
    font-size: 52;
    font-weight: bold;
  }

  img {
    height: 550px;
    width: 438px;
    margin: 0 auto;
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

.panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  width: 50%;
}
</style>


<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { namespace } from "vuex-class";
import * as uuid from "uuid";

const ProjectNS = namespace("project");

@Component
export default class Init extends Vue {
  @ProjectNS.Action("createShot")
  private createShotAction!: (name?: string) => Promise<void>;

  @ProjectNS.Action("loadProject")
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
     ut labore et dolore magna aliqua. Ut enim ad minim veniam,
      quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

  @ProjectNS.Getter
  public getActiveShotId!: string;

  public isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  public async created() {
    if (this.isMobile()) {
      this.$router.push({ name: "smartphone" });
    }
    const { projectId } = this.$route.params;
    if (projectId) {
      await this.loadProjectAction(projectId);
      await this.$router.push({
        name: "captureShots",
        params: { projectId }
      });
    }
  }

  public async onCreateProject() {
    const projectId = uuid.v4();
    await this.loadProjectAction(projectId);
    await this.createShotAction("Nouveau plan");
    await this.$router.push({
      name: "captureShot",
      params: {
        projectId,
        shotId: this.getActiveShotId
      }
    });
  }
}
</script>
