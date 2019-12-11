<template>
  <div class="main">
    <div class="leftPanel panel">
      <div class="welcomediv">
        <img src="@/assets/baku_logo_solo.png" />
        <h3>Pas encore disponible</h3>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  background: white;
  width: 100%;
  height: calc(100% - 48px);
  display: inline-flex;
  align-items: center;
}

.leftPanel {
  flex: 1;
  margin-left: 200px;

  .welcomediv {
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    font-size: 96px;
    font-weight: bold;
  }

  img {
    width: 364px;
  }
}
</style>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import Project from './Project.vue';

@Component
export default class Todo extends Project {
}
</script>
