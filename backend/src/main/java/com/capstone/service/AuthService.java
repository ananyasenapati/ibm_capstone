package com.capstone.service;

import com.capstone.dto.AuthDTO;
import com.capstone.entity.SellerProfile;
import com.capstone.entity.User;
import com.capstone.repository.SellerProfileRepository;
import com.capstone.repository.UserRepository;
import com.capstone.security.JwtUtil;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       SellerProfileRepository sellerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       @Lazy AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
    }

    @Transactional
    public AuthDTO.AuthResponse registerCustomer(AuthDTO.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .status(User.UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);
        auditService.log(user, "REGISTER", "USER", user.getId(), null, "CUSTOMER", null);
        return generateTokens(user);
    }

    @Transactional
    public AuthDTO.AuthResponse registerSeller(AuthDTO.SellerRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .role(User.Role.SELLER)
                .status(User.UserStatus.PENDING_APPROVAL)
                .build();
        user = userRepository.save(user);

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .businessAddress(request.getBusinessAddress())
                .gstNumber(request.getGstNumber())
                .description(request.getDescription())
                .approvalStatus(SellerProfile.ApprovalStatus.PENDING)
                .build();
        sellerProfileRepository.save(profile);
        auditService.log(user, "SELLER_REGISTRATION", "USER", user.getId(), null, "PENDING", null);
        return generateTokens(user);
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        auditService.log(user, "LOGIN", "USER", user.getId(), null, "SUCCESS", null);
        return generateTokens(user);
    }

    public AuthDTO.AuthResponse refresh(AuthDTO.RefreshRequest request) {
        if (!jwtUtil.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("Invalid refresh token");
        }
        String email = jwtUtil.extractEmail(request.getRefreshToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return generateTokens(user);
    }

    private AuthDTO.AuthResponse generateTokens(User user) {
        AuthDTO.AuthResponse response = new AuthDTO.AuthResponse();
        response.setToken(jwtUtil.generateToken(user.getEmail()));
        response.setRefreshToken(jwtUtil.generateRefreshToken(user.getEmail()));
        response.setRole(user.getRole().name());
        response.setName(user.getName());
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setProfileImageUrl(user.getProfileImageUrl());
        return response;
    }

    @Transactional
    public void updateProfile(Long userId, AuthDTO.ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        userRepository.save(user);
    }
}
