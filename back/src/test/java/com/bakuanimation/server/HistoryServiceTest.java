package com.bakuanimation.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonPrimitive;
import io.micronaut.test.annotation.MicronautTest;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import static org.assertj.core.api.Assertions.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@MicronautTest
class HistoryServiceTest {

    @TempDir
    static Path sharedTempDir;

    private HistoryService tested;

    @BeforeEach
    void setUp() {
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
    void shouldAddStack() throws IOException {
        String projectId = "my-project";
        JsonArray content = new JsonArray();
        for (int i = 0; i < 10; i++) {
            content.add(i);
        }
        tested.writeHistory(projectId, content);
        JsonPrimitive toAdd = new JsonPrimitive(11);
        tested.addStack(projectId, toAdd.toString().getBytes());
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
        tested.addStack(projectId, toAdd.toString().getBytes());
        JsonArray actual = tested.readHistory(projectId);
        content.add(toAdd.get(0));
        content.add(toAdd.get(1));
        assertThat(actual).isEqualTo(content);
    }
}