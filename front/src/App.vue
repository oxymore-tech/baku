<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />

    <nav v-if="id">
      <div class="left-nav">
        <img src="@/assets/baku_logo.svg" class="bakulogo" alt="bakuanimation" />
        <span class="movie-title" v-if="movie !==undefined">{{movie.title}}</span>
        <i class="icon-cog baku-button" @click="openProjectSettings()" />
      </div>
      <router-link to="/">Scenario</router-link>
      <router-link to="/">Storyboard</router-link>
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
@import "styles/font.css";

.left-nav {
  position: absolute;
  left: 24px;
  display: flex;
  align-items: center;
}

.movie-title {
  font-size: 24px;
  margin: 0 24px;
  overflow: hidden;
  /* height: 100%; */
  text-overflow: clip;
  white-space: nowrap;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import ProjectSettingsPopup from '@/components/ProjectSettingsPopup.vue';
import { Movie } from './api/movie.service';

const ProjectNS = namespace('project');

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
