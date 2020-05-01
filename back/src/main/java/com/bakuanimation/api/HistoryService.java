package com.bakuanimation.api;

import io.reactivex.Single;

public interface HistoryService {
    Single<Boolean> addStack(String projectId, byte[] stack);

    Single<com.bakuanimation.api.Movie> interpretHistory(String projectId);
}
