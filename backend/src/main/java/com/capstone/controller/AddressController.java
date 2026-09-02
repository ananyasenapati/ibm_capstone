package com.capstone.controller;

import com.capstone.dto.AddressDTO;
import com.capstone.entity.User;
import com.capstone.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<AddressDTO.Response>> getAddresses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(addressService.getAddresses(user.getId()));
    }

    @PostMapping
    public ResponseEntity<AddressDTO.Response> createAddress(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AddressDTO.CreateRequest request) {
        return ResponseEntity.ok(addressService.createAddress(user.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        addressService.deleteAddress(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
