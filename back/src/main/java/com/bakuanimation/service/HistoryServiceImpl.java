package com.bakuanimation.service;

import com.bakuanimation.api.CollaborationSyncService;
import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.PermissionService;
import com.bakuanimation.model.BakuAction;
import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.bakuanimation.model.Audio;
import com.bakuanimation.model.SoundTimeLine;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.google.api.client.util.Lists;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.collect.ImmutableListMultimap;
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
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import org.apache.commons.io.IOUtils;
import java.lang.*;

@Singleton
public class HistoryServiceImpl implements HistoryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(HistoryServiceImpl.class);

    private final PathService pathService;
    private final PermissionService permissionService;
    private final CollaborationSyncService collaborationSyncService;

    private final Scheduler stackScheduler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public HistoryServiceImpl(PathService pathService, PermissionService permissionService, CollaborationSyncService collaborationSyncService) {
        this.permissionService = permissionService;
        this.collaborationSyncService = collaborationSyncService;
        this.stackScheduler = Schedulers.from(Executors.newSingleThreadExecutor());
        this.pathService = pathService;
    }

    @Override
    public Single<Boolean> addStack(Project project, byte[] stack, String userId) {
        return Single.fromCallable(() -> {
            List<BakuEvent> history = readHistory(project.getId());
            Movie movie = composeMovie(project.getId(), history);
            JsonNode jsonNode = objectMapper.readTree(stack);
            if (jsonNode.isArray()) {
                for (JsonNode node : jsonNode) {
                    addEvent(project, movie, history, node);
                }
            } else {
                addEvent(project, movie, history, jsonNode);
            }
            writeHistory(project.getId(), history);
            return movie;
        })
                .flatMapPublisher(movie -> collaborationSyncService.broadcast(userId, movie.getProjectId(), new String(stack)))
                .lastOrError()
                .map(v -> true)
                .subscribeOn(stackScheduler);
    }

    private void addEvent(Project project, Movie movie, List<BakuEvent> history, JsonNode node) throws JsonProcessingException {
        BakuEvent bakuEvent = objectMapper.treeToValue(node, BakuEvent.class);
        permissionService.hasRight(project, movie, bakuEvent);
        history.add(bakuEvent);
    }

    @VisibleForTesting
    List<BakuEvent> readHistory(String projectId) throws IOException {
        Path stackFile = pathService.getStackFile(projectId);
        if (!Files.exists(stackFile)) {
            return Lists.newArrayList();
        }
        try (Reader r = new InputStreamReader(new FileInputStream(stackFile.toFile()), StandardCharsets.UTF_8)) {
            return objectMapper.readValue(r, new TypeReference<>() {
            });
        }
    }

    @Override
    public void writeHistory(String projectId, List<BakuEvent> events) throws IOException {
        Path stackFile = pathService.getStackFile(projectId);
        Path temp = pathService.getStackTempFile(projectId);
        pathService.createDirectory(projectId);
        try (Writer w = new OutputStreamWriter(new FileOutputStream(temp.toFile()), StandardCharsets.UTF_8)) {
            objectMapper.writeValue(w, events);
        }
        if (Files.exists(stackFile)) {
            Files.delete(stackFile);
        }
        Files.move(temp, stackFile);
    }

    @Override
    public Single<Boolean> deleteMovie(Project project) {
        return interpretHistory(project.getId())
                .map(movie -> {
                    try {
                        permissionService.hasRight(project, movie, new BakuEvent(BakuAction.DELETE_MOVIE.ordinal(),
                                JsonNodeFactory.instance.objectNode(), "", ""));
                        LOGGER.debug("Marked project {} to delete", project.getId());
                        Path newPath = Files.move(pathService.projectDir(project.getId()), pathService.deletePath(project.getId()));
                        Files.setLastModifiedTime(newPath, FileTime.from(Instant.now()));
                        return true;
                    } catch (IOException e) {
                        LOGGER.warn("Error while marking file to delete", e);
                        return false;
                    }
                });
    }

    @Override
    public Single<Movie> interpretHistory(String projectId) {
        return Single.fromCallable(() -> readHistory(projectId))
                .subscribeOn(Schedulers.io())
                .map(history -> composeMovie(projectId, history));
    }

    private Movie composeMovie(String projectId, List<BakuEvent> history) {
        String name = "";
        String synopsis = "";
        int fps = 0;
        boolean movieLocked = false;
        List<String> shots = new ArrayList<>();
        Map<String, List<Path>> images = new LinkedHashMap<>();
        Set<String> lockedShots = new HashSet<>();
        List<Audio> audios = new ArrayList<>();
        List<SoundTimeLine> soundsTimeline = new ArrayList<>();
        for (BakuEvent element : history) {
            switch (BakuAction.action(element.getAction())) {
                case MOVIE_UPDATE_TITLE:
                    name = element.getValue().asText();
                    break;
                case MOVIE_UPDATE_SYNOPSIS:
                    synopsis = element.getValue().asText();
                    break;
                case MOVIE_UPDATE_POSTER:
                    break;
                case MOVIE_INSERT_IMAGE: {
                    String shotId = element.getValue().get("shotId").asText();
                    int imageIndex = element.getValue().get("imageIndex").asInt();
                    String imageId = element.getValue().get("image").asText();
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
                case SHOT_ADD: {
                    String shotId = element.getValue().get("shotId").asText();
                    images.put(shotId, new ArrayList<>());
                    shots.add(shotId);
                    break;
                }
                case CHANGE_FPS:
                    fps = element.getValue().asInt();
                    break;
                case MOVIE_REMOVE_IMAGE: {
                    String shotId = element.getValue().get("shotId").asText();
                    int imageIndex = element.getValue().get("imageIndex").asInt();
                    images.get(shotId).remove(imageIndex);
                    break;
                }
                case SHOT_REMOVE: {
                    String shotId = element.getValue().get("shotId").asText();
                    images.remove(shotId);
                    shots.remove(shotId);
                    break;
                }
                case SHOT_MOVE: {
                    String shotId = element.getValue().get("shotId").asText();
                    shots.remove(shotId);
                    int index = element.getValue().get("index").asInt();
                    if (index < 0) {
                        index = 0;
                    } else if (index > shots.size()) {
                        index = shots.size();
                    }
                    shots.add(index, shotId);
                    break;
                }
                case MOVIE_LOCK: {
                    movieLocked = element.getValue().asBoolean();
                    break;
                }
                case SHOT_LOCK: {
                    String shotId = element.getValue().get("shotId").asText();
                    if (element.getValue().get("locked").asBoolean()) {
                        lockedShots.add(shotId);
                    } else {
                        lockedShots.remove(shotId);
                    }
                    break;
                }
                case MOVIE_REVERSE_IMAGES: {
                    String shotId = element.getValue().get("shotId").asText();
                    int leftIdx = element.getValue().get("imageIndexLeft").asInt();
                    int rightIdx = element.getValue().get("imageIndexRight").asInt();
                    Collections.reverse(images.get(shotId)
                            .subList(leftIdx, rightIdx + 1));
                    break;
                }
                case AUDIO_ADD: {
                    String audioId = element.getValue().get("audioId").asText();
                    String title = element.getValue().get("params").get("title").asText();
                    double duration = element.getValue().get("params").get("duration").asDouble();
                    InputStream sound = IOUtils.toInputStream(element.getValue().get("params").get("sound").asText());
                    audios.add(new Audio(audioId, title, sound, sound, 100, duration));
                    break;
                }
                case AUDIO_REMOVE: {
                    String audioId = element.getValue().get("audioId").asText();
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audios.remove(audio);
                            break;
                        }
                    }
                    break;
                }
                case AUDIO_UPDATE_TITLE: {
                    String audioId = element.getValue().get("audioId").asText();
                    String title = element.getValue().get("title").asText();
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audio.setTitle(title);
                            break;
                        }
                    }
                    break;                    
                }
                case AUDIO_UPDATE_SOUND: {
                    String audioId = element.getValue().get("audioId").asText();
                    InputStream sound = IOUtils.toInputStream(element.getValue().get("sound").asText());
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audio.setSound(sound);
                            break;
                        }
                    }
                    break;                    
                }
                case AUDIO_UPDATE_VOLUME: {
                    String audioId = element.getValue().get("audioId").asText();
                    double volume = element.getValue().get("volume").asDouble();
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audio.setVolume(volume);
                            break;
                        }
                    }
                    break;                    
                }
                case AUDIO_UPDATE_DURATION: {
                    String audioId = element.getValue().get("audioId").asText();
                    double duration = element.getValue().get("duration").asDouble();
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audio.setDuration(duration);
                            break;
                        }
                    }
                    break;                    
                }
                case AUDIO_UPDATE_WAVEFORM: {
                    String audioId = element.getValue().get("audioId").asText();
                    InputStream waveform = IOUtils.toInputStream(element.getValue().get("waveform").asText());
                    for (Audio audio : audios) {
                        if (audio.getId().equals(audioId)) {
                            audio.setWaveform(waveform);
                            break;
                        }
                    }
                    break;                    
                }
                case SOUNDTIMELINE_ADD: {
                    String soundTimelineId = element.getValue().get("soundTimelineId").asText();
                    String audioId = element.getValue().get("params").get("audioId").asText();
                    double pisteNumber = element.getValue().get("params").get("pisteNumber").asDouble();
                    double start = element.getValue().get("params").get("start").asDouble();
                    double end = element.getValue().get("params").get("end").asDouble();
                    soundsTimeline.add(new SoundTimeLine(soundTimelineId, audioId, pisteNumber, start, end));
                    break;                    
                }
                case SOUNDTIMELINE_REMOVE: {
                    String soundTimelineId = element.getValue().get("soundTimelineId").asText();
                    for (SoundTimeLine soundTimeline : soundsTimeline) {
                        if (soundTimeline.getSoundTimelineId().equals(soundTimelineId)) {
                            soundsTimeline.remove(soundTimeline);
                            break;
                        }
                    }
                    break;                    
                }
                case SOUNDTIMELINE_UPDATE_START: {
                    String soundTimelineId = element.getValue().get("soundTimelineId").asText();
                    double start = element.getValue().get("start").asDouble();
                    double end = element.getValue().get("end").asDouble();
                    for (SoundTimeLine soundTimeline : soundsTimeline) {
                        if (soundTimeline.getSoundTimelineId().equals(soundTimelineId)) {
                            soundTimeline.setStart(start);
                            soundTimeline.setEnd(end);
                            break;
                        }
                    }
                    break;                    
                }
                default: {
                    // Ignored
                    break;
                }
            }
        }

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
        return new Movie(projectId, name, synopsis, fps, movieLocked, lockedShots, shots, imagesBuilder.build(), audios, soundsTimeline);
    }
}
