package com.bakuanimation.server;

import com.google.common.annotations.VisibleForTesting;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.annotation.Nullable;
import javax.inject.Singleton;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

@Singleton
public class HistoryService {
    private final Path stackDirectory;
    private final Path imageDirectory;

    public HistoryService(PathService pathService) {
        this.stackDirectory = pathService.stackDirectory();
        this.imageDirectory = pathService.imagePath();
    }

    @VisibleForTesting
    void writeHistory(String projectId, JsonArray content) throws IOException {
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
            if (jsonElement.isJsonArray()) {
                for (JsonElement element : jsonElement.getAsJsonArray()) {
                    history.add(element);
                }
            } else {
                history.add(jsonElement);
            }
            writeHistory(projectId, history);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, List<Path>> interpretHistory(String projectId, JsonArray history, @Nullable String shot) throws IOException {
        Map<String, List<Path>> shots = new LinkedHashMap<>();
        for (JsonElement e : history) {
            JsonObject o = e.getAsJsonObject();
            int action = o.get("action").getAsInt();
            switch (action) {
                case 4: {
                    // new shot
                    String shotId = o.get("value").getAsJsonObject().get("shotId").getAsString();
                    if (shot == null || shot.equals(shotId)) {
                        shots.put(shotId, new LinkedList<>());
                    }
                    break;
                }
                case 3: {
                    // add image
                    JsonObject v = o.get("value").getAsJsonObject();
                    String shotId = v.get("shotId").getAsString();
                    if (shot == null || shot.equals(shotId)) {
                        int imageIndex = v.get("imageIndex").getAsInt();
                        String image = v.get("image").getAsString();
                        Path imageFile = imageDirectory.resolve(projectId).resolve("original").resolve(image);
                        shots.computeIfAbsent(shotId, k -> new LinkedList<>()).add(imageIndex, imageFile);
                    }
                    break;
                }
                case 6: {
                    // remove image
                    JsonObject v = o.get("value").getAsJsonObject();
                    String shotId = v.get("shotId").getAsString();
                    if (shot == null || shot.equals(shotId)) {
                        int imageIndex = v.get("imageIndex").getAsInt();
                        shots.get(shotId).remove(imageIndex);
                    }
                    break;
                }
                default: {
                    // Ignored
                    break;
                }
            }
        }

        return shots;
    }
}
