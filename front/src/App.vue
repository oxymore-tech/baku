<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />

    <nav v-if="id">
      <img src="@/assets/baku_logo.svg" class="bakulogo" alt="bakuanimation"/>
      <button @click="openProjectSettings()">settings</button>
      <router-link to="/">Scenario</router-link>
      <router-link to="/">Storyboard</router-link>
      <router-link v-if="id" :to="`/movies/${id}/shots`">Capture</router-link>
      <router-link v-else to="/capture">Capture</router-link>
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
import { Component, Vue } from 'vue-property-decorator';
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

  public openProjectSettings() {
    this.$buefy.modal.open({
      parent: this,
      component: ProjectSettingsPopup,
      hasModalCard: true,
    });
  }
}
</script>
