package com.bakuanimation.service;

import com.bakuanimation.api.ImageService;
import com.bakuanimation.api.Movie;
import com.google.common.collect.ImmutableListMultimap;
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
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.util.Collection;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Singleton
public class ImageServiceImpl implements ImageService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ImageServiceImpl.class);

    private final PathService pathService;

    public ImageServiceImpl(PathService pathService) {
        this.pathService = pathService;
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
                        zipEntry.setLastModifiedTime(FileTime.fromMillis(Files.getLastModifiedTime(image).toMillis()));
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
}
