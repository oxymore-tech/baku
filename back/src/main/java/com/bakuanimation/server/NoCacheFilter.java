package com.bakuanimation.server;

import com.google.common.collect.ImmutableSet;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.MediaType;
import io.micronaut.http.MutableHttpResponse;
import io.micronaut.http.annotation.Filter;
import io.micronaut.http.filter.HttpServerFilter;
import io.micronaut.http.filter.ServerFilterChain;
import io.micronaut.http.server.types.files.FileCustomizableResponseType;
import io.netty.handler.codec.http.HttpHeaderNames;
import io.reactivex.Flowable;
import org.reactivestreams.Publisher;

import java.util.Optional;

@Filter("/**")
public class NoCacheFilter implements HttpServerFilter {

    private static final ImmutableSet<MediaType> DISABLE_CACHE_FOR = ImmutableSet.of(MediaType.TEXT_HTML_TYPE);

    @Override
    public Publisher<MutableHttpResponse<?>> doFilter(HttpRequest<?> request, ServerFilterChain chain) {
        return Flowable.fromPublisher(chain.proceed(request))
                .doOnNext(res -> {
                    if (disableCache(res)) {
                        res.getHeaders().add(HttpHeaderNames.CACHE_CONTROL, "no-cache");
                    }
                });
    }

    private boolean disableCache(MutableHttpResponse<?> response) {
        return getMediaType(response)
                .map(DISABLE_CACHE_FOR::contains)
                .orElse(false);
    }

    private Optional<MediaType> getMediaType(MutableHttpResponse<?> response) {
        return response.getContentType()
                .or(() -> response.getBody()
                        .map(body -> {
                            if (body instanceof FileCustomizableResponseType) {
                                FileCustomizableResponseType fileCustomizableResponseType = (FileCustomizableResponseType) body;
                                return fileCustomizableResponseType.getMediaType();
                            } else {
                                return null;
                            }
                        })
                );
    }

}