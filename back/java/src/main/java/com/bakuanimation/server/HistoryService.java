package com.bakuanimation.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class HistoryService {
    private final Path stackDirectory;

    public HistoryService(Path stackDirectory) {
        this.stackDirectory = stackDirectory;
    }

    private void writeHistory(String projectId, JsonArray content) throws IOException {
        Path stackFile = stackFile(projectId);
        Files.createDirectories(stackDirectory);
        Path temp = Files.createTempFile(stackDirectory, "_", ".temp");
        try (Writer w = new OutputStreamWriter(new FileOutputStream(temp.toFile()), StandardCharsets.UTF_8)) {
            w.write(content.toString());
        }
        if (Files.exists(stackFile)) {
            Files.delete(stackFile);
        }
        Files.move(temp, stackFile);
    }

    public JsonArray readHistory(String projectId) throws IOException {
        Path stackFile = stackFile(projectId);
        if (!Files.exists(stackFile)) {
            return new JsonArray();
        }
        try (Reader r = new InputStreamReader(new FileInputStream(stackFile.toFile()), StandardCharsets.UTF_8)) {
            return JsonParser.parseReader(r).getAsJsonArray();
        }
    }

    public Path stackFile(String projectId) {
        return stackDirectory.resolve(projectId + ".stack");
    }


    // TODO synchronized ?
    public void addStack(String projectId, byte[] stack) {
        try {
            JsonArray history = readHistory(projectId);
            JsonElement jsonElement = JsonParser.parseString(new String(stack));
            history.add(jsonElement);
            writeHistory(projectId, history);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
