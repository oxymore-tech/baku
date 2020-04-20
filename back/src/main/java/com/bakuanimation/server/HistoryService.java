package com.bakuanimation.server;

import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableListMultimap;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.reactivex.Scheduler;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.Executors;

@Singleton
public class HistoryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(HistoryService.class);

    private final Scheduler stackScheduler;
    private final PathService pathService;

    public HistoryService(PathService pathService) {
        this.stackScheduler = Schedulers.from(Executors.newSingleThreadExecutor());
        this.pathService = pathService;
    }

    public Single<Boolean> addStack(String projectId, byte[] stack) {
        return readHistory(projectId)
                .flatMap(history ->
                        Single.fromCallable(() -> {
                            JsonElement jsonElement = JsonParser.parseString(new String(stack));
                            if (jsonElement.isJsonArray()) {
                                for (JsonElement element : jsonElement.getAsJsonArray()) {
                                    history.add(element);
                                }
                            } else {
                                history.add(jsonElement);
                            }
                            writeHistory(projectId, history);
                            return true;
                        }).subscribeOn(stackScheduler));
    }

    public Single<JsonArray> readHistory(String projectId) {
        return Single.fromCallable(() -> {
            Path stackFile = pathService.getStackFile(projectId);
            if (!Files.exists(stackFile)) {
                return new JsonArray();
            }
            try (Reader r = new InputStreamReader(new FileInputStream(stackFile.toFile()), StandardCharsets.UTF_8)) {
                return JsonParser.parseReader(r).getAsJsonArray();
            }
        }).subscribeOn(Schedulers.io());
    }

    @VisibleForTesting
    void writeHistory(String projectId, JsonArray content) throws IOException {
        Path stackFile = pathService.getStackFile(projectId);
        Path temp = pathService.getStackTempFile(projectId);
        pathService.createDirectory(projectId);
        try (Writer w = new OutputStreamWriter(new FileOutputStream(temp.toFile()), StandardCharsets.UTF_8)) {
            w.write(content.toString());
        }
        if (Files.exists(stackFile)) {
            Files.delete(stackFile);
        }
        Files.move(temp, stackFile);
    }

    public Single<Movie> interpretHistory(String projectId) {
        return readHistory(projectId).map(history -> {
            String name = "";
            String synopsis = "";
            int fps = 0;
            Map<String, List<Path>> images = new LinkedHashMap<>();
            for (JsonElement element : history) {
                JsonObject object = element.getAsJsonObject();
                int action = object.get("action").getAsInt();
                switch (action) {
                    case 0:
                        // MOVIE_UPDATE_TITLE
                        name = object.get("value").getAsString();
                        break;
                    case 1:
                        // MOVIE_UPDATE_SYNOPSIS
                        synopsis = object.get("value").getAsString();
                        break;
                    case 2:
                        // MOVIE_UPDATE_POSTER
                        break;
                    case 3: {
                        // add image
                        JsonObject v = object.get("value").getAsJsonObject();
                        String shotId = v.get("shotId").getAsString();
                        int imageIndex = v.get("imageIndex").getAsInt();
                        String imageId = v.get("image").getAsString();
                        Path imageFile = pathService.getImageFile(projectId, "original", imageId);
                        List<Path> imageList = images.computeIfAbsent(shotId, k -> new ArrayList<>());
                        int imageListSize = imageList.size();
                        if (imageIndex > imageListSize) {
                            for (int i = 0; i < (imageIndex - imageListSize); i++) {
                                imageList.add(null);
                            }
                        }
                        if (imageIndex < imageList.size() && imageList.get(imageIndex) == null) {
                            imageList.set(imageIndex, imageFile);
                        } else {
                            imageList.add(imageIndex, imageFile);
                        }
                        break;
                    }
                    case 4: {
                        // new shot
                        String shotId = object.get("value").getAsJsonObject().get("shotId").getAsString();
                        images.put(shotId, new ArrayList<>());
                        break;
                    }
                    case 5:
                        fps = object.get("value").getAsInt();
                        // CHANGE_FPS
                        break;
                    case 6: {
                        // remove image
                        JsonObject v = object.get("value").getAsJsonObject();
                        String shotId = v.get("shotId").getAsString();
                        int imageIndex = v.get("imageIndex").getAsInt();
                        images.get(shotId).remove(imageIndex);
                        break;
                    }
                    case 7: {
                        // remove shot
                        JsonObject v = object.get("value").getAsJsonObject();
                        String shotId = v.get("shotId").getAsString();
                        images.remove(shotId);
                        break;
                    }
                    default: {
                        // Ignored
                        break;
                    }
                }
            }

            ImmutableList<String> shots = ImmutableList.copyOf(images.keySet());
            ImmutableListMultimap.Builder<String, Path> imagesBuilder = ImmutableListMultimap.builder();
            for (Map.Entry<String, List<Path>> imagesEntry : images.entrySet()) {
                String shotId = imagesEntry.getKey();
                Iterator<Path> iterator = imagesEntry.getValue().iterator();
                int index = 0;
                while (iterator.hasNext()) {
                    Path value = iterator.next();
                    if (value == null) {
                        iterator.remove();
                        LOGGER.warn("Missing image at index {} in movie : '{}', shot : '{}' (image is ignored)", index, projectId, shotId);
                    }
                    index++;
                }
                imagesBuilder.putAll(shotId, imagesEntry.getValue());
            }
            return new Movie(projectId, name, synopsis, fps, shots, imagesBuilder.build());
        });
    }
}
