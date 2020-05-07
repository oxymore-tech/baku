package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.PathService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;

import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class HistoryController {

    private final HistoryServiceImpl historyService;
    private final PathService pathService;
    private final PermissionService permissionService;

    public HistoryController(HistoryServiceImpl historyService, PathService pathService, PermissionService permissionService) {
        this.historyService = historyService;
        this.pathService = pathService;
        this.permissionService = permissionService;
    }

    @Get(value = "/api/movie")
    public Single<String> newProject() {
        return Single.fromCallable(permissionService::getNewProjectId)
                .subscribeOn(Schedulers.computation());
    }

    @Post("/api/{projectId}/stack")
    public Single<HttpResponse<Void>> stack(@PathVariable String projectId, @Body byte[] stack) {
        return historyService.addStack(permissionService.getProject(projectId), stack)
                .map(v -> HttpResponse.ok());
    }

    @Get("/api/{projectId}/history")
    public Single<byte[]> stack(@PathVariable String projectId) {
        Path imagePath = pathService.getStackFile(permissionService.getProject(projectId).getId());
        return Single.fromCallable(() -> {
            if (!Files.exists(imagePath)) {
                return "[]".getBytes();
            } else {
                return Files.readAllBytes(imagePath);
            }
        }).subscribeOn(Schedulers.io());
    }

}
