package com.bakuanimation.rest;

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

    public MovieController(PathService pathService, MovieServiceImpl movieService, HistoryServiceImpl historyService) {
        this.pathService = pathService;
        this.movieService = movieService;
        this.historyService = historyService;
    }

    @Get(value = "/api/{projectId}/video/status")
    public Single<MovieStatus> status(@PathVariable String projectId) {
        return movieService.status(projectId);
    }

    @Post(value = "/api/{projectId}/video")
    public Single<VideoState> generateMovie(@PathVariable String projectId) {
        return movieService.generateMovie(projectId);
    }

    @Get(value = "/api/{projectId}/video")
    public Single<HttpResponse<Object>> download(@PathVariable String projectId) {
        var moviePath = pathService.getMovieFile(projectId);
        if (Files.exists(moviePath)) {
            return historyService.interpretHistory(projectId)
                    .map(movie -> HttpResponse.ok(new SystemFile(moviePath.toFile()).attach(movie.getName()+".mp4")));
        } else {
            return Single.just(HttpResponse.notFound(projectId + " not found"));
        }
    }
}
