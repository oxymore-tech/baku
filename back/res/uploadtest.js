$(function() {

	var globalExecutionList = [];
	var globalExecuting = false;
	var globaleExecuteNext = function() {
		if (globalExecutionList.length == 0) {
			globalExecuting = false;
		} else {
			var f = globalExecutionList[0];
			globalExecutionList.shift();
			f(globaleExecuteNext);
		}
	};
	var execute = function(f) {
		globalExecutionList.push(f);
		if (!globalExecuting) {
			globalExecuting = true;
			globaleExecuteNext();
		}
	};

	var BASE64_MARKER = ';base64,';
	
	var dataUrlToBlob = function(dataUrl) {
		if (dataUrl.indexOf(BASE64_MARKER) == -1) {
			var parts = dataUrl.split(',');
			var contentType = parts[0].split(':')[1];
			var raw = parts[1];
			return new Blob([raw], { type: contentType });
		}
		
		var parts = dataUrl.split(BASE64_MARKER);
		var contentType = parts[0].split(':')[1];
		var raw = window.atob(parts[1]);
		var rawLength = raw.length;
		var uInt8Array = new Uint8Array(rawLength);
		for (var i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}
		return new Blob([uInt8Array], { type: contentType });
	};
	
	var isOutOfViewport = function (e) {
		var bounding = e[0].getBoundingClientRect();
		if (bounding.bottom < 0) {
			return true;
		}
		if (bounding.top > (window.innerHeight || document.documentElement.clientHeight)) {
			return true;
		}
		if (bounding.right < 0) {
			return true;
		}
		if (bounding.left > (window.innerWidth || document.documentElement.clientWidth)) {
			return true;
		}
		return false;
	};

	var generateImage = function(image, k, total, callback) {
		var canvas = document.createElement("canvas");
		var width = image.width;
		var height = image.height;

		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0, width, height);
		
		ctx.beginPath();
		var radius = canvas.width / 10;
		var centerX = canvas.width / 2;
		var centerY = canvas.height / 2;
		ctx.arc(k * canvas.width / total, centerY, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = "green";
		ctx.fill();

		ctx.font = radius + "px Courier";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = "yellow";
		ctx.fillText(k, k * canvas.width / total, centerY);

		var r = new Image();
		r.src = canvas.toDataURL("image/jpeg");
		r.onload = function() {
			callback(r);
		};
	};

	var resizeImage = function(image, size, callback) {
		var canvas = document.createElement("canvas");
		var width = image.width;
		var height = image.height;
		if (width > height) {
			if (width > size) {
				height *= size / width;
				width = size;
			}
		} else {
			if (height > size) {
				width *= size / height;
				height = size;
			}
		}

		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0, width, height);
		
		var r = new Image();
		r.src = canvas.toDataURL("image/jpeg");
		r.onload = function() {
			callback(r);
		};
	};

	var upload = function(blob, name, callback) {
		var progressHandling = function (event) {
			if (event.lengthComputable) {
				var position = event.loaded || event.position;
				var percent = Math.ceil(position * 100 / event.total);
				console.log(percent + "%");
			}
		};
		
		var formData = new FormData();
		formData.append("file", blob, name);

		$.ajax({
			type: "POST",
			url: "me/upload",
			xhr: function () {
				var x = $.ajaxSettings.xhr();
				if (x.upload) {
					x.upload.addEventListener("progress", progressHandling, false);
				}
				return x;
			},
			success: function (data) {
				console.log("Uploaded");
				console.log(data);
				callback();
			},
			error: function (error) {
				console.log("Error");
				console.log(error);
				callback();
			},
			async: true,
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
			timeout: 60000
		});
	};

	var spread = function(total, f, endCallback) {
		for (var i = 0; i < total; i++) {
			(function() {
				var k = i;
				execute(function(cb0) {
					f(k, cb0);
				});
			})();
		}
		execute(function(cb1) {
			endCallback();
			cb1();
		});
	};
	
	var delay = function(f) {
		setTimeout(f, 0);
	};

	var callOnScroll = [];

	var imagesMemory = 0;
	var countGeneratedImages = 0;

	var action = function() {
		$(".load").hide();
		
		var total = parseInt($("#total").val());
		var snapshotSize = parseInt($("#snapshotSize").val());
		var lowSnapshotSize = parseInt($("#lowSnapshotSize").val());
		var generateEverythingBefore = $("#generateBefore").is(":checked");
		
		var divs = [];
		
		var snapshotSwapIt = function(k, snapshotSwapItCallback) {
			var img = $("#imageimg" + k);
			var div = $("#imagediv" + k);
			
			if (isOutOfViewport(div)) {
				if (img.attr("src")) {
					imagesMemory -= img.attr("src").length;
					img.stop().removeAttr("src").hide();
				}
				snapshotSwapItCallback();
			} else {
				if (!img.attr("src")) {
					img.attr("src", "me/images/" + "730acc6b-df46-49f5-91eb-745d9389fc13" + ".jpg" + "?width=" + snapshotSize + "&height=" + snapshotSize); // + k
					imagesMemory += img.attr("src").length;
					img[0].onload = function() {
						img.stop().fadeIn();
						snapshotSwapItCallback();
					};
				} else {
					snapshotSwapItCallback();
				}
			}
		};
		
		spread(total, function(k, cb0) {
			var div = $("<div>").attr("id", "imagediv" + k).addClass("image");
			$("#images").append(div);
			var imglow = $("<img>").attr("id", "imageimglow" + k).addClass("low");
			div.append(imglow);
			var img = $("<img>").attr("id", "imageimg" + k);
			div.append(img);
			var text = $("<div>").attr("id", "imagetext" + k).html("Not generated");
			div.append(text);
			cb0();

			var inViewport = true;
			callOnScroll.push(function() {
				if (text.html() === "") {
					snapshotSwapIt(k, function() {
					});
				}
			});
			
		}, function() {
		});
		
		var display = function(k, text) {
			$("#imagetext" + k).html(text);
		};
		
		var generatedImages = [];

		var prepareIt = function(k, prepareCallback) {
			display(k, "To be generated");
			prepareCallback();
		};
		
		var generateIt = function(k, image, generateCallback) {
			display(k, "Generating");
			delay(function() {
				display(k, "Generated");
				generateImage(image, k, total, function(generatedImage) {
					generatedImages.push(generatedImage);
					imagesMemory += generatedImage.src.length;
					$("#imageimg" + k).attr("src", generatedImage.src);
					generateCallback();
				});
			});
		};
	
		var uploadIt = function(k, uploadCallback) {
			display(k, "Uploading");
			var generatedImage = generatedImages[k];
			generatedImages[k] = null;
			delay(function() {
				upload(dataUrlToBlob(generatedImage.src), "noname" + k + ".jpg", function() {
					display(k, "Uploaded");
					uploadCallback(generatedImage);
				});
			});
		};

		var snapshotIt = function(k, generatedImage, snapshotCallback) {
			display(k, "Snapshoting");
			delay(function() {
				display(k, "Snapshoted");
				resizeImage(generatedImage, snapshotSize, function(snapshotImage) {
					resizeImage(snapshotImage, lowSnapshotSize, function(lowSnapshotImage) {
						countGeneratedImages++;
						imagesMemory += lowSnapshotImage.src.length;
						$("#imageimglow" + k).attr("src", lowSnapshotImage.src);
						//imagesMemory += snapshotImage.src.length;
						//$("#imageimg" + k).attr("src", snapshotImage.src);
						delay(function() {
							display(k, "");
							snapshotSwapIt(k, snapshotCallback);
						});
					});
				});
			});
		};

		var selectedFile = $("#fileinput")[0].files[0];
		if (selectedFile) {
			var reader = new FileReader();
			reader.onload = function(readerEvent) {
				var image = new Image();
				image.onload = function(imageEvent) {
					spread(total, function(k, cb0) {
						prepareIt(k, cb0);
					}, function() {
						spread(total, function(k, cb1) {
							if (generateEverythingBefore) {
								generateIt(k, image, cb1);
							} else {
								generateIt(k, image, function() {
									uploadIt(k, function(generatedImage) {
										snapshotIt(k, generatedImage, cb1);
									});
								});
							}
						}, function() {
							if (generateEverythingBefore) {
								spread(total, function(k, cb2) {
									uploadIt(k, function(generatedImage) {
										snapshotIt(k, generatedImage, cb2);
									});
								}, function() {
								});
							}
						});
					})
				};
				
				image.src = readerEvent.target.result;
			};
			reader.readAsDataURL(selectedFile);
		} else {
			spread(total, function(k, cb0) {
				prepareIt(k, function() {
					var r = new Image();
					r.src = "me/images/" + "730acc6b-df46-49f5-91eb-745d9389fc13" + ".jpg" + "?width=1000&height=1000"; // + k
					r.onload = function() {
						snapshotIt(k, r, cb0);
					};
				});
			}, function() {
			})
		}
	};

	var roundIt = function(m) {
		return Math.round(m / (1024 * 1024)) + " MiB";
	};
	var updateMemory = function() {
		$(".memory").html(countGeneratedImages + " generated|uploaded (" + roundIt(imagesMemory) + ")" + (window.performance.memory ? " " + (roundIt(window.performance.memory.usedJSHeapSize) + " / " + roundIt(window.performance.memory.totalJSHeapSize) + " / " + roundIt(window.performance.memory.jsHeapSizeLimit)) : ""));
	};
	
	setInterval(updateMemory, 1000);
	updateMemory();

	var callOnScrollIntervalId = null;
	window.onscroll = function() {
		if (callOnScrollIntervalId != null) {
			clearInterval(callOnScrollIntervalId);
			callOnScrollIntervalId = null;
		}
		callOnScrollIntervalId = setInterval(function() {
			$.each(callOnScroll, function(i, f) {
				f();
			});
		}, 10);
	};
	
	window.load = action;
});
