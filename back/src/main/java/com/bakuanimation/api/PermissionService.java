package com.bakuanimation.api;

import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;

import javax.annotation.Nullable;
import java.io.IOException;
import java.util.List;

public interface PermissionService {
    void lockMovie(String projectId, @Nullable String adminId) throws IOException;

    void lockShot(String projectId, String shotId, @Nullable String adminId) throws IOException;

    void unlockMovie(String projectId, @Nullable String adminId) throws IOException;

    void unlockShot(String projectId, String shotId, @Nullable String adminId) throws IOException;

    boolean isMovieLocked(String projectId);

    List<String> lockShots(String projectId) throws IOException;

    void hasRight(Movie movie, BakuEvent event);

    String adminId(String projectId) throws Exception;
}
