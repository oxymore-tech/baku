<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />

    <nav v-if="id">
      <h1>Baku animation</h1>
      <router-link to="/capture">Capture</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss">
@import "styles/style.scss";
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const ProjectNS = namespace('project');

@Component({})
export default class App extends Vue {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Action('loadProject')
  private loadProjectAction!: (projectId: string) => Promise<void>;

  public async created() {
    const projectId = this.$route.params.projectid;
    if(projectId){
      await this.loadProjectAction(projectId);
      await this.$router.push(`/${projectId}/capture`);
    }
  }
}
</script>
