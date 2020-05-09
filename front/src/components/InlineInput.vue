<style lang="scss" scoped>
  .inline-editor-disabled {
    font-weight: 400;
    padding: 5px 9px;

    font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 16px;
    font-stretch: 100%;
    font-style: normal;
    font-variant-caps: normal;
    font-variant-east-asian: normal;
    font-variant-ligatures: normal;
    font-variant-numeric: normal;
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
