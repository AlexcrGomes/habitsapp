package br.com.habits.notification;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Preferências de notificação da conta (spec 011, RF-004/RF-005). */
@Entity
@Table(name = "notification_settings")
public class NotificationSettings {

    public static final LocalTime DEFAULT_REMINDER = LocalTime.of(20, 0);

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "reminder_time")
    private LocalTime reminderTime = DEFAULT_REMINDER;

    @Column(name = "daily_enabled")
    private boolean dailyEnabled = true;

    @Column(name = "at_risk_enabled")
    private boolean atRiskEnabled = true;

    @Column(name = "summary_enabled")
    private boolean summaryEnabled = true;

    @Column(name = "last_daily_on")
    private LocalDate lastDailyOn;

    @Column(name = "last_at_risk_on")
    private LocalDate lastAtRiskOn;

    protected NotificationSettings() {
    }

    public NotificationSettings(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }

    public LocalTime getReminderTime() {
        return reminderTime;
    }

    public void setReminderTime(LocalTime reminderTime) {
        this.reminderTime = reminderTime;
    }

    public boolean isDailyEnabled() {
        return dailyEnabled;
    }

    public void setDailyEnabled(boolean dailyEnabled) {
        this.dailyEnabled = dailyEnabled;
    }

    public boolean isAtRiskEnabled() {
        return atRiskEnabled;
    }

    public void setAtRiskEnabled(boolean atRiskEnabled) {
        this.atRiskEnabled = atRiskEnabled;
    }

    public boolean isSummaryEnabled() {
        return summaryEnabled;
    }

    public void setSummaryEnabled(boolean summaryEnabled) {
        this.summaryEnabled = summaryEnabled;
    }

    public LocalDate getLastDailyOn() {
        return lastDailyOn;
    }

    public void setLastDailyOn(LocalDate lastDailyOn) {
        this.lastDailyOn = lastDailyOn;
    }

    public LocalDate getLastAtRiskOn() {
        return lastAtRiskOn;
    }

    public void setLastAtRiskOn(LocalDate lastAtRiskOn) {
        this.lastAtRiskOn = lastAtRiskOn;
    }
}
