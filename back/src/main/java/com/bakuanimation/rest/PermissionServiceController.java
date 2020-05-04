package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;

import java.util.List;

@Controller
public final class PermissionServiceController {

    private final PermissionService permissionService;

    public PermissionServiceController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Post("/api/{projectId}/lock")
    public Single<HttpResponse<Void>> createMovieLock(@PathVariable String projectId) {
        return Single.fromCallable(() -> {
            permissionService.lockMovie(permissionService.getProjectId(projectId));
            return true;
        }).subscribeOn(Schedulers.io())
                .map(v -> HttpResponse.ok());
    }

    @Post("/api/{projectId}/{shotId}/lock")
    public Single<HttpResponse<Void>> createShotLock(@PathVariable String projectId,
                                                @PathVariable String shotId) {
        return Single.fromCallable(() -> {
            permissionService.lockShot(permissionService.getProjectId(projectId), shotId);
            return true;
        }).subscribeOn(Schedulers.io())
                .map(v -> HttpResponse.ok());
    }

    @Delete("/api/{projectId}/lock")
    public Single<HttpResponse<Void>> deleteMovieLock(@PathVariable String projectId) {
        return Single.fromCallable(() -> {
            permissionService.unlockMovie(permissionService.getProjectId(projectId));
            return true;
        }).subscribeOn(Schedulers.io())
                .map(v -> HttpResponse.ok());
    }

    @Delete("/api/{projectId}/{shotId}/lock")
    public Single<HttpResponse<Void>> deleteShotLock(@PathVariable String projectId,
                                                @PathVariable String shotId) {
        return Single.fromCallable(() -> {
            permissionService.unlockShot(permissionService.getProjectId(projectId), shotId);
            return true;
        }).subscribeOn(Schedulers.io())
                .map(v -> HttpResponse.ok());
    }

    @Get("/api/{projectId}/lock")
    public Single<Boolean> getMovieLock(@PathVariable String projectId) {
        return Single.fromCallable(() -> permissionService.isMovieLocked(projectId))
                .subscribeOn(Schedulers.io());
    }

    @Get("/api/{projectId}/lock/shots")
    public Single<List<String>> getShotLock(@PathVariable String projectId) {
        return Single.fromCallable(() -> permissionService.lockShots(projectId))
                .subscribeOn(Schedulers.io());
    }

}
