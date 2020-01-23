<template>
  <div
    class="b-slider is-info"
    :class="[size, rootClasses]"
  >
    <div
      class="b-slider-track"
      @click="onSliderClick"
      ref="slider"
    >
      <div
        class="b-slider-fill"
        :style="barStyle"
      />
      <template>
        <!--  -->
        <ReadingSliderTickComponent
          v-for="(val, key) in tickValues"
          :key="key"
          :value="val"
        />
      </template>
      <slot />
      <ReadingSliderThumbComponent
        v-model="valueLeft"
        :type="tooltipType"
        :tooltip="tooltip"
        :custom-formatter="customFormatter"
        ref="buttonLeft"
        role="slider"
        :aria-valuenow="valueLeft"
        :aria-valuemin="min"
        :aria-valuemax="max"
        aria-orientation="horizontal"
        :aria-label="Array.isArray(ariaLabel) ? ariaLabel[0] : ariaLabel"
        :aria-disabled="disabled"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      />

      <ReadingSliderThumbComponent
        v-model="valueRight"
        :type="tooltipType"
        :tooltip="tooltip"
        :custom-formatter="customFormatter"
        ref="buttonRight"
        role="slider"
        :aria-valuenow="valueRight"
        :aria-valuemin="min"
        :aria-valuemax="max"
        aria-orientation="horizontal"
        :aria-label="Array.isArray(ariaLabel) ? ariaLabel[1] : ''"
        :aria-disabled="disabled"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      />

      <ReadingSliderThumbComponent
        v-model="valueSelected"
        class="active-thumb"
        :type="tooltipType"
        :tooltip="tooltip"
        :custom-formatter="customFormatter"
        ref="buttonSelected"
        role="slider"
        :aria-valuenow="valueSelected"
        :aria-valuemin="min"
        :aria-valuemax="max"
        aria-orientation="horizontal"
        :aria-label="Array.isArray(ariaLabel) ? ariaLabel[0] : ariaLabel"
        :aria-disabled="disabled"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      />
    </div>
  </div>
</template>

<style lang="scss">
.b-slider .b-slider-tick{
  background: transparent;
}

.b-slider .b-slider-tick,
.b-slider .b-slider-track {
  height: 1rem;
}

.b-slider .b-slider-thumb {
  height: 1.5rem;
}

div.b-slider-thumb-wrapper.active-thumb .b-slider-thumb {
  background-color: #FFBD72;
  width: 0.7rem;
}
</style>

<script lang="ts">
import {
  Component, Prop, Vue, Watch,
} from 'vue-property-decorator';
import ReadingSliderTickComponent from '@/components/image-selector/ReadingSliderTickComponent.vue';
import ReadingSliderThumbComponent from '@/components/image-selector/ReadingSliderThumbComponent.vue';
import { ReadingSliderValue } from '@/api/movie.service';

@Component({
  components: {
    ReadingSliderTickComponent,
    ReadingSliderThumbComponent,
  },
})
export default class ReadingSliderComponent extends Vue {
  @Prop()
  public value!: ReadingSliderValue; // default: 0

  @Prop()
  public min!: number; // default: 0

  @Prop()
  public max!: number; // default: 100

  @Prop()
  public step!: number; // default: 1

  @Prop()
  public size!: string;

  @Prop()
  public tooltip!: boolean; // default: true

  @Prop()
  public tooltipType!: string;

  @Prop()
  public rounded!: boolean; // default: false

  @Prop()
  public disabled!: boolean; // default: false

  @Prop()
  public lazy!: boolean; // default: false

  @Prop()
  public customFormatter!: Function;

  @Prop()
  public ariaLabel!: string;

  private dragging = false;

  private isTrackClickDisabled = false;

  private isThumbReversed = false;

  public _isSlider = true; // Used by Thumb and Tick

  public valueLeft = 0;
  public valueRight = 0;
  public valueSelected = 0;

  created() {
    this.isThumbReversed = false;
    this.isTrackClickDisabled = false;
    this.setValues(this.value);
  }

  get tickValues(): number[] {
    if (this.min > this.max || this.step === 0) return [];
    const result = [];
    for (let i = this.min + this.step; i < this.max; i += this.step) {
      result.push(i);
    }
    return result;
  }

  get barStyle(): { width: string, left: string } {
    const maxValue = Math.max(this.valueLeft, this.valueRight);
    const minValue = Math.min(this.valueLeft, this.valueRight);
    const res = {
      width: `${(100 * (maxValue - minValue)) / (this.max - this.min)}%`,
      left: `${(100 * (minValue - this.min)) / (this.max - this.min)}%`,
    };
    return res;
  }

  get rootClasses() {
    return {
      'is-rounded': this.rounded,
      'is-dragging': this.dragging,
      'is-disabled': this.disabled,
    };
  }

  get sliderSize() {
    return (<any>this.$refs.slider).clientWidth;
  }

  setValues(newValue: ReadingSliderValue) {
    if (this.min > this.max) {
      return;
    }

    const smallValue = typeof newValue.left !== 'number' || Number.isNaN(newValue.left)
      ? this.min
      : Math.min(Math.max(this.min, newValue.left), this.max);
    const largeValue = typeof newValue.right !== 'number' || Number.isNaN(newValue.right)
      ? this.max
      : Math.max(Math.min(this.max, newValue.right), this.min);
    this.valueLeft = this.isThumbReversed ? largeValue : smallValue;
    this.valueRight = this.isThumbReversed ? smallValue : largeValue;
    this.valueSelected = Number.isNaN(newValue.selected)
      ? this.min
      : Math.min(this.max, Math.max(this.min, newValue.selected));
  }

  onInternalValueUpdate() {
    this.isThumbReversed = this.valueLeft > this.valueRight;
    if (!this.lazy && !this.dragging) {
      this.emitValue('input');
    }
    if (this.dragging) {
      this.$emit('dragging');
    }
  }

  onSliderClick(event: any) {
    if (this.disabled || this.isTrackClickDisabled) return;
    const sliderOffsetLeft = (<any>this.$refs.slider).getBoundingClientRect().left;
    const percent = ((event.clientX - sliderOffsetLeft) / this.sliderSize) * 100;
    const targetValue = Math.round(this.min + (percent * (this.max - this.min)) / 100);
    const diffFirst = Math.abs(targetValue - this.valueSelected);
    if (diffFirst < this.step / 2) return;

    this.valueSelected = targetValue;
    this.emitValue('change');
  }

  onDragStart() {
    this.dragging = true;
    this.$emit('dragstart');
  }

  onDragEnd() {
    this.isTrackClickDisabled = true;
    setTimeout(() => {
      // avoid triggering onSliderClick after dragend
      this.isTrackClickDisabled = false;
    }, 0);
    this.dragging = false;
    this.$emit('dragend');
    this.emitValue('input');
  }

  public setFrame(value: number) {
    (this.$refs.buttonSelected as ReadingSliderComponent).setFrame(value);
  }

  emitValue(type: string) {
    this.$emit(type, { left: this.valueLeft, right: this.valueRight, selected: this.valueSelected });
  }

  @Watch('value')
  onChangeValue(value: ReadingSliderValue) {
    this.setValues(value);
  }

  @Watch('valueLeft')
  onChangeValue1() {
    this.onInternalValueUpdate();
  }

  @Watch('valueRight')
  onChangeValueRight() {
    this.onInternalValueUpdate();
  }

  @Watch('valueSelected')
  onChangeValueSelected() {
    this.onInternalValueUpdate();
  }

  @Watch('min')
  onChangeMin() {
    this.setValues(this.value);
  }

  @Watch('max')
  onChangeMax() {
    this.setValues(this.value);
  }
}

</script>
