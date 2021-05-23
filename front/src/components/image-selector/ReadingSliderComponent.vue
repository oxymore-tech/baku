<template>
  <div class="b-slider is-info" :class="[size, rootClasses]">
    <div class="b-slider-track" @click="onSliderClick" ref="slider">
      <div class="b-slider-fill" :style="barStyle" />
      <template>
        <!--  -->
        <ReadingSliderTickComponent v-for="(val, key) in tickValues" :key="key" :value="val" />
      </template>
      <slot />
      <ReadingSliderThumbComponent
        v-if="valueLeft !== valueRight"
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
        v-if="valueLeft !== valueRight"
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
        @dragend="onDragEnd($event)"
      />
    </div>
  </div>
</template>

<style lang="scss">
.b-slider .b-slider-tick {
  background: transparent;
}

.b-slider .b-slider-track {
  background: #7f7f7f !important;
}

.b-slider .b-slider-tick,
.b-slider .b-slider-track {
  height: 24px !important;

  @media (max-height: 580px) {
    height: 16px !important;
  }
}

.b-slider-tick {
  background: transparent !important;
}

.b-slider .b-slider-thumb {
  height: 1.5rem;
}

div.b-slider-thumb-wrapper.active-thumb .b-slider-thumb {
  background-color: #ffbd72;
  width: 13px;
  height: 30px;
  box-shadow: 0px 0px 10px #0000004d;
}

div.b-slider-thumb-wrapper.active-thumb .liveview {
  background-color: #e66359;
}

@media (max-height: 580px) {
  .b-slider .b-slider-tick,
  .b-slider .b-slider-track {
    height: 16px !important;
  }
  div.b-slider-thumb-wrapper.active-thumb .b-slider-thumb {
    height: 24px;
  }
}
</style>

<script lang="ts">
import {
  Component, Prop, Vue, Watch,
} from 'vue-property-decorator';
import ReadingSliderTickComponent from '@/components/image-selector/ReadingSliderTickComponent.vue';
import ReadingSliderThumbComponent from '@/components/image-selector/ReadingSliderThumbComponent.vue';
import { ReadingSliderValue } from '@/utils/movie.service';

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

  get barStyle(): { width: string; left: string } {
    const maxValue = Math.max(this.valueLeft, this.valueRight);
    const minValue = Math.min(this.valueLeft, this.valueRight);
    const res = {
      width: `${(100 * (maxValue - minValue)) / (this.max - this.min)}%`,
      left: `${(100 * (minValue - this.min)) / (this.max - this.min)}%`,
      background: '#ffbd72 !important',
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
    return (this.$refs.slider as any).clientWidth;
  }

  public setFrame(value: number) {
    const buttonSelected = this.$refs.buttonSelected as ReadingSliderThumbComponent;
    buttonSelected.setFrame(value);
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
      this.$emit('dragging', this.valueSelected);
    }
  }

  onSliderClick(event: any) {
    if (this.disabled || this.isTrackClickDisabled) return;
    const sliderOffsetLeft = (this.$refs.slider as any).getBoundingClientRect()
      .left;
    const percent = ((event.clientX - sliderOffsetLeft) / this.sliderSize) * 100;
    const targetValue = Math.round(
      this.min + (percent * (this.max - this.min)) / 100,
    );
    const diffFirst = Math.abs(targetValue - this.valueSelected);
    if (diffFirst < this.step / 2) return;
    if (event.shiftKey) {
      if (this.isMultiSelectMode) {
        this.valueLeft = Math.min(targetValue, this.valueLeft);
        this.valueRight = Math.max(targetValue, this.valueRight);
      } else {
        this.valueLeft = Math.min(targetValue, this.valueSelected);
        this.valueRight = Math.max(targetValue, this.valueSelected);
      }
    } else if (this.isMultiSelectMode) {
      if (targetValue < this.valueLeft || targetValue > this.valueRight) {
        this.valueRight = 0;
        this.valueLeft = 0;
      }
    }
    this.valueSelected = targetValue;
    this.emitValue('change');
  }

  onDragStart() {
    this.dragging = true;
    this.$emit('dragstart');
  }

  onDragEnd(event: { oldValue: number; shiftKey: boolean }) {
    this.isTrackClickDisabled = true;
    setTimeout(() => {
      // avoid triggering onSliderClick after dragend
      this.isTrackClickDisabled = false;
    }, 0);
    this.dragging = false;
    this.$emit('dragend');
    this.emitValue('input', event);
  }

  emitValue(type: string, event?: { oldValue: number; shiftKey: boolean }) {
    if (event && event.shiftKey) {
      if (this.valueSelected < event.oldValue && !this.isMultiSelectMode) {
        this.$emit(type, {
          left: this.valueSelected,
          right: event.oldValue,
          selected: this.valueSelected,
        });
      }
      if (this.valueSelected > event.oldValue && !this.isMultiSelectMode) {
        this.$emit(type, {
          left: event.oldValue,
          right: this.valueSelected,
          selected: this.valueSelected,
        });
      }
    } else if (this.isMultiSelectMode) {
      this.$emit(type, {
        left: Math.min(this.valueSelected, this.valueLeft),
        right: Math.max(this.valueSelected, this.valueRight),
        selected: this.valueSelected,
      });
    } else {
      this.$emit(type, { left: 0, right: 0, selected: this.valueSelected });
    }
  }

  get isMultiSelectMode() {
    return this.valueLeft !== this.valueRight;
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
