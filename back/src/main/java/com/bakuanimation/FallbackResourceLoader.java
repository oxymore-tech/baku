package com.bakuanimation;

import io.micronaut.core.io.ResourceLoader;
import io.micronaut.core.io.file.DefaultFileSystemResourceLoader;

import javax.inject.Singleton;
import java.io.InputStream;
import java.net.URL;
import java.util.Optional;
import java.util.stream.Stream;

@Singleton
public class FallbackResourceLoader implements ResourceLoader {

    private static final String defaultResource = "index.html";
    private final ResourceLoader fileSystemResourceLoader;

    public FallbackResourceLoader() {
        this.fileSystemResourceLoader = new DefaultFileSystemResourceLoader();
    }

    public FallbackResourceLoader(String path) {
        this.fileSystemResourceLoader = new DefaultFileSystemResourceLoader(path);
    }

    @Override
    public Optional<InputStream> getResourceAsStream(String path) {
        return fileSystemResourceLoader.getResourceAsStream(path);
    }

    @Override
    public Optional<URL> getResource(String path) {
        Optional<URL> askedResource = fileSystemResourceLoader.getResource(path);
        if (askedResource.isEmpty()) {
            return fileSystemResourceLoader.getResource(defaultResource);
        } else {
            return askedResource;
        }
    }

    @Override
    public Stream<URL> getResources(String name) {
        return fileSystemResourceLoader.getResources(name);
    }

    @Override
    public boolean supportsPrefix(String path) {
        return path.startsWith("fb:");
    }

    @Override
    public ResourceLoader forBase(String basePath) {
        return new FallbackResourceLoader(normalize(basePath));
    }

    private static String normalize(String path) {
        if (path == null) {
            return null;
        }
        if (path.startsWith("fb:")) {
            path = path.substring(3);
        }
        return path;
    }

}
