package com.bakuanimation.service;

import com.bakuanimation.api.IssueService;
import io.micronaut.context.annotation.Value;
import io.reactivex.Single;
import io.reactivex.schedulers.Schedulers;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Singleton;
import java.io.IOException;

@Singleton
public final class IssueServiceImpl implements IssueService {

    private static final Logger LOGGER = LoggerFactory.getLogger(IssueServiceImpl.class);

    private final GitHub github;

    public IssueServiceImpl(@Value("${application.secret.github-token}") String githubToken) throws IOException {
        github = new GitHubBuilder().withOAuthToken(githubToken).build();
    }

    @Override
    public Single<Boolean> submitIssue(String title, String body) {
        return Single.fromCallable(() -> {
            github.getRepository("BakuAnimation/baku")
                    .createIssue(title)
                    .body(body)
                    .create();
            return true;
        }).subscribeOn(Schedulers.io());


    }
}
