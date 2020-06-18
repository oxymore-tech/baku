package com.bakuanimation.service;

import com.bakuanimation.model.Movie;
import com.google.common.collect.ImmutableListMultimap;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;

class ImageServiceImplTest {

    private ImageServiceImpl tested;
    private Path tempDir;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        this.tempDir = tempDir;
        PathService pathService = new PathService(this.tempDir);
        PermissionServiceImpl permissionService = new PermissionServiceImpl(pathService, "abcdefghijklmnopqrstuvwxyz123456");
        tested = new ImageServiceImpl(pathService, new HistoryServiceImpl(pathService, permissionService), permissionService);
    }

    @Test
    void shouldEstimateExportSize() throws IOException {
        String projectId = "test-project";
        Path projectPath = tempDir.resolve(projectId);
        Files.createDirectory(projectPath);
        String plan = "1";
        Path file1 = Files.writeString(projectPath.resolve("1"), "tesiqozhvnofzvqhufZGHZGt1");
        Path file2 = Files.writeString(projectPath.resolve("2"), "testagagvaaeattvjhqjetjh2");
        Movie movie = new Movie(projectId, "", "", 12, false, Set.of(), List.of(plan),
                ImmutableListMultimap.of(plan, file1, plan, file2));
        Path zipFile = tempDir.resolve("export.zip");
        long expectedSize = tested.estimatedExportSize(movie, null);
        try (OutputStream os = new FileOutputStream(zipFile.toFile())) {
            tested.export(movie, os, null);
        }
        long actualSize = Files.size(zipFile);

        double diff = (Math.abs(expectedSize - actualSize) / (double) actualSize) * 100;
        Assertions.assertThat(diff).isEqualTo(0);
    }
}