package com.bakuanimation.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonPrimitive;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class HistoryServiceTest {

    private HistoryService tested;

    @BeforeEach
    void setUp(@TempDir Path sharedTempDir) {
        tested = new HistoryService(new PathService(sharedTempDir));
    }

    @Test
    void shouldWriteAndReadHistory() throws IOException {
        String projectId = "my-project";
        JsonArray content = new JsonArray();
        for (int i = 0; i < 10; i++) {
            content.add(i);
        }
        tested.writeHistory(projectId, content);
        JsonArray actual = tested.readHistory(projectId);
        Assertions.assertThat(actual).isEqualTo(content);
    }

    @Test
    void shouldAddAnImagesInWrongOrder() {
        String projectId = "my-project";
        String shotId = "87740160-181f-4965-b66c-ac6c71cacc48";

        tested.addStack(projectId, addShotStack(shotId)).blockingGet();
        tested.addStack(projectId, addImageStack(shotId, 0)).blockingGet();
        tested.addStack(projectId, addImageStack(shotId, 2)).blockingGet();
        tested.addStack(projectId, addImageStack(shotId, 1)).blockingGet();

        Movie movie = tested.interpretHistory(projectId).blockingGet();

        assertThat(movie.getImages().get(shotId))
                .extracting(p -> Integer.parseInt(p.getFileName().toString()))
                .containsExactly(0, 1, 2);
    }

    @Test
    void shouldAddAnImagesWithMissingIndex() {
        String projectId = "my-project";
        String shotId = "87740160-181f-4965-b66c-ac6c71cacc48";

        tested.addStack(projectId, addShotStack(shotId)).blockingGet();
        tested.addStack(projectId, addImageStack(shotId, 0)).blockingGet();
        tested.addStack(projectId, addImageStack(shotId, 2)).blockingGet();

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
        JsonArray content = new JsonArray();
        for (int i = 0; i < 10; i++) {
            content.add(i);
        }
        tested.writeHistory(projectId, content);
        JsonPrimitive toAdd = new JsonPrimitive(11);
        tested.addStack(projectId, toAdd.toString().getBytes()).blockingGet();
        JsonArray actual = tested.readHistory(projectId);
        content.add(toAdd);
        assertThat(actual).isEqualTo(content);
    }

    @Test
    void shouldAddStackArray() throws IOException {
        String projectId = "my-project";
        JsonArray content = new JsonArray();
        for (int i = 0; i < 10; i++) {
            content.add(i);
        }
        tested.writeHistory(projectId, content);
        JsonArray toAdd = new JsonArray();
        toAdd.add("test");
        toAdd.add(11);
        tested.addStack(projectId, toAdd.toString().getBytes()).blockingGet();
        JsonArray actual = tested.readHistory(projectId);
        content.add(toAdd.get(0));
        content.add(toAdd.get(1));
        assertThat(actual).isEqualTo(content);
    }
}