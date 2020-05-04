package com.bakuanimation.service;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;

@Singleton
public final class PermissionServiceImpl implements PermissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PermissionServiceImpl.class);

    private final PathService pathService;

    public PermissionServiceImpl(PathService pathService) {
        this.pathService = pathService;
    }

    @Override
    public void lockMovie(Project project) throws IOException {
        authorizeOperation(project);
        Path movieLockFile = pathService.getMovieLockFile(project.getId());
        if (!Files.exists(movieLockFile)) {
            Files.createFile(movieLockFile);
        }
    }

    @Override
    public void lockShot(Project project, String shotId) throws IOException {
        Path shotLockFile = pathService.getShotLockFile(project.getId(), shotId);
        if (!Files.exists(shotLockFile)) {
            Files.createFile(shotLockFile);
        }
    }

    @Override
    public void unlockMovie(Project project) throws IOException {
        authorizeOperation(project);
        Files.deleteIfExists(pathService.getMovieLockFile(project.getId()));
    }

    @Override
    public void unlockShot(Project project, String shotId) throws IOException {
        authorizeOperation(project);
        Files.deleteIfExists(pathService.getShotLockFile(project.getId(), shotId));
    }

    @Override
    public boolean isMovieLocked(String projectId) {
        return Files.exists(pathService.getMovieLockFile(projectId));
    }

    private boolean isShotLocked(String projectId, String shotId) {
        return Files.exists(pathService.getShotLockFile(projectId, shotId));
    }

    @Override
    public List<String> lockShots(String projectId) throws IOException {
        Path movieLockFile = pathService.getMovieLockFile(projectId);
        return Files.list(movieLockFile.getParent())
                .filter(p -> p.getFileName().toString().endsWith(".lock") && !p.equals(movieLockFile))
                .map(p -> p.getFileName().toString())
                .collect(ImmutableList.toImmutableList());
    }

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
    public Project getProjectId(String projectId) {
        // UUID size is 32
        if (projectId.length() <= 32) {
            return new Project(projectId);
        } else {
            return new Project(projectId.substring(0, 32), projectId.substring(33));
        }
    }

    @Override
    public void hasRight(Movie movie, BakuEvent event) {
        if (isMovieLocked(movie.getProjectId())) {
            throw new ForbiddenOperationException("Movie is locked");
        }
        JsonNode shotId = event.getValue().get("shotId");
        if (shotId != null) {
            String shot = shotId.asText();
            if (isShotLocked(movie.getProjectId(), shot)) {
                throw new ForbiddenOperationException("Shot " + shot + " is locked");
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
