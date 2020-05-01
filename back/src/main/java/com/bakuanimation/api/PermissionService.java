package com.bakuanimation.api;

public interface PermissionService {
    boolean hasRight(com.bakuanimation.api.Movie movie, com.bakuanimation.api.BakuEvent event);
}
