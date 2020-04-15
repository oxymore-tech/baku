package com.bakuanimation.server;

import com.google.common.collect.ImmutableMap;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;
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
import java.nio.file.attribute.FileTime;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Singleton
public class ImageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ImageService.class);

    private final Path imagePath;
    private final HistoryService historyService;

    public ImageService(PathService pathService, HistoryService historyService) {
        this.imagePath = pathService.imagePath();
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
            save(reduce(image, 1280), imagePath.resolve(projectId).resolve("original").resolve(filename), 1f);
            save(reduce(image, 1280), imagePath.resolve(projectId).resolve("lightweight").resolve(filename), .3f);
            save(reduce(image, 355), imagePath.resolve(projectId).resolve("thumbnail").resolve(filename), .6f);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public Path getImage(Path imageName) {
        return imagePath.resolve(imageName);
    }

    public void export(String projectId, @Nullable String shotId, OutputStream outputStream) throws IOException {
        LOGGER.info("Export {}", projectId);
        Map<String, List<Path>> shots = interpretHistory(projectId, this.historyService.readHistory(projectId), shotId);
        writeHistory(shots, outputStream);
    }

    private Map<String, List<Path>> interpretHistory(String projectId, JsonArray history, @Nullable String shot) throws IOException {
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
                        Path imageFile = imagePath.resolve(projectId).resolve("original").resolve(image);
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

    private void writeHistory(Map<String, List<Path>> shots, OutputStream outputStream) throws IOException {
        if (shots.isEmpty()) {
            return;
        }
        try (ZipOutputStream zip = new ZipOutputStream(new BufferedOutputStream(outputStream))) {

            int shotIndex = 0;
            for (Map.Entry<String, List<Path>> e : shots.entrySet()) {
                int imageIndex = 0;
                for (Path image : e.getValue()) {
                    String path = String.format("%03d/%03d_%04d.jpg", shotIndex, shotIndex, imageIndex);
                    ZipEntry entry = new ZipEntry(path);
                    entry.setLastModifiedTime(FileTime.fromMillis(Files.getLastModifiedTime(image).toMillis()));
                    zip.putNextEntry(entry);
                    Files.copy(image, zip);
                    zip.closeEntry();
                    imageIndex++;
                }
                shotIndex++;
            }
        }
    }
}
