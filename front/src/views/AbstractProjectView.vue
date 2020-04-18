<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const ProjectNS = namespace('project');

@Component
// TODO: find a better class name
export default class Project extends Vue {
  @ProjectNS.State
  public id!: string;

  @ProjectNS.Action('loadProject')
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public async created() {
    const { projectId } = this.$route.params;
    if (projectId) {
      // TODO: do not load project every time
      // if (this.id == "") {
        await this.loadProjectAction(projectId);
      // }
    } else {
      await this.$router.push({ name: 'home' });
    }
  }
}
</script>
