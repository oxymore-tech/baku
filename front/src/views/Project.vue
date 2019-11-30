<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { namespace } from 'vuex-class';

const ProjectNS = namespace('project');

@Component
export default class Project extends Vue {
  @ProjectNS.State
  public history!: string;

  @ProjectNS.Action('loadProject')
  protected loadProjectAction!: (projectId: string) => Promise<void>;

  public async created() {
    const projectId = this.$route.params.projectid;
    if(projectId){
      await this.loadProjectAction(projectId);
    } else {
      await this.$router.push('/home');
    }
  }
}
</script>
