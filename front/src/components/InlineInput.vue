<style lang="scss" scoped>
  .inline-editor-disabled {
    padding: 10px;
  }
</style>

<template>
  <p v-if="disabled"
     :title="title"
     :class="`inline-editor-disabled ${customClass}`">{{value}}</p>
  <b-input v-else
           :type="type"
           :value="value"
           :title="editTitle"
           placeholder="Synopsis"
           icon-right="pencil"
           :custom-class="`${focus? null : 'inline-editor'} ${customClass}`"
           @input="setNewValue"
           @focus="onFocus"
           @blur="onBlur"></b-input>
</template>


<script lang="ts">
  import { Component, Prop, Vue } from 'vue-property-decorator';

  @Component
  export default class InlineInput extends Vue {

    @Prop({required: true})
    value!: string;

    @Prop({default: false})
    disabled!: boolean;

    @Prop({default: 'text'})
    type!: 'textarea' | 'text';

    @Prop()
    title!: string;

    @Prop()
    editTitle!: string;

    @Prop({default: ""})
    customClass!: string;

    newValue: string = "";

    focus: boolean = false;

    onFocus() {
      if (!this.disabled) {
        this.focus = true;
      }
    }

    setNewValue(newValue: string) {
      if (!this.disabled) {
        this.newValue = newValue;
      }
    }

    onBlur() {
      if (!this.disabled) {
        this.focus = false;
        this.$emit('input', this.newValue);
      }
    }

  }
</script>
