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

@Controller
public class ImageController {

    private final HistoryService historyService;
    private final ImageService imageService;
    private final PathService pathService;

    public ImageController(HistoryService historyService, ImageService imageService, PathService pathService) {
        this.historyService = historyService;
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
    public Single<HttpResponse<StreamedFile>> export(@PathVariable String projectId) {
        return writeExportResponse(historyService.readHistory(projectId)
                .flatMap(history -> historyService.interpretHistory(projectId, history, null)));
    }

    @Get(value = "/api/{projectId}/{shotId}/export.zip")
    public Single<HttpResponse<StreamedFile>> exportShot(@PathVariable String projectId, @PathVariable String shotId) {
        return writeExportResponse(historyService.readHistory(projectId)
                .flatMap(history -> historyService.interpretHistory(projectId, history, shotId)));
    }

    private Single<HttpResponse<StreamedFile>> writeExportResponse(Single<Movie> movieSingle) {
        return movieSingle
                .map(movie -> {
                    PipedOutputStream outputStream = new PipedOutputStream();
                    InputStream inputStream = new PipedInputStream(outputStream);
                    Schedulers.io().scheduleDirect(() -> {
                        try {
                            imageService.export(movie, outputStream);
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
                    String movieName = movie.getName().isBlank() ? movie.getProjectId() : movie.getName();
                    StreamedFile streamedFile = new StreamedFile(inputStream, MediaType.MULTIPART_FORM_DATA_TYPE)
                            .attach(movieName + ".zip");
                    return HttpResponse.ok(streamedFile).header(HttpHeaderNames.CACHE_CONTROL, "no-cache");
                });
    }

}
