package com.bakuanimation.api;

import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import io.reactivex.Single;

import java.io.IOException;
import java.util.List;

public interface HistoryService {
    Single<Boolean> addStack(Project project, byte[] stack, String userId);

    void writeHistory(String projectId, List<BakuEvent> events) throws IOException;

    Single<Boolean> deleteMovie(Project project);

    Single<Movie> interpretHistory(String projectId);
}
