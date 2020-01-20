<template>
  <div class="mainFrame">
    <div class="history">
      <span class="title"> Historique des actions : </span><br />
      <ul>
        <li v-for="(event, index) in history" :key="`action_${index}`" class="action"><b>{{user(event)}}</b> {{action(event)}} {{date(event)}}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import { BakuAction, BakuEvent } from '@/api/baku.service';

const ProjectNS = namespace('project');

@Component
export default class History extends Vue {
  @ProjectNS.Getter
  public history!: BakuEvent[];

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
      case BakuAction.SHOT_ADD:
        return 'ajoute un plan';
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

<style lang="scss" scoped>
  .mainFrame {
    background: white;
    width: 100%;
    height: calc(100% - 48px);
    display: inline-flex;
    flex-direction: column;
    overflow: auto;
  }

  .history {
    margin: 24px 24px;
  }

  .title {
    text-align: left;
    font-size: 18px;
    font-weight: normal;
  }

  .action {
    text-align: left;
    font-size: 14px;
    font-weight: normal;
  }
</style>
