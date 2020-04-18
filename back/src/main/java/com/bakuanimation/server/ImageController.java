package com.bakuanimation.server;

import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.multipart.StreamingFileUpload;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.http.server.types.files.SystemFile;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.reactivestreams.Publisher;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;

@Controller
public class ImageController {

    private final ImageService imageService;
    private final PathService pathService;

    public ImageController(ImageService imageService, PathService pathService) {
        this.imageService = imageService;
        this.pathService = pathService;
    }

    @Post(value = "/api/{projectId}/upload", consumes = MediaType.MULTIPART_FORM_DATA)
    public Single<String> upload(@PathVariable String projectId, StreamingFileUpload file) {
        File tempFile;
        try {
            tempFile = File.createTempFile(file.getFilename(), "temp");
        } catch (IOException e) {
            return Single.error(e);
        }
        Publisher<Boolean> uploadPublisher = file.transferTo(tempFile);
        return Single.fromPublisher(uploadPublisher)
                .subscribeOn(Schedulers.io())
                .map(upload -> {
                    imageService.writeSmallerImages(projectId, new FileInputStream(tempFile), file.getFilename());
                    Files.delete(tempFile.toPath());
                    return file.getFilename();
                });

    }

    @Get("/images/{projectId}/{quality}/{imageName}")
    public HttpResponse<Object> getImage(@PathVariable String projectId,
                                         @PathVariable String quality,
                                         @PathVariable String imageName) {
        var imagePath = pathService.getImageFile(projectId, quality, imageName);
        if (Files.exists(imagePath)) {
            return HttpResponse.ok(new SystemFile(imagePath.toFile()).attach(imageName));
        } else {
            return HttpResponse.notFound(imageName + "not found");
        }
    }

    @Get(value = "/api/{projectId}/export.zip")
    public HttpResponse<StreamedFile> export(@PathVariable String projectId) throws IOException {
        PipedOutputStream outputStream = new PipedOutputStream();
        InputStream inputStream = new PipedInputStream(outputStream);
        Schedulers.io().scheduleDirect(() -> {
            try {
                imageService.export(projectId, null, outputStream);
            } catch (IOException e) {
                throw new RuntimeException(e);
            } finally {
                try {
                    outputStream.flush();
                    outputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
        StreamedFile streamedFile = new StreamedFile(inputStream, MediaType.MULTIPART_FORM_DATA_TYPE)
                .attach(projectId + ".zip");
        return HttpResponse.ok(streamedFile).header(HttpHeaderNames.CACHE_CONTROL, "no-cache");

    }

    @Get(value = "/api/{projectId}/{shotId}/export.zip")
    public HttpResponse<StreamedFile> exportShot(@PathVariable String projectId, @PathVariable String shotId) throws IOException {
        PipedOutputStream outputStream = new PipedOutputStream();
        InputStream inputStream = new PipedInputStream(outputStream);
        Schedulers.io().scheduleDirect(() -> {
            try {
                imageService.export(projectId, shotId, outputStream);
            } catch (IOException e) {
                throw new RuntimeException(e);
            } finally {
                try {
                    outputStream.flush();
                    outputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
        StreamedFile streamedFile = new StreamedFile(inputStream, MediaType.MULTIPART_FORM_DATA_TYPE)
                .attach(projectId + ".zip");
        return HttpResponse.ok(streamedFile).header(HttpHeaderNames.CACHE_CONTROL, "no-cache");
    }

}
