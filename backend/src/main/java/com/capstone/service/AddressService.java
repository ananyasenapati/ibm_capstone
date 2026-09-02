package com.capstone.service;

import com.capstone.dto.AddressDTO;
import com.capstone.entity.Address;
import com.capstone.entity.User;
import com.capstone.repository.AddressRepository;
import com.capstone.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository,
                          UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<AddressDTO.Response> getAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDTO.Response createAddress(Long userId, AddressDTO.CreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Address address = Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .country(request.getCountry() != null ? request.getCountry() : "India")
                .isDefault(request.getIsDefault() != null && request.getIsDefault())
                .build();
        address = addressRepository.save(address);
        return mapToResponse(address);
    }

    @Transactional
    public void deleteAddress(Long addressId, Long userId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        if (!address.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized");
        }
        addressRepository.delete(address);
    }

    private AddressDTO.Response mapToResponse(Address address) {
        AddressDTO.Response resp = new AddressDTO.Response();
        resp.setId(address.getId());
        resp.setFullName(address.getFullName());
        resp.setPhone(address.getPhone());
        resp.setAddressLine1(address.getAddressLine1());
        resp.setAddressLine2(address.getAddressLine2());
        resp.setCity(address.getCity());
        resp.setState(address.getState());
        resp.setPincode(address.getPincode());
        resp.setCountry(address.getCountry());
        resp.setIsDefault(address.getIsDefault());
        return resp;
    }
}
