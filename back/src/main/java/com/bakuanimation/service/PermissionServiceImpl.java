package com.bakuanimation.service;

import com.bakuanimation.api.BakuEvent;
import com.bakuanimation.api.Movie;
import com.bakuanimation.api.PermissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;

@Singleton
public final class PermissionServiceImpl implements PermissionService {

    private static final Logger LOGGER = LoggerFactory.getLogger(PermissionServiceImpl.class);

    @Override
    public boolean hasRight(Movie movie, BakuEvent event) {
        return true;
    }

}
