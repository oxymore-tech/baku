package com.bakuanimation.api;

import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;

import java.io.IOException;
import java.util.List;

public interface PermissionService {
    void lockMovie(Project project) throws IOException;

    void lockShot(Project project, String shotId) throws IOException;

    void unlockMovie(Project project) throws IOException;

    void unlockShot(Project project, String shotId) throws IOException;

    boolean isMovieLocked(String projectId);

    List<String> lockShots(String projectId) throws IOException;

    Project getProjectId(String projectId);

    void hasRight(Movie movie, BakuEvent event);

    String sign(String projectId) throws Exception;
}
