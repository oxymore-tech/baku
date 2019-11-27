<template>
  <div class="plansStack">
    <div class="plansStackTitle">
      <h3>Choisir un plan</h3>
      <button @click="closeStack()">Le bouton pour quitter</button>
    </div>
    <div class="planCardsContainer">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="planCard"
        v-bind:class="{ active: plan.id === activePlanId}"
      >
        <img
          v-if="plan.images[0]"
          class="planPreview"
          :src="`/${projectId}/images/${plan.id}/${plan.images[0]}?width=292&height=193`"
        />
        <div class="planPreview" v-else></div>
        <div class="cardFooter">
          <span class="planName">{{plan.name}}</span>
          <a class="activatePlan" @click="activatePlan(plan.id)">Ouvrir le plan</a>
        </div>
      </div>
      <div class="planCard">
        <div class="planPreview"></div>
        <div class="cardFooter">
          <span class="planName">Nouveau Plan</span>
          <a class="activatePlan" @click="createNewPlan()">Créer un nouveau plan</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.plansStack {
  width: 100%;
  height: 100%;
  background: #f2f2f2;
  display: flex;
  flex-direction: column;

  .plansStackTitle {
    margin: 0 24px;

    h3 {
      font-size: 28px;
      font-weight: bold;
    }
  }
}

.planCardsContainer {
  width: 100%;
  flex: 1;
  display: flex;
}

.planPreview {
  width: 100%;
  height: 193px;
  background-color: #bce0fd;
}

.planCard {
  width: 292px;
  height: 260px;
  background: #ffffff 0% 0% no-repeat padding-box;
  border-radius: 16px;
  opacity: 1;
  margin: 24px;
  font-size: 16px/6px;
  letter-spacing: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .cardFooter {
    padding: 7px;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .planName {
    text-align: left;
    color: #455054;
  }

  .activatePlan {
    color: #e66359;
    text-align: right;
  }
}

.active {
  box-shadow: 0px 0px 20px #00000029;
}
</style>


<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Plan } from "../api/film-service";

@Component
export default class PlansStack extends Vue {
  @Prop({ required: true })
  public plans!: Plan[];

  @Prop({ required: true })
  public activePlanId!: string;

  @Prop({ required: true })
  public projectId!: string;

  closeStack() {
    this.$emit("closestack");
  }

  activatePlan(id: string) {
    const planIndex = this.plans.findIndex(plan => plan.id === id);
    this.$store.dispatch("project/changeActivePlan", planIndex);
    this.$emit("closestack");
  }

  createNewPlan() {
    this.$store.dispatch("project/createPlan", "Nouveau Plan");
  }
}
</script>
