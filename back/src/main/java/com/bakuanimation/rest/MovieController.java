package com.bakuanimation.rest;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.MovieStatus;
import com.bakuanimation.model.VideoState;
import com.bakuanimation.service.HistoryServiceImpl;
import com.bakuanimation.service.MovieServiceImpl;
import com.bakuanimation.service.PathService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.http.server.types.files.SystemFile;
import io.reactivex.Single;

import java.nio.file.Files;

@Controller
public final class MovieController {

    private final PathService pathService;
    private final MovieServiceImpl movieService;
    private final HistoryServiceImpl historyService;
    private final PermissionService permissionService;

    public MovieController(PathService pathService, MovieServiceImpl movieService,
                           HistoryServiceImpl historyService, PermissionService permissionService) {
        this.pathService = pathService;
        this.movieService = movieService;
        this.historyService = historyService;
        this.permissionService = permissionService;
    }

    @Get(value = "/api/{projectId}/video/status")
    public Single<MovieStatus> status(@PathVariable String projectId) {
        return movieService.status(permissionService.getProjectId(projectId).getId());
    }

    @Post(value = "/api/{projectId}/video")
    public Single<VideoState> generateMovie(@PathVariable String projectId) {
        return movieService.generateMovie(permissionService.getProjectId(projectId).getId());
    }

    @Get(value = "/api/{projectId}/video")
    public Single<HttpResponse<Object>> download(@PathVariable String projectId) {
        String id = permissionService.getProjectId(projectId).getId();
        var moviePath = pathService.getMovieFile(id);
        if (Files.exists(moviePath)) {
            return historyService.interpretHistory(id)
                    .map(movie -> HttpResponse.ok(new SystemFile(moviePath.toFile()).attach(movie.getName()+".mp4")));
        } else {
            return Single.just(HttpResponse.notFound(id + " not found"));
        }
    }
}
