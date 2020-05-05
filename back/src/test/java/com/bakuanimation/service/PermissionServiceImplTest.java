package com.bakuanimation.service;

import com.bakuanimation.model.Project;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionServiceImplTest {

    private PermissionServiceImpl tested;

    @BeforeEach
    void setUp(@TempDir Path sharedTempDir) {
        tested = new PermissionServiceImpl(new PathService(sharedTempDir));
    }

    @Test
    void shouldEncryptAndValidate() throws Exception {
        String projectId = "5d204046-53a6-42c6-b4ef-9a94d5169c1f";
        String adminId = tested.sign(projectId);
        assertThat(tested.verify(projectId, adminId)).isTrue();
    }

    @Test
    void shouldGetNewProjectid() {
        String projectId = tested.getNewProjectId();
        Project project = tested.getProject(projectId);
        assertThat(project.getAdminId()).isEqualTo(tested.sign(project.getId()));
        assertThat(UUID.fromString(project.getId())).isNotNull();
    }
}