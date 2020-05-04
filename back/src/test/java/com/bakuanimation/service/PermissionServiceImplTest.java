package com.bakuanimation.service;

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
        System.out.println(adminId);
        assertThat(tested.verify(projectId, adminId)).isTrue();
    }

    @Test
    void name() {
        System.out.println(UUID.randomUUID());
    }
}