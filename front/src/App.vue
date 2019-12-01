<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />

    <nav v-if="id">
      <img src="@/assets/baku_logo.svg" class="bakulogo" alt="bakuanimation"/>
      <button @click="openProjectSettings()">settings</button>
      <router-link to="/">Scenario</router-link>
      <router-link to="/">Storyboard</router-link>
      <!--
      <router-link v-if="activeShotId" :to="{ name: 'captureShot', params: { projectId: ${id}, shotId: ${activeShotId} } }">
        Capture
      </router-link>
      <router-link v-else :to="{ name: 'captureShots', params: { projectId: ${id} } }">
        Capture
      </router-link>
      -->
      <router-link v-if="activeShotId" :to="`/movies/${id}/capture/shots/${activeShotId}`">Capture</router-link>
      <router-link v-else :to="`/movies/${id}/capture/shots/`">Capture</router-link>
      <router-link to="/">Montage</router-link>
      <router-link to="/">Collaboratif</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss">
@import "styles/style.scss";
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import ProjectSettingsPopup from '@/components/ProjectSettingsPopup.vue';

const ProjectNS = namespace('project');

@Component({
  components: {
    ProjectSettingsPopup,
  },
})
export default class App extends Vue {
  @ProjectNS.State
  public id!: string;

  @Prop()
  public activeShotId!: string;

  public openProjectSettings() {
    this.$buefy.modal.open({
      parent: this,
      component: ProjectSettingsPopup,
      hasModalCard: true,
    });
  }
}
</script>
