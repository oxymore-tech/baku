package com.bakuanimation.rest;

import com.bakuanimation.api.IssueService;
import com.bakuanimation.model.GithubIssue;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import io.reactivex.Single;

@Controller
public final class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @Post(value = "/api/issue")
    public Single<HttpResponse<Void>> upload(@Body GithubIssue ghIssue) {
        return issueService.submitIssue(ghIssue.getTitle(), ghIssue.getBody())
                .map(v -> HttpResponse.ok());
    }
}
