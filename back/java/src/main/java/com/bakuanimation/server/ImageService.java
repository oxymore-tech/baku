package com.bakuanimation.server;

import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.FileImageOutputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;

public final class  ImageService {

    private final Path imagePath;

    public ImageService(Path imagePath) {
        this.imagePath = imagePath;
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

    public BufferedImage loadImage(ByteBuffer buffer) throws IOException {
        try {
            try (InputStream in = new ByteArrayInputStream(buffer.array(), buffer.arrayOffset(), buffer.arrayOffset() + buffer.remaining())) {
                return ImageIO.read(in);
            }
        } catch (Exception ie) {
            throw new IOException("Image error", ie);
        }
    }

    public void writeSmallerImages(BufferedImage image, String projectId, String filename) {
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
}
