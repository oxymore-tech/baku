package com.bakuanimation.rest;

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

    public HistoryController(HistoryServiceImpl historyService, PathService pathService) {
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
