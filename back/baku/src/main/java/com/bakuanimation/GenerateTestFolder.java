package com.bakuanimation;

import com.google.common.collect.ImmutableList;
import com.google.common.io.Resources;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.jpeg.JPEGImageWriteParam;
import javax.imageio.stream.FileImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public final class GenerateTestFolder {

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
        Path path = Paths.get(args[0]);
        int count = Integer.parseInt(args[1]);
        String projectName = "test_" + count;
        Path imagePath = path.resolve("images").resolve(projectName);
        for (Quality quality : qualities) {
            Files.createDirectories(imagePath.resolve(quality.folder));
        }
        Path stackFile = path.resolve("stacks").resolve(projectName + ".stack");
        JsonArray stack = new JsonArray();

        // add shot event only once
        JsonObject shotEvent = new JsonObject();
        shotEvent.add("action", new JsonPrimitive(4));
        shotEvent.add("user", new JsonPrimitive(USERNAME));
        JsonObject shot = new JsonObject();
        shot.add("name", new JsonPrimitive("Nouveau plan"));
        shot.add("shotId", new JsonPrimitive(0));
        shotEvent.add("value", shot);
        stack.add(shotEvent);
        URL image1 = GenerateTestFolder.class.getResource("/image-1.jpg");
        URL image2 = GenerateTestFolder.class.getResource("/image-2.jpg");
//        Path image1 = Paths.get(GenerateTestFolder.class.getResource("/image-1.jpg").getPath());
//        Path image2 = Paths.get(GenerateTestFolder.class.getResource("/image-2.jpg").getPath());
        String src1Name = "image_" + format(0) + ".jpg";
        String src2Name = "image_" + format(1) + ".jpg";
        for (Quality quality : qualities) {
            Path output1 = imagePath.resolve(quality.folder).resolve(src1Name);
            Path output2 = imagePath.resolve(quality.folder).resolve(src2Name);
            write(image1, output1, quality);
            write(image2, output2, quality);
            JsonObject imageEvent1 = addImageEvent(src1Name, 0);
            JsonObject imageEvent2 = addImageEvent(src2Name, 1);
            stack.add(imageEvent1);
            stack.add(imageEvent2);
        }

        for (int i = 2; i < count / 2; i++) {
            int image1Idx = 2 * i;
            int image2Idx = 2 * i + 1;
            String image1Name = "image_" + format(image1Idx) + ".jpg";
            String image2Name = "image_" + format(image2Idx) + ".jpg";

            for (Quality quality : qualities) {
                Path src1 = imagePath.resolve(quality.folder).resolve(src1Name);
                Path src2 = imagePath.resolve(quality.folder).resolve(src2Name);
                Path output1 = imagePath.resolve(quality.folder).resolve(image1Name);
                Path output2 = imagePath.resolve(quality.folder).resolve(image2Name);
                Files.copy(src1, output1, StandardCopyOption.REPLACE_EXISTING);
                Files.copy(src2, output2, StandardCopyOption.REPLACE_EXISTING);

            }

            JsonObject imageEvent1 = addImageEvent(image1Name, image1Idx);
            JsonObject imageEvent2 = addImageEvent(image2Name, image2Idx);
            stack.add(imageEvent1);
            stack.add(imageEvent2);
        }
        if (Files.exists(stackFile)) {
            Files.delete(stackFile);
        }
        Files.createDirectories(stackFile.getParent());
        Files.write(stackFile, stack.toString().getBytes());
    }

    private static JsonObject addImageEvent(String imageName, int imageIndex) {
        JsonObject imageEvent = new JsonObject();
        imageEvent.add("action", new JsonPrimitive(3));
        imageEvent.add("user", new JsonPrimitive(USERNAME));
        JsonObject image = new JsonObject();
        image.add("image", new JsonPrimitive(imageName));
        image.add("imageIndex", new JsonPrimitive(imageIndex));
        image.add("shotId", new JsonPrimitive(0));
        imageEvent.add("value", image);
        return imageEvent;
    }

    public static void write(URL inputFile, Path output, Quality quality) throws IOException {
        if (Files.exists(output)) {
            Files.delete(output);
        }
        JPEGImageWriteParam jpegParams = new JPEGImageWriteParam(null);
        jpegParams.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        jpegParams.setCompressionQuality(quality.jpgQuality / 100f);
        BufferedImage input = ImageIO.read(inputFile);
        input = reduce(input, quality.width, quality.height);
        final ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        // specifies where the jpg image has to be written
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
