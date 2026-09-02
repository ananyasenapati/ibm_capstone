package com.capstone.service;

import com.capstone.entity.AuditLog;
import com.capstone.entity.User;
import com.capstone.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(User user, String action, String entityType, Long entityId,
                    String oldValue, String newValue, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .user(user)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional
    public void log(String action, String entityType, Long entityId,
                    String oldValue, String newValue) {
        log(null, action, entityType, entityId, oldValue, newValue, null);
    }
}
