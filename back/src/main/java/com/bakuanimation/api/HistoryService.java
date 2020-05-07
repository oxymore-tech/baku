package com.bakuanimation.api;

import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import io.reactivex.Single;

public interface HistoryService {
    Single<Boolean> addStack(Project project, byte[] stack);

    Single<Movie> interpretHistory(String projectId);
}
