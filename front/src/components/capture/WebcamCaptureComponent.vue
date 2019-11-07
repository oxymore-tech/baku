<!-- Source: https://fengyuanchen.github.io/vue-qrcode/ -->
<template>
  <div class="webcamCapture">
    <div
      id="captureButton"
      class="captureButton"
      @click="capture()"
      v-bind:class="{ capturing: isCapturing }"
    >Capture!</div>
  </div>
</template>

<style lang="scss">
.captureButton {
  font-size: 30px;
  cursor: pointer;
  color: #e66359;
  text-align: center;
}

#remoteVideo {
  height: 157px;
}

.capturing {
  color: grey;
  cursor: progress;
}
</style>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import * as uuid from "uuid";

@Component({})
export default class WebcamCaptureComponent extends Vue {
  @Prop(String)
  readonly deviceId!: string;
  isCapturing = false;

  mounted() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { min: 640, ideal: 1280 },
          height: { min: 480, ideal: 720 },
          deviceId: { exact: this.deviceId }
        }
      })
      .then(stream => {
        this.$store.commit("capture/attachMediaStream", stream);
      });
  }

  beforeDestroy() {
    // Removing tracks to stop using camera
    // @see: https://developers.google.com/web/updates/2015/07/mediastream-deprecations?hl=en#stop-ended-and-active
    this.$store.commit("capture/detachMediaStream");
  }

  private capture() {
    this.isCapturing = true;
    const canvas = document.createElement("canvas");
    const video = document.getElementById("videoCapture") as any;
    canvas.width = 640;
    canvas.height = 480;
    const context2d = canvas.getContext("2d") as CanvasRenderingContext2D;
    context2d.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg");

    var formData = new FormData();
    const blob = imagetoblob(base64);
    formData.append("image", blob, uuid.v4() + ".jpg");
    var request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://${location.host}/default/upload/${this.$store.state.plan.activePlan}`
    );
    const self = this;
    request.onreadystatechange = function() {
      //Appelle une fonction au changement d'état.
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const pictureId = JSON.parse(this.response)[0];
        self.isCapturing = false;
        self.$store.dispatch("plan/addNewPictureAction", pictureId);
      }
    };

    request.send(formData);
  }
}

function b64toBlob(b64Data: string, contentType: string, sliceSize?: number) {
  contentType = contentType || "";
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

function imagetoblob(base64String: string) {
  var ImageURL = base64String;
  // Split the base64 string in data and contentType
  var block = ImageURL.split(";");
  // Get the content type of the image
  var contentType = block[0].split(":")[1]; // In this case "image/gif"
  // get the real base64 content of the file
  var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

  // Convert it to a blob to upload
  return b64toBlob(realData, contentType);
}
</script>
