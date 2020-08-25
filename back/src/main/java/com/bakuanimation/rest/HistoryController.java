package com.bakuanimation.rest;

import com.bakuanimation.api.CollaborationSyncService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.PathService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Delete;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Header;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.server.types.files.SystemFile;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;

import javax.annotation.Nullable;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class HistoryController {

    private final HistoryServiceImpl historyService;
    private final PathService pathService;
    private final PermissionService permissionService;
    private final CollaborationSyncService collaborationSyncService;

    public HistoryController(HistoryServiceImpl historyService, PathService pathService,
                             PermissionService permissionService, CollaborationSyncService collaborationSyncService) {
        this.historyService = historyService;
        this.pathService = pathService;
        this.permissionService = permissionService;
        this.collaborationSyncService = collaborationSyncService;
    }

    @Get(value = "/api/movie")
    public Single<String> newProject() {
        return Single.fromCallable(permissionService::getNewProjectId)
                .subscribeOn(Schedulers.computation());
    }

    @Delete(value = "/api/{projectId}")
    public Single<Boolean> deleteProject(@PathVariable String projectId) {
        return historyService.deleteMovie(permissionService.getProject(projectId));
    }

    @Post("/api/{projectId}/stack")
    public Single<HttpResponse<Void>> stack(@PathVariable String projectId, @Body byte[] stack) {
        return historyService.addStack(permissionService.getProject(projectId), stack)
                .map(v -> HttpResponse.ok());
    }

    @Get("/api/{projectId}/history")
    public Single<HttpResponse> stack(@PathVariable String projectId, @Nullable @Header("X-SocketId") String socketId) {
        String movieId = permissionService.getProject(projectId).getId();
        if (socketId != null) {
            this.collaborationSyncService.access(socketId, movieId);
        }
        Path stackFile = pathService.getStackFile(movieId);
        return Single.fromCallable(() -> {
            if (!Files.exists(stackFile)) {
                return (HttpResponse) HttpResponse.ok("[]".getBytes());
            } else {
                return (HttpResponse) HttpResponse.ok(new SystemFile(stackFile.toFile()))
                        .header(HttpHeaderNames.CACHE_CONTROL, "no-cache");
            }
        }).subscribeOn(Schedulers.io());
    }

}
