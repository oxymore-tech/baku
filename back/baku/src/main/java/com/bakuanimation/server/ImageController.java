package com.bakuanimation.server;

import io.micronaut.cache.annotation.Cacheable;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.*;
import io.micronaut.http.multipart.CompletedPart;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;

import java.nio.file.Files;
import java.nio.file.Paths;

@Controller
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @Post("/api/{projectId}/upload")
    public Single<String> upload(@PathVariable String projectId, @Body Single<CompletedPart> part) {
        return part
                .subscribeOn(Schedulers.computation())
                .map(upload -> {
                    imageService.writeSmallerImages(projectId, upload.getInputStream(), upload.getName());
                    return upload.getName();
                });

    }

    @Get("/images/{projectId}/{quality}/{imageName}")
    @Cacheable
    public HttpResponse<Object> getImage(@PathVariable String projectId,
                                         @PathVariable String quality,
                                         @PathVariable String imageName) {
        var imagePath = imageService.getImage(Paths.get(projectId).resolve(quality).resolve(imageName));
        if (Files.exists(imagePath)) {
            return HttpResponse.ok(imagePath);
        } else {
            return HttpResponse.notFound(imageName + "not found");
        }
    }

}
