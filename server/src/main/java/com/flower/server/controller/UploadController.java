package com.flower.server.controller;

import com.flower.server.common.ApiException;
import com.flower.server.service.CurrentUserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private static final Map<String, String> EXTENSIONS = Map.of("image/jpeg", ".jpg", "image/png", ".png");

    private final CurrentUserService currentUser;
    private final Path uploadDir;

    public UploadController(CurrentUserService currentUser, @Value("${app.upload-dir}") String uploadDir) {
        this.currentUser = currentUser;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath();
    }

    @PostMapping
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        currentUser.get();
        String extension = EXTENSIONS.get(file.getContentType());
        if (file.isEmpty() || extension == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ nhận ảnh JPG hoặc PNG.");
        }
        Files.createDirectories(uploadDir);
        String name = UUID.randomUUID() + extension;
        file.transferTo(uploadDir.resolve(name));
        return Map.of("url", "/uploads/" + name);
    }
}
