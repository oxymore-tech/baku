<template>
    <div class="container vertical">
        <div class="container centered">
            <video ref="video" autoplay v-if="videoStream" :srcObject.prop="videoStream" width="640"
                   :style="computedEffect"
                   height="480"></video>
        </div>
        <div class="container columns">
            <div class="column">
                <b-field label="Camera">
                    <b-select v-model="selectedCamera">
                        <option v-for="camera in cameras"
                                :key="camera.id"
                                :value="camera.id">
                            {{ camera.label }}
                        </option>
                    </b-select>
                </b-field>
            </div>
            <div class="column">
                <b-field label="Record">
                    <b-button id="takePhotoButtonId" @click="record" :loading="capturing">Take photo</b-button>
                </b-field>
            </div>
        </div>
        <div class="container columns">
            <div class="column">
                <b-field label="Capture type">
                    <b-select v-model="captureType">
                        <option v-for="captureType in captureTypes"
                                :key="captureType"
                                :value="captureType">
                            {{ captureType }}
                        </option>
                    </b-select>
                </b-field>
            </div>
            <div class="column">
                <b-field label="Adjust quality">
                    <b-slider :min="0" :max="1" :step="0.1" v-model="quality"></b-slider>
                </b-field>
            </div>
        </div>
        <div class="container columns">
            <div class="column">
                <b-field label="Effect">
                    <b-select v-model="appliedEffect">
                        <option v-for="effect in filters"
                                :key="effect.name"
                                :value="effect.name">
                            {{ effect.name }}
                        </option>
                    </b-select>
                </b-field>
            </div>
            <div class="column">
                <b-field label="Adjust effect">
                    <b-slider :min="0" :max="100" v-model="effectValue"></b-slider>
                </b-field>
            </div>
        </div>
        <div class="container centered">
            {{ storageDetails }}
        </div>
        <div class="gallery">
            <img alt="" v-for="( item, index ) in captures" :key="index" :src="item.src" class="gallery-img"/>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from "vue-property-decorator";
    import {Map, Set} from "immutable";
    import {Filter, Filters} from "@/components/filters";

    class Device {

        constructor(id: string, label: string) {
            this.id = id;
            this.label = label;
        }

        readonly id: string;
        readonly label: string;

    }

    interface Capture {
        readonly src: string;
        readonly sizeInBytes: number;
    }

    @Component
    export default class HelloWorld extends Vue {
        private videoStream: MediaStream | null = null;
        private storageDetails: string = "";
        private captures: Capture[] = [];
        private cameras: Set<Device> = Set();
        private selectedCamera: string = "";
        private capturing: boolean = false;

        private filters: Filter[] = [
            {name: "none", unit: "none", func: Filters.none},
            {name: "blur", unit: "length", func: Filters.grayscale},
            {name: "brightness", unit: "percent", func: Filters.grayscale},
            {name: "contrast", unit: "percent", func: Filters.grayscale},
            {name: "grayscale", unit: "percent", func: Filters.grayscale},
            {name: "hue-rotate", unit: "angle", func: Filters.grayscale},
            {name: "invert", unit: "percent", func: Filters.grayscale},
            {name: "opacity", unit: "percent", func: Filters.grayscale},
            {name: "saturate", unit: "percent", func: Filters.grayscale},
            {name: "sepia", unit: "percent", func: Filters.grayscale}
        ];
        private appliedEffect = "none";
        private effectValue: number = 5;

        private captureTypes = ["image/jpeg", "image/png"];
        private captureType: string = "image/jpeg";
        private quality: number = 1;

        async mounted() {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                        this.cameras = Set(devices.filter(d => d.kind === "videoinput"))
                            .reduce((acc, d) => acc.set(d.deviceId, new Device(d.deviceId, d.label)), Map<string, Device>())
                            .toSet();
                        const first = this.cameras.first<Device>();
                        if (first) {
                            this.selectedCamera = first.id;
                        }
                    }
                );
            await this.refreshStorage();

            this.openCamera();
        }

        private async refreshStorage() {
            const total = this.captures.reduce((acc, value) => acc + value.sizeInBytes, 0);
            const average = total / this.captures.length;
            const averageFormatted = HelloWorld.formatBytes(average);
            const totalFormatted = HelloWorld.formatBytes(total);

            const {usage, quota} = await navigator.storage.estimate();
            const usageFormatted = HelloWorld.formatBytes(usage!);
            const quotaFormatted = HelloWorld.formatBytes(quota!);

            this.storageDetails = `${this.captures.length} captures ~ ${averageFormatted} / ${totalFormatted}. Storage ${usageFormatted}/${quotaFormatted}`;
        }

        private static formatBytes(bytes: number, decimals = 2): string {
            if (bytes === 0) return '0 Bytes';

            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

            const i = Math.floor(Math.log(bytes) / Math.log(k));

            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        private openCamera(camera?: string) {
            const constraints = {
                audio: false,
                video: {
                    deviceId: camera,
                    facingMode: "front",
                    width: {min: 640, ideal: 1920, max: 3840},
                    height: {min: 640, ideal: 1080, max: 2160}
                }
            };
            navigator
                .mediaDevices
                .getUserMedia(constraints)
                .then(stream => {
                    this.videoStream = stream;
                })
                .catch(e => {
                    console.log("Unable to read from web-cam ", e);
                });
        }

        get computedEffect(): string {
            const effect = this.filters.find(f => f.name === this.appliedEffect);
            if (!effect || effect.name == "none") {
                return "";
            }
            let unit = "";
            switch (effect.unit) {
                case "percent":
                    unit = "%";
                    break;
                case "length":
                    unit = "px";
                    break;
                case "angle":
                    unit = "deg";
                    break;
            }
            return `filter: ${effect.name}(${this.effectValue}${unit})`;
        }

        @Watch('selectedCamera')
        onCameraChanged(value: string, previous: string) {
            this.openCamera(this.selectedCamera);
        }

        toggleCamera() {
        }

        async record() {
            this.capturing = true;
            this.saveCaptureAndApplyFilter()
                .then(async (blob: Blob) => {
                    const sizeInBytes = blob!.size;
                    const src = URL.createObjectURL(blob);
                    this.captures.push({src, sizeInBytes});
                    await this.refreshStorage();
                    this.capturing = false;
                });
        }

        private saveCaptureAndApplyFilter(): Promise<Blob> {
            const canvas = document.createElement("canvas");
            const video = this.$refs.video as HTMLVideoElement;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context2d = canvas.getContext('2d')!;
            context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
            const filter = this.filters.find(f => f.name === this.appliedEffect);
            if (filter) {
                return this.applyFilter(context2d, canvas, filter);
            } else {
                return new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(blob => resolve(blob as Blob), this.captureType, this.quality);
                });
            }
        }

        private applyFilter(context2d: CanvasImageData, canvas: HTMLCanvasElement, filter: Filter) {
            let imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
            imageData = filter.func(imageData, {level: this.effectValue});
            return HelloWorld.toBlob(imageData, this.captureType, this.quality);
        }

        private static toBlob(imageData: ImageData, type: string, quality: number): Promise<Blob> {
            const w = imageData.width;
            const h = imageData.height;
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d")!;
            ctx.putImageData(imageData, 0, 0);
            return new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(blob => resolve(blob as Blob), type, quality);
            });
        }
    }
</script>

<style scoped>
    .container {
        display: flex;
        width: 100%;
        height: 100%;
    }

    .vertical {
        flex-direction: column;
    }

    .centered {
        justify-content: center;
        align-items: center;
    }

    .gallery {
        margin-top: 20px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 20px;
        width: 99%;
        overflow-x: auto;
        white-space: nowrap;
        background-color: rgb(52, 143, 235);
    }

    .gallery-img {
        cursor: pointer;
        margin-left: 10px;
        margin-right: 10px;
        margin-bottom: 10px;
        width: 256px;
        height: 144px;
        background-color: rgb(52, 143, 235);
    }

    h3 {
        margin: 40px 0 0;
    }

    ul {
        list-style-type: none;
        padding: 0;
    }

    li {
        display: inline-block;
        margin: 0 10px;
    }

    a {
        color: #42b983;
    }
</style>
