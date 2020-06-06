<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Changer le pseudo</p>
    </header>
    <section class="modal-card-body">
      <input ref="usrname" type="text" :value="username" />
      <br />
    </section>
    <footer class="modal-card-foot">
      <button class="button" type="button" @click="$parent.close()">Close</button>
      <button class="button is-primary" @click="changeName()">Ok</button>
    </footer>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";
const UserNS = namespace("user");

@Component
export default class SmartphoneSynchroPopupComponent extends Vue {
  @UserNS.State
  public username!: string;

  @UserNS.Action('updateUsername')
  public updateUsername: (username: string) => Promise<void>;

  public async changeName() {
    this.updateUsername((this.$refs['usrname'] as any).value);
    (this.$parent as any).close();
  }
}
</script>
