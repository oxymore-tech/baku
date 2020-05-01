<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.materialdesignicons.com/2.5.94/css/materialdesignicons.min.css">

    <nav>
      <div class="left-nav">
        <a style="height:auto" href="/">
          <img src="@/assets/baku_logo.svg" class="baku-logo" alt="bakuanimation" />
        </a>
        <span class="movie-title" v-if="id && movie !==undefined">{{movie.title}}</span>
        <i v-if="id" class="icon-cog baku-button" @click="openProjectSettings()" />
      </div>
      <div class="routerlinks" v-if="id">
        <router-link :to="{ name: 'scenario', params: { projectId: id } }">
          Scenario
        </router-link>
        <router-link :to="{ name: 'storyboard', params: { projectId: id } }">
          Storyboard
        </router-link>
        <router-link :to="{ name: 'captureShots', params: { projectId: id } }">
          Capture
        </router-link>
        <router-link :to="{ name: 'movieEditing', params: { projectId: id } }">
          Montage
        </router-link>
        <router-link :to="{ name: 'collaboration', params: { projectId: id } }">
          Collaboratif
        </router-link>
      </div>
      <div
        v-if="this.$route.path != '/'"
        class="right-nav">
        {{ username }}
      </div>
    </nav>
    <router-view />
  </div>
</template>

<style lang="scss" >
@import "styles/style.scss";
@import "assets/style.css";

.left-nav {
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
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import ProjectSettingsPopup from '@/components/ProjectSettingsPopup.vue';
import { Movie } from '@/utils/movie.service';

const ProjectNS = namespace('project');
const UserNS = namespace('user');

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

  @UserNS.State
  public username!: string;

  public openProjectSettings() {
    this.$buefy.modal.open({
      parent: this,
      component: ProjectSettingsPopup,
      hasModalCard: true,
      canCancel: ['escape', 'outside'],
    });
  }
}
</script>
