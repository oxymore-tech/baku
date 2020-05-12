package com.bakuanimation.rest;

import com.bakuanimation.model.AuthorizationException;
import io.micronaut.context.annotation.Requires;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.server.exceptions.ExceptionHandler;

import javax.inject.Singleton;

@Produces
@Singleton
@Requires(classes = {AuthorizationException.class, ExceptionHandler.class})
public final class AuthorizationExceptionHandler implements ExceptionHandler<AuthorizationException, HttpResponse> {

    @Override
    public HttpResponse handle(HttpRequest request, AuthorizationException exception) {
        return HttpResponse.unauthorized()
                .body(exception.getMessage());
    }
}
