package com.bakuanimation.model;

import javax.annotation.Nullable;

public final class Project {
    private final String id;
    @Nullable private final String adminId;

    public Project(String id) {
        this(id, null);
    }
    public Project(String id, String adminId) {
        this.id = id;
        this.adminId = adminId;
    }

    public String getId() {
        return id;
    }

    @Nullable
    public String getAdminId() {
        return adminId;
    }

    @Override
    public String toString() {
        return "Project{" +
                "id='" + id + '\'' +
                ", adminId='" + adminId + '\'' +
                '}';
    }
}
