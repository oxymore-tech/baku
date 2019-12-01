package com.bakuanimation;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.Comparator;

import javax.imageio.ImageIO;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.jpeg.JpegDirectory;
import com.google.common.base.Charsets;
import com.google.common.io.Files;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.mortennobel.imagescaling.ResampleFilters;
import com.mortennobel.imagescaling.ResampleOp;

public final class GenerateStackAndThumbnails {
	private static final Logger LOGGER = LoggerFactory.getLogger(GenerateStackAndThumbnails.class);

	private static File[] list(File d) {
		File[] directories = d.listFiles();
		if (directories == null) {
			return new File[] {};
		}
		Arrays.sort(directories, new Comparator<File>() {
			@Override
			public int compare(File o1, File o2) {
				return o1.getName().compareTo(o2.getName());
			}
		});
		return directories;
	}
	
	private static String format(int i) {
		return String.format("%03d", i);
	}
	
	public static void main(String[] args) throws Exception {
		boolean multipleShots;
		if (args[0].equals("multiple")) {
			multipleShots = true;
		} else if (args[0].equals("single")) {
			multipleShots = false;
		} else {
			throw new Exception("multiple|single allowed only");
		}
		int thumbnailWidth = 185;
		int thumbnailHeight = 104;
		String user = "Lovely Anole";

		File thumbnailDir = new File("upload_thumbs");
		File imageDir = new File("upload_files");
		File stackDir = new File("stacks");

		for (File allProjectDir : list(new File("movie_data"))) {
			String projectName = allProjectDir.getName();
			System.out.println("GENERATING " + projectName);
			File projectThumbnailDir = new File(thumbnailDir, projectName);
			File projectImageDir = new File(imageDir, projectName);
			File projectStackFile = new File(stackDir, projectName + ".stack");

			JsonArray stack = new JsonArray();
			
			int shotIndex = 0;
			for (File shotDirectory : list(allProjectDir)) {
				System.out.println("SHOT " + shotDirectory.getName());
				
				String shotId = "shot-" + format(shotIndex);
				if (multipleShots || (shotIndex == 0)) {
					JsonObject shotEvent = new JsonObject();
					shotEvent.add("action", new JsonPrimitive(4));
					shotEvent.add("user", new JsonPrimitive(user));
					JsonObject shot = new JsonObject();
					shot.add("name", new JsonPrimitive("Nouveau plan"));
					shot.add("shotId", new JsonPrimitive(shotId));
					shotEvent.add("value", shot);
					stack.add(shotEvent);
				}
				
				int imageIndex = 0;
				for (File file : list(shotDirectory)) {
					if (!file.getName().endsWith(".jpg")) {
						continue;
					}
					
					System.out.println("IMAGE " + file.getName());

					String imageName = "image-" + format(imageIndex) + ".jpg";
					
					File thumbnailFile = new File(new File(projectThumbnailDir, shotId), imageName + "-" + thumbnailWidth + "x" + thumbnailHeight);
					thumbnailFile.getParentFile().mkdirs();
					if (!thumbnailFile.exists()) {
						save(reduce(load(file), thumbnailWidth, thumbnailHeight), thumbnailFile);
					}
	
					File imageFile = new File(new File(projectImageDir, shotId), imageName);
					imageFile.getParentFile().mkdirs();
					if (!imageFile.exists()) {
						Files.copy(file, imageFile);
					}
	
					JsonObject imageEvent = new JsonObject();
					imageEvent.add("action", new JsonPrimitive(3));
					imageEvent.add("user", new JsonPrimitive(user));
					JsonObject image = new JsonObject();
					image.add("image", new JsonPrimitive(imageName));
					image.add("imageIndex", new JsonPrimitive(imageIndex));
					image.add("shotId", new JsonPrimitive(shotId));
					imageEvent.add("value", image);
					stack.add(imageEvent);
					
					imageIndex++;
				}
				
				if (multipleShots) {
					shotIndex++;
				}
			}

			projectStackFile.getParentFile().mkdirs();
			Files.write(stack.toString().getBytes(Charsets.UTF_8), projectStackFile);
		}
	}
	
	private static BufferedImage load(File g) throws IOException {
		try (FileInputStream metadataIn = new FileInputStream(g); FileInputStream fileIn = new FileInputStream(g)) {
			return load(metadataIn, fileIn);
		}
	}
	private static BufferedImage load(InputStream metadataIn, InputStream fileIn) throws IOException {
		try {
			int orientation = 0;
			int width = 0;
			int height = 0;
			try {
				Metadata metadata = ImageMetadataReader.readMetadata(metadataIn);
	
				Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
				if (directory != null) {
					JpegDirectory jpegDirectory = metadata.getFirstDirectoryOfType(JpegDirectory.class);
					if ((jpegDirectory != null) && directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
						orientation = directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
						width = jpegDirectory.getImageWidth();
						height = jpegDirectory.getImageHeight();
					}
				}
			} catch (Exception me) {
				LOGGER.warn("Could not get image orientation", me);
				orientation = 0;
			}
	
			AffineTransform transform = new AffineTransform();
	
			switch (orientation) {
			case 1:
				break;
			case 2: // Flip X
				transform.scale(-1d, 1d);
				transform.translate(-width, 0d);
				break;
			case 3: // PI rotation
				transform.translate(width, height);
				transform.rotate(Math.PI);
				break;
			case 4: // Flip Y
				transform.scale(1d, -1d);
				transform.translate(0d, -height);
				break;
			case 5: // - PI/2 and Flip X
				transform.rotate(-Math.PI / 2d);
				transform.scale(-1d, 1d);
				break;
			case 6: // -PI/2 and -width
				transform.translate(height, 0d);
				transform.rotate(Math.PI / 2d);
				break;
			case 7: // PI/2 and Flip
				transform.scale(-1d, 1d);
				transform.translate(-height, 0d);
				transform.translate(0d, width);
				transform.rotate(3d * Math.PI / 2d);
				break;
			case 8: // PI / 2
				transform.translate(0d, width);
				transform.rotate(3d * Math.PI / 2d);
				break;
			}
	
			BufferedImage destinationImage;
	
			BufferedImage sourceImage = ImageIO.read(fileIn);
			if (sourceImage == null) {
				throw new IOException("Invalid image");
			}
	
			if (orientation == 0) {
				destinationImage = sourceImage;
			} else {
				AffineTransformOp op = new AffineTransformOp(transform, AffineTransformOp.TYPE_BILINEAR);
				destinationImage = op.filter(sourceImage, null);
			}
	
			BufferedImage ii = new BufferedImage(destinationImage.getWidth(), destinationImage.getHeight(), BufferedImage.TYPE_INT_RGB);
			Graphics2D igg = ii.createGraphics();
			try {
				igg.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);  
				igg.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);  
				igg.drawImage(destinationImage, 0, 0, ii.getWidth(), ii.getHeight(), null);
			} finally {
				igg.dispose();
			}
			destinationImage = ii;
			
			return destinationImage;
		} catch (Exception ie) {
			throw new IOException("Image error", ie);
		}
	}
		
	private static void save(BufferedImage image, File to) throws IOException {
		try (OutputStream os = new FileOutputStream(to)) {
			ImageIO.write(image, "jpg", os);
		}
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
}
