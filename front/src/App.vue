<template>
  <div id="app">
    <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap" rel="stylesheet" />

    <nav>
      <div class="left-nav">
        <a style="height:auto" href="/">
          <img src="@/assets/baku_logo.svg" class="bakulogo" alt="bakuanimation" />
        </a>
        <span class="movie-title" v-if="id && movie !==undefined">{{movie.title}}</span>
        <i v-if="id" class="icon-cog baku-button" @click="openProjectSettings()" />
      </div>
      <template v-if="id">
        <router-link :to="`/movies/${id}/scenario`">Scenario</router-link>
        <router-link :to="`/movies/${id}/storyboard`">Storyboard</router-link>
        <router-link :to="`/movies/${id}/capture/shots/`">Capture</router-link>
        <router-link :to="`/movies/${id}/movieEditing`">Montage</router-link>
        <router-link :to="`/movies/${id}/collaboration`">Collaboratif</router-link>
      </template>
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
@import "styles/font.css";

.left-nav {
  position: absolute;
  left: 24px;
  display: flex;
  align-items: center;
}

.right-nav {
  position: absolute;
  right: 24px;
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
import { Movie } from './api/movie.service';

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

  @ProjectNS.State
  public activeShotId!: string;

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
