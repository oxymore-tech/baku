
$(function() {
    var projectId = "project_id";
    var planId = "plan_id";

    var imagesDiv = $("#images");
    var bakuRun = new BakuRun(projectId).onChange(function() {
        imagesDiv.empty();
        $.each(bakuRun.images(planId), function(i, v) {
            imagesDiv.append($("<img>").attr("src", v.url(300, 300)));
        });
    }).update().updateEvery(2);

    var baku = new Baku(projectId);
    window.upload = function() {
        var selectedFile = $("#fileinput")[0].files[0];
        if (selectedFile) {
            var reader = new FileReader();
            reader.onload = function(readerEvent) {
                var image = new Image();
                image.onload = function(imageEvent) {
                    baku.upload(planId, Baku.dataUrlToBlob(image.src), selectedFile.name).onProgress(function(percent) {
                        console.log(percent + "%");
                    }).onFinish(function(imageId) {
                        console.log("Finished: " + imageId);
                        baku.stack(BakuRun.event().upload(planId, imageId)).onFinish(function() {
                            console.log("Finished");
                            baku.history().onFinish(function(h) {
                                console.log("Finished");
                                console.log(JSON.stringify(h));
                            }).onError(function(error) {
                                console.log("Error:" + error);
                            });
                        }).onError(function(error) {
                            console.log("Error:" + error);
                        });
                    }).onError(function(error) {
                        console.log("Error:" + error);
                    });
                };
                image.src = readerEvent.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    };
});
