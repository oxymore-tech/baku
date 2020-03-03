package com.bakuanimation.server;

import com.google.common.reflect.TypeToken;
import com.liveaction.reactiff.api.server.HttpMethod;
import com.liveaction.reactiff.api.server.ReactiveHandler;
import com.liveaction.reactiff.api.server.Result;
import com.liveaction.reactiff.api.server.annotation.PathParam;
import com.liveaction.reactiff.api.server.annotation.RequestBody;
import com.liveaction.reactiff.api.server.annotation.RequestMapping;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.file.Files;
import java.nio.file.Path;

public final class HistoryController implements ReactiveHandler {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @RequestMapping(method = HttpMethod.POST, path = "/api/{projectId}/stack")
    public Mono<Void> stack(@PathParam(value = "projectId") String projectId, @RequestBody Mono<byte[]> body) {
        return body
                .publishOn(Schedulers.elastic())
                .doOnNext(stack -> historyService.addStack(projectId, stack))
                .then();
    }


    @RequestMapping(method = HttpMethod.GET, path = "/api/{projectId}/history")
    public Mono<byte[]> stack(@PathParam(value = "projectId") String projectId) {
        Path imagePath = historyService.stackFile(projectId);
        return Mono.fromCallable(() -> {
            if (!Files.exists(imagePath)) {
                return "[]".getBytes();
            } else {
                return Files.readAllBytes(imagePath);
            }
        }).subscribeOn(Schedulers.elastic());
    }

//    @RequestMapping(method = HttpMethod.GET, path = "/api/{projectId}/history")
//    public Mono<Result> stack(@PathParam(value = "projectId") String projectId) {
//        Path imagePath = historyService.stackFile(projectId);
//        return Mono.fromCallable(() -> {
//            if (!Files.exists(imagePath)) {
//                return (Result) Result.ok(Mono.just("[]".getBytes()), new TypeToken<byte[]>() {
//                });
//            } else {
//                return (Result) Result.ok(Mono.just(imagePath), Path.class);
//            }
//        }).subscribeOn(Schedulers.elastic());
//    }
}
