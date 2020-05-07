package com.bakuanimation.api;

import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;

public interface PermissionService {
    String getNewProjectId();

    Project getProject(String projectId);

    void hasRight(Project project, Movie movie, BakuEvent event);

    String sign(String projectId) throws Exception;
}
