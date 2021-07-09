package com.bakuanimation;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.common.collect.ImmutableList;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.jpeg.JPEGImageWriteParam;
import javax.imageio.stream.FileImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

/**
* Same as GenerateStackAndThumbnails but adapted to new images format (to be cleaned)
*/
public final class GenerateMovie {

    private static final String USERNAME = "Lovely Anole";
    private static final ImmutableList<Quality> qualities = ImmutableList.<Quality>builder()
            .add(new Quality(1280, 720, 100, "original"))
            .add(new Quality(1280, 720, 30, "lightweight"))
            .add(new Quality(355, 200, 60, "thumbnail"))
            .build();

    private static String format(int i) {
        return String.format("%04d", i);
    }

    public static void main(String[] args) throws IOException {
        Path srcPath = Paths.get(args[0]);
        String projectName = srcPath.getFileName().toString();
        Path dstPath = Paths.get(args[1]);
        Path imageDstPath = dstPath.resolve("images");
        for (Quality quality : qualities) {
            Files.createDirectories(imageDstPath.resolve(quality.folder));
        }
        Path stackFile = dstPath.resolve("stack.json");
        JsonNodeFactory jsonNodeFactory = JsonNodeFactory.instance;
        ArrayNode stack = jsonNodeFactory.arrayNode();

        // add shot event only once
        List<Path> shotPaths = Files.list(srcPath)
                .sorted()
                .collect(Collectors.toList());

        // Changin movie name
        ObjectNode movieNameEvent = jsonNodeFactory.objectNode();
        movieNameEvent.put("action", 0);
        movieNameEvent.put("user", USERNAME);
        movieNameEvent.put("value", projectName);
        stack.add(movieNameEvent);

        //locking movie
        ObjectNode movieLockEvent = jsonNodeFactory.objectNode();
        movieLockEvent.put("action", 8);
        movieLockEvent.put("user", USERNAME);
        movieLockEvent.put("value", true);
        stack.add(movieLockEvent);

        for (int shotIdx = 0; shotIdx < shotPaths.size(); shotIdx++) {
            System.out.println("Generating shot " + shotIdx);
            Path shotPath = shotPaths.get(shotIdx);
            ObjectNode shotEvent = jsonNodeFactory.objectNode();
            shotEvent.put("action", 4);
            shotEvent.put("user", USERNAME);
            ObjectNode shot = jsonNodeFactory.objectNode();
            shot.put("name", "Nouveau plan");
            shot.put("shotId", shotIdx+"");
            shotEvent.set("value", shot);
            stack.add(shotEvent);

            List<Path> images = Files.list(shotPath)
                    .sorted()
                    .collect(Collectors.toList());
            for (int imageIdx = 0; imageIdx < images.size(); imageIdx++) {
                Path imagePath = images.get(imageIdx);
                String imageName = imagePath.getFileName().toString();
                for (Quality quality : qualities) {
                    Path output1 = imageDstPath.resolve(quality.folder).resolve(imageName);
                    write(imagePath, output1, quality);
                }
                ObjectNode imageEvent = addImageEvent(imageName, shotIdx, imageIdx);
                stack.add(imageEvent);
            }
        }
        if (Files.exists(stackFile)) {
            Files.delete(stackFile);
        }
        Files.createDirectories(stackFile.getParent());
        Files.write(stackFile, stack.toString().getBytes());
    }

    private static ObjectNode addImageEvent(String imageName, int shotIdx, int imageIndex) {
        ObjectNode imageEvent = JsonNodeFactory.instance.objectNode();
        imageEvent.put("action", 3);
        imageEvent.put("user", USERNAME);
        ObjectNode image = JsonNodeFactory.instance.objectNode();
        image.put("image", imageName);
        image.put("imageIndex", imageIndex+"");
        image.put("shotId", shotIdx+"");
        imageEvent.set("value", image);
        return imageEvent;
    }

    public static void write(Path inputFile, Path output, Quality quality) throws IOException {
        if (Files.exists(output)) {
            Files.delete(output);
        }
        JPEGImageWriteParam jpegParams = new JPEGImageWriteParam(null);
        jpegParams.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        jpegParams.setCompressionQuality(quality.jpgQuality / 100f);
        BufferedImage input = ImageIO.read(inputFile.toFile());
        input = reduce(input, quality.width, quality.height);
        final ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        // specifies where the jpg image has to be written
        Files.createDirectories(output.getParent());
        writer.setOutput(new FileImageOutputStream(output.toFile()));

        // writes the file with given compression level
        // from your JPEGImageWriteParam instance
        writer.write(null, new IIOImage(input, null, null), jpegParams);
    }

    private static BufferedImage reduce(BufferedImage sourceImage, int maxWidth, int maxHeight) throws IOException {
        try {
            int w = maxWidth;
            int h = sourceImage.getHeight() * w / sourceImage.getWidth();
            if (h > maxHeight) {
                h = maxHeight;
                w = sourceImage.getWidth() * h / sourceImage.getHeight();
            }
            ResampleOp resizeOp = new ResampleOp(w, h);
            resizeOp.setFilter(ResampleFilters.getLanczos3Filter());
            return resizeOp.filter(sourceImage, null);
        } catch (Exception ie) {
            throw new IOException("Image error", ie);
        }
    }

    private static final class Quality {
        private final int width;
        private final int height;
        private final int jpgQuality;
        private final String folder;

        public Quality(int width, int height, int jpgQuality, String folder) {
            this.width = width;
            this.height = height;
            this.jpgQuality = jpgQuality;
            this.folder = folder;
        }
    }
}
