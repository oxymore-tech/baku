package com.bakuanimation.api;

import io.reactivex.Single;

public interface IssueService {
    Single<Boolean> submitIssue(String title, String body);
}
