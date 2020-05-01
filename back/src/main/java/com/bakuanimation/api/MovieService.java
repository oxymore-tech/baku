package com.bakuanimation.api;

import io.reactivex.Single;

public interface MovieService {
    // Check last modified time of movie and stack file
    // if not the same -> will generate a movie & lock in memory the generation
    // The goal is for this method to be called many time on the same project id, and the movie will only be generated once
    Single<com.bakuanimation.api.VideoState> generateMovie(String projectId);

    Single<com.bakuanimation.api.MovieStatus> status(String projectId);
}
