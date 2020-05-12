package com.bakuanimation.rest;

import com.bakuanimation.model.ForbiddenOperationException;
import io.micronaut.context.annotation.Requires;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpResponseFactory;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.server.exceptions.ExceptionHandler;

import javax.inject.Singleton;

@Produces
@Singleton
@Requires(classes = {ForbiddenOperationException.class, ExceptionHandler.class})
public final class ForbiddenOperationExceptionHandler implements ExceptionHandler<ForbiddenOperationException, HttpResponse> {

    @Override
    public HttpResponse handle(HttpRequest request, ForbiddenOperationException exception) {
        return HttpResponseFactory.INSTANCE.status(HttpStatus.FORBIDDEN)
                .body(exception.getMessage());
    }
}
