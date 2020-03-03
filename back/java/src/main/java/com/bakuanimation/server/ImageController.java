package com.bakuanimation.server;

import com.liveaction.reactiff.api.server.HttpMethod;
import com.liveaction.reactiff.api.server.ReactiveHandler;
import com.liveaction.reactiff.api.server.Request;
import com.liveaction.reactiff.api.server.Result;
import com.liveaction.reactiff.api.server.annotation.PathParam;
import com.liveaction.reactiff.api.server.annotation.RequestMapping;
import com.liveaction.reactiff.api.server.multipart.FilePart;
import io.netty.handler.codec.http.HttpHeaderNames;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

public final class ImageController implements ReactiveHandler {

    private final ImageService imageService;
    private Path imagePath;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @RequestMapping(method = HttpMethod.POST, path = "/api/{projectId}/upload")
    public Mono<String> upload(@PathParam(value = "projectId") String projectId, Request request) {
        return request.parts()
                .subscribeOn(Schedulers.elastic())
                .map(parts -> {
                    FilePart upload = parts.values().stream()
                            .filter(part -> part instanceof FilePart)
                            .map(part -> (FilePart) part)
                            .findFirst()
                            .orElseThrow(() -> new IllegalArgumentException("You must upload a file to upload."));
                    String originalFileName = upload.filename();
                    try {
                        return Tuples.of(originalFileName, ImageIO.read(upload.asInputStream()));
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                })
                .doOnNext(tuple -> imageService.writeSmallerImages(tuple.getT2(), projectId, tuple.getT1()))
                .map(Tuple2::getT1);

    }

    @RequestMapping(method = HttpMethod.GET, path = "/images/{projectId}/{quality}/{imageName}")
    public Result<Path> getImage(@PathParam(value = "projectId") String projectId,
                                 @PathParam(value = "quality") String quality,
                                 @PathParam(value = "imageName") String imageName,
                                 Request request) throws IOException {
        imagePath = imageService.getImage(Paths.get(projectId).resolve(quality).resolve(imageName));
        if (Files.exists(imagePath)) {
            Result.Builder<Path> result = Result.builder();
            String etag;
            boolean skip = false;

            String cacheControl = request.header(HttpHeaderNames.CACHE_CONTROL);
            if ("no-cache".equalsIgnoreCase(cacheControl)) {
                etag = null;
            } else {
                try {
                    etag = etag(imagePath);
                } catch (IOException ioe) {
                    etag = null;
                }

                String fEtag = etag;
                skip = fEtag != null && request.headers("If-None-Match").stream()
                        .anyMatch(fEtag::equals);
            }

            Duration imageExpiration = Duration.ofDays(7);
            result.header(HttpHeaderNames.EXPIRES, Instant.now().plus(imageExpiration).toString());
            result.header(HttpHeaderNames.CACHE_CONTROL, "public, max-age=" + imageExpiration.getSeconds());
            result.header(HttpHeaderNames.LAST_MODIFIED, Files.getLastModifiedTime(imagePath).toInstant().toString());
            
            if (etag != null) {
                result.header("ETag", etag);
            }


            if (skip) {
                result.status(304, "Not Modified");
            } else {
                result.data(Mono.just(imagePath), Path.class);
            }
            return result.build();
        } else {
            return Result.<Path>notFound(imageName+ "not found");
        }
    }

    private static String etag(Path file) throws IOException {
        MessageDigest md;
        try {
            md = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        try (InputStream is = Files.newInputStream(file);
             DigestInputStream dis = new DigestInputStream(is, md))
        {
            /* Read decorated stream (dis) to EOF as normal... */
        }
        byte[] digest = md.digest();
        return bytesToHex(digest);
    }
    private static final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();
    private static String bytesToHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);
    }
}
