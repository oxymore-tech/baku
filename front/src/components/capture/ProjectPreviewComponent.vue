<template>
  <div class="project-preview-container">
    <h3>Voyage vers la lune</h3>
    <StoryboardPreviewComponent />
  </div>
</template>

<style lang="scss">
.project-preview-container {
    width: 290px;

    h3 {
        color: white;
        font-size: 24px;
    }
}
</style>


<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import StoryboardPreviewComponent from '@/components/capture/StoryboardPreviewComponent.vue';

@Component({
  components: {
    StoryboardPreviewComponent,
  },
})
export default class ProjectPreviewComponent extends Vue {
}
</script>