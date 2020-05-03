package com.bakuanimation.api;

import com.bakuanimation.model.Movie;
import io.reactivex.Single;

public interface HistoryService {
    Single<Boolean> addStack(String projectId, byte[] stack);

    Single<Movie> interpretHistory(String projectId);
}
