package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.Movie;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.ImageServiceImpl;
import com.bakuanimation.service.PathService;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import java.io.*;
import java.nio.file.Files;

@Controller
public class ImageController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ImageController.class);

    private final HistoryServiceImpl historyService;
    private final ImageServiceImpl imageService;
    private final PathService pathService;
    private final PermissionService permissionService;

    public ImageController(HistoryServiceImpl historyService, ImageServiceImpl imageService,
                           PathService pathService, PermissionService permissionService) {
        this.historyService = historyService;
        this.imageService = imageService;
        this.pathService = pathService;
        this.permissionService = permissionService;
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
                    imageService.writeSmallerImages(permissionService.getProject(projectId).getId(), new FileInputStream(tempFile), file.getFilename());
                    Files.delete(tempFile.toPath());
                    return file.getFilename();
                });

    }

    @Get("/images/{projectId}/{quality}/{imageName}")
    public HttpResponse<Object> getImage(@PathVariable String projectId,
                                         @PathVariable String quality,
                                         @PathVariable String imageName) {
        var imagePath = pathService.getImageFile(permissionService.getProject(projectId).getId(), quality, imageName);
        if (Files.exists(imagePath)) {
            return HttpResponse.ok(new SystemFile(imagePath.toFile()).attach(imageName));
        } else {
            return HttpResponse.notFound(imageName + " not found");
        }
    }

    @Get(value = "/api/{projectId}/export.zip")
    public Single<HttpResponse<StreamedFile>> export(@PathVariable String projectId) {
        return historyService.interpretHistory(permissionService.getProject(projectId).getId())
                .map(movie -> {
                    String movieName = movie.getName().isBlank() ? movie.getProjectId() : movie.getName();
                    return writeExportResponse(movie, movieName, null);
                });
    }

    @Get(value = "/api/{projectId}/{shotId}/export.zip")
    public Single<HttpResponse<StreamedFile>> exportShot(@PathVariable String projectId, @PathVariable String shotId) {
        return historyService.interpretHistory(permissionService.getProject(projectId).getId())
                .map(movie -> {
                    int shotIndex = movie.getShots().indexOf(shotId);
                    if (shotIndex == -1) {
                        return HttpResponse.badRequest();
                    } else {
                        String movieName = movie.getName().isBlank() ? movie.getProjectId() : movie.getName();
                        movieName = movieName + "_" +(shotIndex+1);
                        return writeExportResponse(movie, movieName, shotId);
                    }
                });
    }

    private HttpResponse<StreamedFile> writeExportResponse(Movie movie, String name, @Nullable String shotId) throws IOException {
        PipedOutputStream outputStream = new PipedOutputStream();
        InputStream inputStream = new PipedInputStream(outputStream);
        Schedulers.io().scheduleDirect(() -> {
            try {
                imageService.export(movie, outputStream, shotId);
            } catch (IOException e) {
                LOGGER.warn("Error while exporting {}", movie.getProjectId(), e);
                throw new RuntimeException(e);
            } finally {
                try {
                    outputStream.flush();
                    outputStream.close();
                } catch (IOException e) {
                    LOGGER.warn("Error while closing {}", movie.getProjectId(), e);
                    e.printStackTrace();
                }
            }
        });
        StreamedFile streamedFile = new StreamedFile(inputStream, MediaType.MULTIPART_FORM_DATA_TYPE)
                .attach(name + ".zip");
        return HttpResponse.ok(streamedFile).header(HttpHeaderNames.CACHE_CONTROL, "no-cache");
    }

}
