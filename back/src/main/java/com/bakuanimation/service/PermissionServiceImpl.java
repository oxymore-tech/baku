package com.bakuanimation.service;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.annotations.VisibleForTesting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.util.Base64;
import java.util.UUID;

import static com.bakuanimation.model.BakuAction.*;

@Singleton
public final class PermissionServiceImpl implements PermissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PermissionServiceImpl.class);

    private void authorizeOperation(Project project) {
        if (project.getAdminId() == null) {
            throw new AuthorizationException("Must be admin for this operation");
        }
        boolean validAdminId = verify(project.getId(), project.getAdminId());
        if (!validAdminId) {
            throw new AuthorizationException("invalid adminId");
        }
    }

    @Override
    public String getNewProjectId() {
        String movieId = UUID.randomUUID().toString();
        String adminId = sign(movieId);
        return movieId + "-" + adminId;
    }

    @Override
    public Project getProject(String projectId) {
        // UUID size is 36
        if (projectId.length() <= 36) {
            return new Project(projectId);
        } else {
            return new Project(projectId.substring(0, 36), projectId.substring(37));
        }
    }

    @Override
    public void hasRight(Project project, Movie movie, BakuEvent event) {
        BakuAction bakuAction = BakuAction.action(event.getAction());
        // The action needing right check are MOVIE_LOCK & SHOT_LOCK
        if (bakuAction == MOVIE_LOCK || bakuAction == SHOT_LOCK) {
            // To lock & unlock movie, unlock shot, we need the rights
            if (bakuAction == MOVIE_LOCK || !event.getValue().get("locked").asBoolean()) {
                authorizeOperation(project);
            }
        } else {
            if (movie.isLocked()) {
                throw new ForbiddenOperationException("Movie is locked");
            }
            JsonNode shotId = event.getValue().get("shotId");
            if (shotId != null) {
                String shot = shotId.asText();
                if (movie.getLockedShots().contains(shot)) {
                    throw new ForbiddenOperationException("Shot " + shot + " is locked");
                }
            }
        }
    }

    @Override
    public String sign(String projectId) {
        int value = projectId.hashCode();
        byte[] bytes = {
                (byte) (value >>> 24),
                (byte) (value >>> 16),
                (byte) (value >>> 8),
                (byte) value};
            return Base64.getEncoder().encodeToString(bytes);
    }

    @VisibleForTesting
    boolean verify(String projectId, String adminId) {
        return sign(projectId).equals(adminId);
    }

}
