package com.bakuanimation.server;

import io.micronaut.core.util.ArrayUtils;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.reactivex.Flowable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

@Controller
public class HistoryController {

    private final HistoryService historyService;
    private final PathService pathService;

    public HistoryController(HistoryService historyService, PathService pathService) {
        this.historyService = historyService;
        this.pathService = pathService;
    }

    @Post("/api/{projectId}/stack")
    public Single<HttpResponse<Void>> stack(@PathVariable String projectId, @Body byte[] stack) {
        return historyService.addStack(projectId, stack)
                .map(v -> HttpResponse.ok());
    }

    @Get("/api/{projectId}/history")
    public Single<byte[]> stack(@PathVariable String projectId) {
        Path imagePath = pathService.getStackFile(projectId);
        return Single.fromCallable(() -> {
            if (!Files.exists(imagePath)) {
                return "[]".getBytes();
            } else {
                return Files.readAllBytes(imagePath);
            }
        }).subscribeOn(Schedulers.io());
    }

}
