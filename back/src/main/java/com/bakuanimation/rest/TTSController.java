package com.bakuanimation.rest;

import com.bakuanimation.api.ImageService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.api.SoundService;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.bakuanimation.service.HistoryServiceImpl;
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
public class SoundController {

    private static final Logger LOGGER = LoggerFactory.getLogger(SoundController.class);

    private final HistoryServiceImpl historyService;
    private final SoundService soundService;
    private final PathService pathService;
    private final PermissionService permissionService;

    public SoundController(HistoryServiceImpl historyService, ImageService imageService,
                           PathService pathService, PermissionService permissionService, SoundService soundService) {
        this.historyService = historyService;
        this.soundService = soundService;
        this.pathService = pathService;
        this.permissionService = permissionService;
    }

    @Post(value = "/api/{projectId}/uploadSound", consumes = MediaType.MULTIPART_FORM_DATA)
    public Single<String> uploadSound(@PathVariable String projectId, StreamingFileUpload file) {
        File tempFile;
        try {
            tempFile = File.createTempFile(file.getFilename(), "temp");
        } catch (IOException e) {
            return Single.error(e);
        }
        Publisher<Boolean> uploadPublisher = file.transferTo(tempFile);
        return Single.fromPublisher(uploadPublisher)
                .subscribeOn(Schedulers.io())
                .map(uploadSound -> {
                    soundService.save(permissionService.getProject(projectId).getId(),new FileInputStream(tempFile),file.getFilename());
                    Files.delete(tempFile.toPath());
                    return file.getFilename();
                });

    }

    @Post(value = "/api/{projectId}/uploadExistantSound", consumes = MediaType.MULTIPART_FORM_DATA)
    public Single<String> uploadExistantSound(@PathVariable String projectId, StreamingFileUpload file) {
        File tempFile;
        try {
            tempFile = File.createTempFile(file.getFilename(), "temp");
        } catch (IOException e) {
            return Single.error(e);
        }
        Publisher<Boolean> uploadPublisher = file.transferTo(tempFile);
        return Single.fromPublisher(uploadPublisher)
                .subscribeOn(Schedulers.io())
                .map(uploadSound -> {
                    soundService.delete(permissionService.getProject(projectId).getId(),file.getFilename());
                    soundService.save(permissionService.getProject(projectId).getId(),new FileInputStream(tempFile),file.getFilename());
                    Files.delete(tempFile.toPath());
                    return file.getFilename();
                });

    }

    @Get("/api/{projectId}/sounds/{audioId}")
    public HttpResponse<Object> getSound(@PathVariable String projectId,
                                         @PathVariable String audioId) {
        var path = pathService.getSoundFile(permissionService.getProject(projectId).getId(), audioId);
        if (Files.exists(path)) {
            return HttpResponse.ok(new SystemFile(path.toFile()).attach(audioId));
        } else {
            return HttpResponse.notFound(audioId + " not found");
        }
    }


}