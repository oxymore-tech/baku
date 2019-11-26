<template>
  <div class="boxContainer storyboard-preview-container">
    <div>
      <h4>Storyboard</h4>
    </div>
    <img src="@/assets/storyboard.png"/>
    <select @change="onChange">
      <option
        v-for="plan in plans"
        :key="plan.id"
        :value="plan.id"
        :selected="plan.id === activePlanId"
      >{{plan.name}}
      </option>
    </select>
  </div>
</template>

<style lang="scss">
  .storyboard-preview-container {
    width: 290px;
    height: 256px;

    h4 {
      font-size: 28px;
      font-weight: bold;
    }
  }
</style>


<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator';
  import {Plan} from '@/api/film-service';

  @Component
  export default class StoryboardPreviewComponent extends Vue {
    @Prop({required: true})
    public plans!: Plan[];

    @Prop()
    public activePlanId!: string;

    public onChange(event: any) {
      this.$store.dispatch('project/changeActivePlan', this.plans.findIndex(plan => plan.id === event.target.value));
      // this.$emit('change', event.target.value)
    }

  }
</script>
