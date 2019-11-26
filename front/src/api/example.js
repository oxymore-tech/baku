
$(() => {
  const projectId = 'project_id';
  const planId = 'plan_id';

  const imagesDiv = $('#images');
  var bakuRun = new BakuRun(projectId).onChange(() => {
    imagesDiv.empty();
    $.each(bakuRun.images(planId), (i, v) => {
      imagesDiv.append($('<img>').attr('src', v.url(300, 300)));
    });
  }).update().updateEvery(2);

  const baku = new Baku(projectId);
  window.upload = function () {
    const selectedFile = $('#fileinput')[0].files[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = function (readerEvent) {
        const image = new Image();
        image.onload = function (imageEvent) {
          baku.upload(planId, Baku.dataUrlToBlob(image.src), selectedFile.name).onProgress((percent) => {
            console.log(`${percent}%`);
          }).onFinish((imageId) => {
            console.log(`Finished: ${imageId}`);
            baku.stack(BakuRun.event().upload(planId, imageId)).onFinish(() => {
              console.log('Finished');
              baku.history().onFinish((h) => {
                console.log('Finished');
                console.log(JSON.stringify(h));
              }).onError((error) => {
                console.log(`Error:${error}`);
              });
            }).onError((error) => {
              console.log(`Error:${error}`);
            });
          }).onError((error) => {
            console.log(`Error:${error}`);
          });
        };
        image.src = readerEvent.target.result;
      };
      reader.readAsDataURL(selectedFile);
    }
  };
});
