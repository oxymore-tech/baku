<template>
    <div class="boxContainer storyboard-preview-container">
        <div>
            <h4>Storyboard</h4>
        </div>
        <img src="@/assets/storyboard.png"/>
        <select @change="onPlanSelectChange($event)">
            <option
                    v-for="plan in plans"
                    v-bind:key="plan"
                    :value="plan"
                    :selected="plan === activePlan"
            >{{plan}}
            </option>
        </select>
        <b-button label="Test" @click="test"/>
    </div>
</template>

<style lang="scss">
    .storyboard-preview-container {
        width: 290px;

        h4 {
            font-size: 28px;
            font-weight: bold;
        }
    }
</style>


<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";
    import {namespace} from "vuex-class";
    import {BakuService} from "@/api/baku-service";

    const PlanNS = namespace("plan");

    @Component
    export default class StoryboardPreviewComponent extends Vue {
        @PlanNS.State
        public plans!: string[];
        @PlanNS.State
        public activePlan!: string;

        public onPlanSelectChange(event: any) {
            this.$store.commit("plan/changePlan", event.target.value);
        }

        public async test() {
            const bakuService = new BakuService();
            const blob = new Blob();
            const ref = await bakuService.upload("1", "0", blob, "test");
            console.log("Uploaded ", ref);
        }
    }
</script>