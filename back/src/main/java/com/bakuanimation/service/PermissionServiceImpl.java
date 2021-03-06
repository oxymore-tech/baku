package com.bakuanimation.service;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.annotations.VisibleForTesting;
import io.micronaut.context.annotation.Value;
import io.micronaut.scheduling.annotation.Scheduled;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.inject.Singleton;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;

import static com.bakuanimation.model.BakuAction.*;

@Singleton
public final class PermissionServiceImpl implements PermissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PermissionServiceImpl.class);
    private static final String ENCRYPTION_ALGORITHM = "AES";

    private final PathService pathService;
    private final Duration timeBeforeDeletion = Duration.ofDays(7);

    private final Key secretKeySpec;

    public PermissionServiceImpl(PathService pathService,
                                 @Value("${application.secret.admin}") String adminSecret) {
        this.pathService = pathService;
        secretKeySpec = new SecretKeySpec(adminSecret.getBytes(), ENCRYPTION_ALGORITHM);
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

    @Scheduled(fixedDelay = "10m")
    void deleteOldMovies() {
        Instant limit = Instant.now().minus(timeBeforeDeletion);
        LOGGER.debug("Will delete all marked to delete project older than {}", limit);
        try {
            for (Path projectPath : pathService.toDeleteProject()) {
                Instant lastModifiedDate = Files.getLastModifiedTime(projectPath).toInstant();
                LOGGER.debug("last modified time of {} -> {}", projectPath, lastModifiedDate);
                if (lastModifiedDate.isBefore(limit)) {
                    LOGGER.info("Will delete {}", projectPath);
                    FileUtils.deleteDirectory(projectPath.toFile());
                }
            }
        } catch (Exception e) {
            LOGGER.warn("Error while trying to delete old projects", e);
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
            // Any operation that is not lock or unlock is forbidden when the movie is locked (including deleting a movie)
            if (movie.isLocked()) {
                throw new ForbiddenOperationException("Movie is locked");
            }
            if (bakuAction == DELETE_MOVIE) {
                authorizeOperation(project);
            } else {
                JsonNode shotId = event.getValue().get("shotId");
                if (shotId != null) {
                    String shot = shotId.asText();
                    if (movie.getLockedShots().contains(shot)) {
                        throw new ForbiddenOperationException("Shot " + shot + " is locked");
                    }
                }
            }
        }
    }

    @Override
    public String sign(String projectId) {
        try {
            Cipher c = Cipher.getInstance(ENCRYPTION_ALGORITHM);
            c.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encVal = DigestUtils.getMd5Digest().digest(c.doFinal(projectId.getBytes()));
            return Base64.getUrlEncoder().encodeToString(Arrays.copyOfRange(encVal, 0, 6));
        } catch (Exception e) {
            LOGGER.warn("Error while generating adminId", e);
            throw new RuntimeException(e);
        }
    }

    @VisibleForTesting
    boolean verify(String projectId, String adminId) {
        return sign(projectId).equals(adminId);
    }

}
