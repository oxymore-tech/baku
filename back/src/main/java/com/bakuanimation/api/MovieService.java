package com.bakuanimation.api;

import com.bakuanimation.model.MovieStatus;
import com.bakuanimation.model.VideoState;
import io.micronaut.http.server.types.files.SystemFile;
import io.reactivex.Single;

public interface MovieService {
    // Check last modified time of movie and stack file
    // if not the same -> will generate a movie & lock in memory the generation
    // The goal is for this method to be called many time on the same project id, and the movie will only be generated once
    Single<VideoState> generateMovie(String projectId);

    Single<SystemFile> generateShot(String projectId, String shotId);

    Single<MovieStatus> status(String projectId);
}
