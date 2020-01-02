<template>
  <div class="mainFrame">
    <div class="history">
      <span class="title"> Historique des actions : </span><br />
      <span v-for="action in actions" class="action">{{ action }}<br /></span>
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

  get actions(): String[] {
    let actions: String[] = [];
    for (const bakuEvent of this.history) {
      let line = `${bakuEvent.user} `;
      let action;
      switch (bakuEvent.action) {
        case BakuAction.MOVIE_UPDATE_TITLE:
          action = 'change le titre du film';
          break;
        case BakuAction.MOVIE_UPDATE_SYNOPSIS:
          action = 'change le synopsis du film';
          break;
        case BakuAction.MOVIE_UPDATE_POSTER:
          action = 'change le poster du film';
          break;
        case BakuAction.MOVIE_INSERT_IMAGE:
          action = `ajoute la photo ${bakuEvent.value.image}`;
          break;
        case BakuAction.SHOT_ADD:
          action = `ajoute le plan ${bakuEvent.value.shotId}`;
          break;
        case BakuAction.CHANGE_FPS:
          action = `change les fps du film${bakuEvent.value}`;
          break;
        default:
          break;
      }
      line += action;
      actions = actions.concat(line);
    }
    return actions;
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
