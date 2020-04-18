package com.bakuanimation.server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import javax.inject.Singleton;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;

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
}
