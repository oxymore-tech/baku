package com.bakuanimation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Singleton
public class PathService {

    public static final Logger LOGGER = LoggerFactory.getLogger(PathService.class);

    private final Path dataPath;

    public PathService() {
        this(Paths.get("data"));
    }

    public PathService(Path dataPath) {
        this.dataPath = dataPath;
        LOGGER.info("Data path : {}", dataPath);
    }

    private Path projectDir(String projectId) {
        return dataPath
            .resolve(projectId);
    }

    public void createDirectory(String projectId) throws IOException {
        Files.createDirectories(this.projectDir(projectId));
    }

    public Path getStackFile(String projectId) {
        return this
            .projectDir(projectId)
            .resolve("stack.json");
    }

    public Path getMovieFile(String projectId) {
        return this
            .projectDir(projectId)
            .resolve("movie.mp4");
    }

    public Path getMovieTempFile(String projectId) {
        return this
            .projectDir(projectId)
            .resolve("movie.tmp.mp4");
    }

    public Path getStackTempFile(String projectId) {
        return this
            .projectDir(projectId)
            .resolve("stack.json.tmp");
    }

    public Path getImageFile(String projectId, String imageType, String imageId) {
        return this
            .projectDir(projectId)
            .resolve("images")
            .resolve(imageType)
            .resolve(imageId);
    }

    public Path getMovieLockFile(String projectId) {
        return this.projectDir(projectId).resolve("project.lock");
    }

    public Path getShotLockFile(String projectId, String planId) {
        return this.projectDir(projectId).resolve(planId + ".lock");
    }
}
