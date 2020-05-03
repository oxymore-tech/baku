package com.bakuanimation.service;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.AuthorizationException;
import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.ForbiddenOperationException;
import com.bakuanimation.model.Movie;
import com.fasterxml.jackson.databind.JsonNode;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.inject.Singleton;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Key;
import java.util.Base64;
import java.util.List;

@Singleton
public final class PermissionServiceImpl implements PermissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PermissionServiceImpl.class);
    private static final String ENCRYPTION_ALGORITHM = "AES";
    private static final byte[] SECRET = "my-secret-passwo".getBytes();

    private final PathService pathService;
    private final Key secretKeySpec;

    public PermissionServiceImpl(PathService pathService) {
        this.pathService = pathService;
        secretKeySpec = new SecretKeySpec(SECRET, ENCRYPTION_ALGORITHM);
    }

    @Override
    public void lockMovie(String projectId, @Nullable String adminId) throws IOException {
        authorizeOperation(projectId, adminId);
        Path movieLockFile = pathService.getMovieLockFile(projectId);
        if (!Files.exists(movieLockFile)) {
            Files.createFile(movieLockFile);
        }
    }

    @Override
    public void lockShot(String projectId, String shotId, @Nullable String adminId) throws IOException {
        Path shotLockFile = pathService.getShotLockFile(projectId, shotId);
        if (!Files.exists(shotLockFile)) {
            Files.createFile(shotLockFile);
        }
    }

    @Override
    public void unlockMovie(String projectId, @Nullable String adminId) throws IOException {
        authorizeOperation(projectId, adminId);
        Files.deleteIfExists(pathService.getMovieLockFile(projectId));
    }

    @Override
    public void unlockShot(String projectId, String shotId, @Nullable String adminId) throws IOException {
        authorizeOperation(projectId, adminId);
        Files.deleteIfExists(pathService.getShotLockFile(projectId, shotId));
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

    private void authorizeOperation(String projectId, @Nullable String adminId) {
        if (adminId == null) {
            throw new AuthorizationException("Must be admin for this operation");
        }
        boolean validAdminId = validateAdminId(projectId, adminId);
        if (!validAdminId) {
            throw new AuthorizationException("invalid adminId");
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
    public String adminId(String projectId) {
        try {
            Cipher c = Cipher.getInstance(ENCRYPTION_ALGORITHM);
            c.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encVal = c.doFinal(projectId.getBytes());
            return Base64.getEncoder().encodeToString(encVal);
        } catch (Exception e) {
            LOGGER.warn("Error while generating adminId", e);
            throw new RuntimeException(e);
        }
    }

    @VisibleForTesting
    boolean validateAdminId(String projectId, String adminId) {
        try {
            Cipher c = Cipher.getInstance(ENCRYPTION_ALGORITHM);
            c.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decordedValue = Base64.getDecoder().decode(adminId);
            byte[] decValue = c.doFinal(decordedValue);
            return new String(decValue).equals(projectId);
        } catch (Exception e) {
            LOGGER.warn("Error while validating admin id", e);
            return false;
        }
    }

}
