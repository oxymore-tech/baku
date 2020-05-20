<style lang="scss" scoped>
  @import "@/styles/history.scss";
</style>

<template>
  <div class="history" :class="{'mini-mode': !displayed}">
    <h4 class="title">
      <i class="icon-history"></i>
      <span>Historique</span>
      <i class="icon-chevron-right baku-button" @click="displayed = !displayed"></i>
    </h4>
    <ul>
      <li
        v-for="(event, index) in history.slice().reverse()"
        :key="`action_${index}`"
        class="action"
      >
        <i class="icon-user-circle"/>
        <div>
          <div>
            <span class="action-user">{{user(event) +" "}}</span>
            <span class="action-highlight">{{action(event)}}</span>
          </div>
          <div class="action-date">{{" " + date(event)}}</div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { BakuAction, BakuEvent } from '@/utils/types';

const ProjectNS = namespace('project');

@Component
export default class HistoryComponent extends Vue {
  @ProjectNS.State
  public history!: BakuEvent[];

  public displayed: boolean = true;

  public user(event: BakuEvent): string {
    return event.user;
  }

  public action(event: BakuEvent): string {
    switch (event.action) {
      case BakuAction.MOVIE_UPDATE_TITLE:
        return 'change le titre du film';
      case BakuAction.MOVIE_UPDATE_SYNOPSIS:
        return 'change le synopsis du film';
      case BakuAction.MOVIE_UPDATE_POSTER:
        return 'change le poster du film';
      case BakuAction.MOVIE_INSERT_IMAGE:
        return 'ajoute une photo';
      case BakuAction.MOVIE_REMOVE_IMAGE:
        return 'supprime une photo';
      case BakuAction.SHOT_ADD:
        return 'ajoute un plan';
      case BakuAction.SHOT_REMOVE:
        return 'supprime un plan';
      case BakuAction.CHANGE_FPS:
        return `change les fps du film ${event.value}`;
      default:
        return '';
    }
  }

  public date(event: BakuEvent): string {
    if (event.timestamp) {
      return new Date(event.timestamp).toLocaleString();
    }
    return '';
  }
}
</script>
