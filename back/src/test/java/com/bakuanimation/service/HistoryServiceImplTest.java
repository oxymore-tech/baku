package com.bakuanimation.service;

import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.google.api.client.util.Lists;
import com.google.common.collect.ImmutableList;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class HistoryServiceImplTest {

    private HistoryServiceImpl tested;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp(@TempDir Path sharedTempDir) {
        PermissionService permissionService = mock(PermissionService.class);
        tested = new HistoryServiceImpl(new PathService(sharedTempDir), permissionService, new MockCollaborationSyncService());
    }

    @Test
    void shouldWriteAndReadHistory() throws IOException {
        String projectId = "my-project";
        List<BakuEvent> content = Lists.newArrayList();
        for (int i = 0; i < 10; i++) {
            content.add(new BakuEvent(0, JsonNodeFactory.instance.numberNode(10), "user", "Instant.EPOCH"));
        }

        tested.writeHistory(projectId, content);
        List<BakuEvent> actual = tested.readHistory(projectId);
        assertThat(actual).isEqualTo(content);
    }

    @Test
    void shouldAddAnImagesInWrongOrder() {
        String projectId = "my-project";
        Project project = new Project(projectId);
        String shotId = "87740160-181f-4965-b66c-ac6c71cacc48";

        tested.addStack(project, addShotStack(shotId)).blockingGet();
        tested.addStack(project, addImageStack(shotId, 0)).blockingGet();
        tested.addStack(project, addImageStack(shotId, 2)).blockingGet();
        tested.addStack(project, addImageStack(shotId, 1)).blockingGet();

        Movie movie = tested.interpretHistory(projectId).blockingGet();

        assertThat(movie.getImages().get(shotId))
                .extracting(p -> Integer.parseInt(p.getFileName().toString()))
                .containsExactly(0, 1, 2);
    }

    @Test
    void shouldAddAnImagesWithMissingIndex() {
        String projectId = "my-project";
        Project project = new Project(projectId);
        String shotId = "87740160-181f-4965-b66c-ac6c71cacc48";

        tested.addStack(project, addShotStack(shotId)).blockingGet();
        tested.addStack(project, addImageStack(shotId, 0)).blockingGet();
        tested.addStack(project, addImageStack(shotId, 2)).blockingGet();

        Movie movie = tested.interpretHistory(projectId).blockingGet();

        assertThat(movie.getImages().get(shotId))
                .extracting(p -> Integer.parseInt(p.getFileName().toString()))
                .containsExactly(0, 2);
    }

    private byte[] addImageStack(String shotId, int imageIndex) {
        return ("{\n" +
                "    \"action\": 3,\n" +
                "    \"value\": {\n" +
                "      \"shotId\": \"" + shotId + "\",\n" +
                "      \"imageIndex\": " + imageIndex + ",\n" +
                "      \"image\": \"" + imageIndex + "\"\n" +
                "    },\n" +
                "    \"user\": \"Yōko\",\n" +
                "    \"timestamp\": \"2020-04-20T13:06:40.047Z\"\n" +
                "  }").getBytes();
    }

    private byte[] addShotStack(String shotId) {
        return ("{\n" +
                "    \"action\": 4,\n" +
                "    \"value\": {\n" +
                "      \"shotId\": \"" + shotId + "\"\n" +
                "    },\n" +
                "    \"user\": \"Yōko\",\n" +
                "    \"timestamp\": \"2020-04-20T13:05:04.500Z\"\n" +
                "  }").getBytes();
    }

    @Test
    void shouldAddStack() throws IOException {
        String projectId = "my-project";
        Project project = new Project(projectId);
        List<BakuEvent> content = Lists.newArrayList();
        for (int i = 0; i < 10; i++) {
            content.add(new BakuEvent(0, JsonNodeFactory.instance.numberNode(10), "user", "Instant.EPOCH"));
        }
        tested.writeHistory(projectId, content);
        BakuEvent toAdd = new BakuEvent(0, JsonNodeFactory.instance.numberNode(11), "user", "Instant.EPOCH");
        tested.addStack(project, objectMapper.valueToTree(toAdd).toString().getBytes()).blockingGet();
        List<BakuEvent> actual = tested.readHistory(projectId);
        content.add(toAdd);
        assertThat(actual).isEqualTo(content);
    }

    @Test
    void shouldAddStackArray() throws IOException {
        String projectId = "my-project";
        Project project = new Project(projectId);
        List<BakuEvent> content = Lists.newArrayList();
        for (int i = 0; i < 10; i++) {
            content.add(new BakuEvent(0, JsonNodeFactory.instance.numberNode(10), "user", "Instant.EPOCH"));
        }
        tested.writeHistory(projectId, content);
        BakuEvent toAdd1 = new BakuEvent(0, JsonNodeFactory.instance.numberNode(11), "user", "Instant.EPOCH");
        BakuEvent toAdd2 = new BakuEvent(0, JsonNodeFactory.instance.numberNode(11), "user", "Instant.EPOCH");
        tested.addStack(project, objectMapper.valueToTree(ImmutableList.of(toAdd1, toAdd2)).toString().getBytes()).blockingGet();
        List<BakuEvent> actual = tested.readHistory(projectId);
        content.add(toAdd1);
        content.add(toAdd2);
        assertThat(actual).isEqualTo(content);
    }
}