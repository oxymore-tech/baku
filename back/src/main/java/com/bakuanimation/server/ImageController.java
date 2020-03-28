package com.bakuanimation.server;

import io.micronaut.core.io.Streamable;
import io.micronaut.core.io.Writable;
import io.micronaut.core.util.CollectionUtils;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.multipart.StreamingFileUpload;
import io.micronaut.http.server.types.files.StreamedFile;
import io.micronaut.http.server.types.files.SystemFile;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.reactivestreams.Publisher;

import javax.annotation.Nullable;
import java.io.*;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;

@Controller
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
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
                .subscribeOn(Schedulers.computation())
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
        var imagePath = imageService.getImage(Paths.get(projectId).resolve(quality).resolve(imageName));
        if (Files.exists(imagePath)) {
            return HttpResponse.ok(new SystemFile(imagePath.toFile()).attach(imageName));
        } else {
            return HttpResponse.notFound(imageName + "not found");
        }
    }

    @Get(value = "/api/{projectId}/export.zip")
    public Writable export(@PathVariable String projectId) {
        return new Writable() {
            @Override
            public void writeTo(Writer out) throws IOException {
                throw new IllegalArgumentException();
            }

            @Override
            public void writeTo(OutputStream outputStream, @Nullable Charset charset) throws IOException {
                imageService.export(projectId, null, outputStream);
            }
        };
    }

    @Get(value = "/api/{projectId}/{shotId}/export.zip")
    public Writable exportShot(@PathVariable String projectId, @PathVariable String shotId) {
        return new Writable() {
            @Override
            public void writeTo(Writer out) throws IOException {
                throw new IllegalArgumentException();
            }

            @Override
            public void writeTo(OutputStream outputStream, @Nullable Charset charset) throws IOException {
                imageService.export(projectId, shotId, outputStream);
            }
        };
    }

}
