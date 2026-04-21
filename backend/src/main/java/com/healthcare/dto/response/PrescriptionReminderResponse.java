package com.healthcare.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionReminderResponse {
    private Long id;
    private Long prescriptionId;
    private Long medicineId;
    private String medicineName;
    private String dosage;
    private String frequency;
    private String duration;
    private String prescribedBy;
    private LocalDate scheduledDate;
    private LocalTime scheduledTime;
    private Boolean isTaken;
    private LocalDateTime takenAt;
}
