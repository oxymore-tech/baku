<template>
  <div
    class="modal-card"
    style="width: auto"
  >
    <header class="modal-card-head">
      <p class="modal-card-title">Réglages du films</p>
    </header>
    <section class="modal-card-body">
      <span>Votre film est automatiquement installé à l'adresse suivante :</span><br>
      <a :href="url+'/#/'+id">{{url+'/#/'+id}}</a><br>
      <span>Titre du film</span><br>
      <input type="text" :value="film.title" @blur="setTitle($event)"/><br>
      <span>Synopsis</span><br>
      <input type="text" :value="film.synopsis" @blur="setSynopsis($event)"/><br>
    </section>
  </div>
</template>

<style lang="scss">
</style>


<script lang="ts">

  import {Component, Vue} from 'vue-property-decorator';
  import {namespace} from "vuex-class";
  import {Film} from "@/api/film.service";

  const ProjectNS = namespace('project');

  @Component
  export default class ProjectSettingsPopup extends Vue {
    @ProjectNS.State
    public id!: string;
    @ProjectNS.Getter
    public film!: Film;

    public url = window.location.origin;

    public setTitle(event: any) {
      let newTitle = event.target.value;
      if (newTitle !== this.film.title) {
        this.$store.dispatch("project/updateTitle", newTitle);
      }
    }

    public setSynopsis(event: any) {
      let newSynopsis = event.target.value;
      console.log(newSynopsis);
      if (newSynopsis !== this.film.synopsis) {
        this.$store.dispatch("project/updateSynopsis", newSynopsis);
      }
    }

  }
</script>
