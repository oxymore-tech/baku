class Baku {
  constructor(projectId) {
    this.projectId = projectId;
  }

  upload(planId, blob, filename) {
    let currentError;
    let finished = false;
    let currentPercent = 0;
    let onErrorCallback;
    let onFinishCallback;
    let onProgressCallback;

    const progressHandling = function (event) {
      if (finished || currentError) {
        return;
      }
      if (event.lengthComputable) {
        const position = event.loaded || event.position;
        currentPercent = Math.ceil(position * 100 / event.total);
        onProgressCallback(currentPercent);
      }
    };

    const formData = new FormData();
    formData.append('file', blob, filename);

    $.ajax({
      type: 'POST',
      url: `/${this.projectId}/upload/${planId}`,
      xhr() {
        const x = $.ajaxSettings.xhr();
        if (x.upload) {
          x.upload.addEventListener('progress', progressHandling, false);
        }
        return x;
      },
      success(data) {
        if (finished || currentError) {
          return;
        }
        finished = true;
        onFinishCallback(data[0]);
        onProgressCallback = undefined;
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      error(error) {
        if (finished || currentError) {
          return;
        }
        currentError = error;
        onErrorCallback(currentError);
        onProgressCallback = undefined;
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      async: true,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      timeout: 60000, // TODO
    });

    return {
      onProgress(callback) {
        if (finished || currentError) {
          return;
        }
        callback(currentPercent);
        onProgressCallback = callback;
        return this;
      },
      onFinish(callback) {
        if (currentError) {
          return;
        }
        if (finished) {
          callback();
        } else {
          onFinishCallback = callback;
        }
        return this;
      },
      onError(callback) {
        if (currentError) {
          callback(currentError);
        } else {
          if (finished) {
            return;
          }
          onErrorCallback = callback;
        }
        return this;
      },
    };
  }

  // event: JSON
  stack(event) {
    let currentError;
    let finished = false;
    let onErrorCallback;
    let onFinishCallback;

    $.ajax({
      type: 'POST',
      url: `/${this.projectId}/stack`,
      xhr() {
        const x = $.ajaxSettings.xhr();
        return x;
      },
      success(data) {
        if (finished || currentError) {
          return;
        }
        finished = true;
        onFinishCallback();
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      error(error) {
        if (finished || currentError) {
          return;
        }
        currentError = error;
        onErrorCallback(currentError);
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      async: true,
      data: JSON.stringify(event),
      cache: false,
      contentType: 'application/json; charset=UTF-8',
      processData: false,
      timeout: 60000, // TODO
    });

    return {
      onFinish(callback) {
        if (currentError) {
          return;
        }
        if (finished) {
          callback();
        } else {
          onFinishCallback = callback;
        }
        return this;
      },
      onError(callback) {
        if (currentError) {
          callback(currentError);
        } else {
          if (finished) {
            return;
          }
          onErrorCallback = callback;
        }
        return this;
      },
    };
  }

  history() {
    let currentError;
    let finished = false;
    let onErrorCallback;
    let onFinishCallback;

    $.ajax({
      type: 'GET',
      url: `/${this.projectId}/history`,
      xhr() {
        const x = $.ajaxSettings.xhr();
        return x;
      },
      success(data) {
        if (finished || currentError) {
          return;
        }
        finished = true;
        onFinishCallback(data);
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      error(error) {
        if (finished || currentError) {
          return;
        }
        currentError = error;
        onErrorCallback(currentError);
        onFinishCallback = undefined;
        onErrorCallback = undefined;
      },
      async: true,
      cache: false,
      timeout: 60000, // TODO
    });

    return {
      onFinish(callback) {
        if (currentError) {
          return;
        }
        if (finished) {
          callback();
        } else {
          onFinishCallback = callback;
        }
        return this;
      },
      onError(callback) {
        if (currentError) {
          callback(currentError);
        } else {
          if (finished) {
            return;
          }
          onErrorCallback = callback;
        }
        return this;
      },
    };
  }
}

Baku.dataUrlToBlob = function (dataUrl) {
  const BASE64_MARKER = ';base64,';
  if (dataUrl.indexOf(BASE64_MARKER) == -1) {
    var parts = dataUrl.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = parts[1];
    return new Blob([raw], { type: contentType });
  }

  var parts = dataUrl.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
};


class BakuRun {
    onChangeCallback = undefined;

    history = undefined;

    historyAsString = undefined;

    setIntervalId = undefined;

    updating = false;

    constructor(projectId) {
      this.projectId = projectId;
      this.baku = new Baku(projectId);
    }

    update() {
      if (this.updating) {
        return;
      }
      this.updating = true;
      const that = this;
      this.baku.history().onFinish((h) => {
        that.updating = false;
        const hAsString = JSON.stringify(h);
        if (hAsString !== that.historyAsString) {
          that.historyAsString = hAsString;
          that.history = h;
          console.log('New history:');
          console.log(that.history);
          that.onChangeCallback();
        }
      }).onError((error) => {
        that.updating = false;
      });
      return this;
    }

    updateEvery(seconds) {
      if (this.setIntervalId) {
        clearInterval(this.setIntervalId);
      }
      const that = this;
      this.setIntervalId = setInterval(() => {
        that.update();
      }, Math.round(seconds * 1000));
      return this;
    }

    onChange(callback) {
      this.onChangeCallback = callback;
      return this;
    }

    images(planId) {
      const list = [];
      const thisProjectId = this.projectId;
      if (this.history) {
        $.each(this.history, (i, v) => {
          if (v && (v.event === 'upload') && ((v.plan === planId) || !v.plan)) {
            list.push({
              url(width, height) {
                return `/${thisProjectId}/images/${planId}/${v.id}?width=${width}&height=${height}`;
              },
            });
          }
          // TODO delete events
        });
      }
      return list;
    }
}

BakuRun.event = function () {
  return {
    upload(planId, imageId) {
      return {
        event: 'upload',
        plan: planId,
        id: imageId,
      };
    },
  };
};
