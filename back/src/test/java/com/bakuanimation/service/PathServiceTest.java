package com.bakuanimation.service;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

class PathServiceTest {

    private PathService tested;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        tested = new PathService(tempDir);
    }

    @Test
    void shouldListAllToDeleteProjects() throws IOException {
        String projectId = "project-id";
        Files.createDirectories(tested.deletePath(projectId));
        Files.createDirectories(tested.projectDir(projectId));
        Assertions.assertThat(tested.toDeleteProject())
                .extracting(path -> path.getFileName().toString())
                .containsOnly("delete_"+projectId);
    }
}