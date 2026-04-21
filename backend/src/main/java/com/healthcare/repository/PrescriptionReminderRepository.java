package com.healthcare.repository;

import com.healthcare.entity.PrescriptionReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionReminderRepository extends JpaRepository<PrescriptionReminder, Long> {
    List<PrescriptionReminder> findByPatientIdAndScheduledDateOrderByScheduledTimeAsc(Long patientId, LocalDate scheduledDate);
}
