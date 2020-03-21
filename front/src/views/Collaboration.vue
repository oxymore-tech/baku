<template>
  <div class="mainFrame">
    <div class="history">
      <h4 class="title">Historique des actions :</h4>
      <ul>
        <li
          v-for="(event, index) in history"
          :key="`action_${index}`"
          class="action"
        >
          {{user(event) +" "}}
          <span class="action-highlight">{{action(event)}}</span>
          <span class="action-date">{{" " + date(event)}}</span>
        </li>
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
  font-size: 24px;
  font-weight: lighter;
  color: #455054;
  margin: 5px 0;
}

.action {
  text-align: left;
  font-size: 18px;
  font-weight: lighter;
  color: #455054;
  border-bottom: 1px solid #f2f2f2;
  margin: 5px;
}

.action-highlight {
  color: #27a2bb;
  font-weight: bold;
}

.action-date {
  font-weight: lighter;
  font-size: 14px;
  color: #7f7f7f;
}
</style>
