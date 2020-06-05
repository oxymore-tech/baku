package com.bakuanimation.service;

import com.bakuanimation.api.HistoryService;
import com.bakuanimation.api.ImageService;
import com.bakuanimation.model.BakuAction;
import com.bakuanimation.model.BakuEvent;
import com.bakuanimation.model.Movie;
import com.bakuanimation.model.Project;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableListMultimap;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.Nullable;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.imageio.stream.ImageOutputStream;
import javax.inject.Singleton;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;


@Singleton
public class ImageServiceImpl implements ImageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ImageServiceImpl.class);

    private final PathService pathService;
    private final HistoryService historyService;

    public ImageServiceImpl(PathService pathService, HistoryService historyService) {
        this.pathService = pathService;
        this.historyService = historyService;
    }

    private BufferedImage reduce(BufferedImage sourceImage, int width) throws IOException {
        try {
            ResampleOp resizeOp = new ResampleOp(width, (width * sourceImage.getHeight() / sourceImage.getWidth()));
            resizeOp.setFilter(ResampleFilters.getLanczos3Filter());
            return resizeOp.filter(sourceImage, null);
        } catch (Exception ie) {
            throw new IOException("Image error", ie);
        }
    }

    private void save(BufferedImage image, Path file, float quality) throws IOException {
        Files.createDirectories(file.getParent());

        ImageWriter jpgWriter = ImageIO.getImageWritersByFormatName("jpg").next();
        ImageWriteParam jpgWriteParam = jpgWriter.getDefaultWriteParam();
        jpgWriteParam.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        jpgWriteParam.setCompressionQuality(quality);

        try (ImageOutputStream outputStream = new FileImageOutputStream(file.toFile())) {
            jpgWriter.setOutput(outputStream);
            jpgWriter.write(null, new IIOImage(image, null, null), jpgWriteParam);
            jpgWriter.dispose();
        }
    }

    @Override
    public void writeSmallerImages(String projectId, InputStream inputStream, String filename) {
        try {
            BufferedImage image = ImageIO.read(inputStream);
            writeSmallerImages(image, projectId, filename);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private void writeSmallerImages(BufferedImage image, String projectId, String filename) {
        try {
            save(reduce(image, 1280), pathService.getImageFile(projectId, "original", filename), 1f);
            save(reduce(image, 1280), pathService.getImageFile(projectId, "lightweight", filename), .3f);
            save(reduce(image, 355), pathService.getImageFile(projectId, "thumbnail", filename), .6f);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public long estimatedExportSize(Movie movie, @Nullable String shotId) {
        ImmutableListMultimap<String, Path> images = shotId == null ?
                movie.getImages() :
                ImmutableListMultimap.<String, Path>builder()
                        .putAll(shotId, movie.getImages().get(shotId))
                        .build();
        if (images.isEmpty()) {
            return 0;
        }
        // https://stackoverflow.com/questions/22346487/how-can-we-estimate-overhead-of-a-compressed-file
        return movie.getShots().stream()
                .flatMap(shot -> movie.getImages().get(shot).stream())
                .mapToLong(imgFile -> {
                    try {
                        return Files.size(imgFile) + 97 + 2 * 16; // each image entry will be 16 chars
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }).sum() + 22;
    }

    @Override
    public void export(Movie movie, OutputStream outputStream, @Nullable String shotId) throws IOException {
        if (shotId == null) {
            LOGGER.info("Export {}", movie.getProjectId());
        } else {
            LOGGER.info("Export {} {}", movie.getProjectId(), shotId);
        }
        ImmutableListMultimap<String, Path> images = shotId == null ?
                movie.getImages() :
                ImmutableListMultimap.<String, Path>builder()
                        .putAll(shotId, movie.getImages().get(shotId))
                        .build();
        if (!images.isEmpty()) {
            try (ZipOutputStream zip = new ZipOutputStream(new BufferedOutputStream(outputStream))) {
                zip.setLevel(ZipOutputStream.STORED);
                int shotIndex = 0;
                for (Map.Entry<String, Collection<Path>> entry : images.asMap().entrySet()) {
                    int imageIndex = 0;
                    for (Path image : entry.getValue()) {
                        String path = String.format("%03d/%03d_%04d.jpg", shotIndex, shotIndex, imageIndex);
                        ZipEntry zipEntry = new ZipEntry(path);
                        zip.putNextEntry(zipEntry);
                        Files.copy(image, zip);
                        zip.closeEntry();
                        imageIndex++;
                    }
                    shotIndex++;
                }
            }
        }
    }

    @Override
    public Single<Project> importMovie(String projectName) {
        String user = "system";
        String timestamp = Instant.now().toString();
        return Single.fromCallable(() -> {
            if (!Files.exists(pathService.projectDir(projectName))) {
                throw new NoSuchElementException("Project " + projectName + " does not exist");
            }
            if (Files.exists(pathService.getStackFile(projectName))) {
                LOGGER.debug("Movie {} is already existing, import is skipped", projectName);
                return new Project(projectName);
            }
            Map<String, List<Path>> shots = getShots(projectName);
            for (List<Path> shot : shots.values()) {
                for (Path image : shot) {
                    try (InputStream is = new FileInputStream(image.toFile())) {
                        writeSmallerImages(projectName, is, image.getFileName().toString());
                    }
                    Files.delete(image);
                }
            }

            List<BakuEvent> events = new ArrayList<>();
            JsonNodeFactory jsonNodeFactory = JsonNodeFactory.instance;

            for (Map.Entry<String, List<Path>> shotEntry : shots.entrySet()) {
                ObjectNode shotNode = jsonNodeFactory.objectNode();
                shotNode.set("name", jsonNodeFactory.textNode("Nouveau plan"));
                shotNode.set("shotId", jsonNodeFactory.textNode(shotEntry.getKey()));
                events.add(new BakuEvent(BakuAction.SHOT_ADD.ordinal(), shotNode, user, timestamp));

                for (int i = 0; i < shotEntry.getValue().size(); i++) {
                    Path image = shotEntry.getValue().get(i);
                    ObjectNode imageNode = jsonNodeFactory.objectNode();
                    imageNode.set("image", jsonNodeFactory.textNode(image.getFileName().toString()));
                    imageNode.set("imageIndex", jsonNodeFactory.numberNode(i));
                    imageNode.set("shotId", jsonNodeFactory.textNode(shotEntry.getKey()));

                    events.add(new BakuEvent(BakuAction.MOVIE_INSERT_IMAGE.ordinal(), imageNode, user, timestamp));
                }
            }

            events.add(new BakuEvent(BakuAction.MOVIE_LOCK.ordinal(), jsonNodeFactory.booleanNode(true), user, timestamp));

            historyService.writeHistory(projectName, events);
            return new Project(projectName);
        }).subscribeOn(Schedulers.io());
    }

    private Map<String, List<Path>> getShots(String projectId) throws IOException {
        Map<String, List<Path>> result = new LinkedHashMap<>();
        if (Files.list(pathService.projectDir(projectId))
                .anyMatch(path -> Files.isRegularFile(path) && path.getFileName().toString().endsWith(".jpg"))) {
            // if single shot
            List<Path> images = getImages(pathService.projectDir(projectId));
            result.put("shot-000", images);
        } else {
            // if multiple shots
            List<Path> shots = Files.list(pathService.projectDir(projectId))
                    .filter(Files::isDirectory)
                    .sorted()
                    .collect(Collectors.toUnmodifiableList());

            for (Path shotPath : shots) {
                result.put(shotPath.getFileName().toString(), getImages(shotPath));
            }
        }
        return result;
    }

    private List<Path> getImages(Path imagePath) throws IOException {
        return Files.list(imagePath)
                .filter(path -> path.getFileName().toString().endsWith(".jpg"))
                .sorted()
                .collect(Collectors.toUnmodifiableList());
    }

//    public Single<Project> unzip(String projectId, InputStream inputStream) {
//        LocalFileHeader localFileHeader;
//        int readLen;
//        byte[] readBuffer = new byte[4096];
//        try (ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {
//            while ((localFileHeader = zipInputStream.getNextEntry()) != null) {
//                File extractedFile = new File(localFileHeader.getFileName());
//                try (OutputStream outputStream = new FileOutputStream(extractedFile)) {
//                    while ((readLen = zipInputStream.read(readBuffer)) != -1) {
//                        outputStream.write(readBuffer, 0, readLen);
//                    }
//                }
//            }
//        } catch (IOException e) {
//            LOGGER.warn("Error while importing movie {}", projectId, e);
//            return Single.error(e);
//        }
//    }
}
