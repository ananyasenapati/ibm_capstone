package com.capstone.controller;

import com.capstone.dto.CategoryDTO;
import com.capstone.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO.Response>> getActiveCategories() {
        return ResponseEntity.ok(categoryService.getActiveCategories());
    }
}
