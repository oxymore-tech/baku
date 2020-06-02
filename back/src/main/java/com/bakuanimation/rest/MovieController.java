package com.bakuanimation.rest;

import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.MovieService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.MovieStatus;
import com.bakuanimation.model.VideoState;
import com.bakuanimation.service.PathService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.server.types.files.SystemFile;
import io.reactivex.Single;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;

@Controller
public final class MovieController {

    private static final Logger LOGGER = LoggerFactory.getLogger(MovieController.class);

    private final PathService pathService;
    private final MovieService movieService;
    private final HistoryService historyService;
    private final PermissionService permissionService;

    public MovieController(PathService pathService, MovieService movieService,
                           HistoryService historyService, PermissionService permissionService) {
        this.pathService = pathService;
        this.movieService = movieService;
        this.historyService = historyService;
        this.permissionService = permissionService;
    }

    @Get(value = "/api/{projectId}/video/status")
    public Single<MovieStatus> status(@PathVariable String projectId) {
        return movieService.status(permissionService.getProject(projectId).getId());
    }

    @Post(value = "/api/{projectId}/video")
    public Single<VideoState> generateMovie(@PathVariable String projectId) {
        return movieService.generateMovie(permissionService.getProject(projectId).getId());
    }

    @Get(value = "/api/{projectId}/video")
    public Single<HttpResponse<Object>> download(@PathVariable String projectId) {
        String id = permissionService.getProject(projectId).getId();
        var moviePath = pathService.getMovieFile(id);
        if (Files.exists(moviePath)) {
            return historyService.interpretHistory(id)
                    .map(movie -> HttpResponse.ok(new SystemFile(moviePath.toFile()).attach(movie.getName()+".mp4")));
        } else {
            return Single.just(HttpResponse.notFound(id + " not found"));
        }
    }

    @Get(value = "/api/{projectId}/{shotId}/video")
    public Single<HttpResponse<Object>> download(@PathVariable String projectId,
                                                 @PathVariable String shotId) {
        String id = permissionService.getProject(projectId).getId();
        return movieService.generatePlan(id, shotId)
                .doOnError(v -> LOGGER.warn("Error", v))
                .map(movie -> HttpResponse.ok(new SystemFile(movie.toFile()).attach(movie.getFileName().toString())));
    }
}
