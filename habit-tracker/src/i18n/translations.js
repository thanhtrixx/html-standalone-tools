/**
 * Atomic Habit Tracker Bilingual Dictionary & Localization Formatters
 *
 * Implements 100% key parity between English ('en') and Vietnamese ('vi')
 * per habit-tracker/I18N.md.
 */

(function (global) {
  "use strict";

  const TRANSLATIONS = {
    en: {
      // App Header & Branding
      app_title: "Atomic Habit & Routine Tracker",
      app_tagline:
        "Build lasting routines with atomic habits and anti-guilt consistency",
      today_tab: "Today",
      insights_tab: "Insights",
      manager_tab: "Habits",
      habits_tab: "Habits",
      settings_tab: "Settings",

      // 4 Perspective Lenses
      lens_today: "Today",
      lens_timeline: "Timeline",
      lens_matrix: "Matrix",
      lens_identity: "Identity",

      // Life Domains
      domain_health: "Health & Vitality",
      domain_craft: "Deep Work & Craft",
      domain_mind: "Mind & Wisdom",
      domain_discipline: "Daily Discipline",
      domain_all: "All Domains",

      // Starter Kits
      starter_kits_title: "Curated Starter Kits",
      starter_kits_subtitle: "Activate a proven habit system in 1 tap",
      carousel_prev_kits: "Previous starter kits",
      carousel_next_kits: "Next starter kits",
      identity_pillars_title: "4 Core Life Pillars",
      identity_pillars_subtitle:
        "Balance personal growth using the Atomic Habits framework",
      domain_habits_count: "{count} habits",
      domain_habits_count_singular: "1 habit",
      sw_update_title: "New Version Available",
      sw_update_desc: "Click update to apply the latest improvements.",
      sw_update_btn: "Update",
      toast_habit_name_required: "Please enter a habit name",
      wizard_step_4_blank_title: "Start with a Blank Slate",
      wizard_step_4_blank_desc:
        "You haven't selected any starter packs. You will start with an empty board and create your custom atomic habits.",
      wizard_step_4_blank_hint_title: "Custom Habit Formation",
      wizard_step_4_blank_hint_desc:
        "Click Launch to jump directly into your daily action board.",
      starter_morning_mastery_title: "Morning Mastery",
      starter_morning_mastery_desc:
        "Hydration, mindfulness, light stretching and daily focus.",
      starter_deep_focus_title: "Deep Focus & Flow",
      starter_deep_focus_desc:
        "45-min deep work blocks, reading 20 pages, and distraction shielding.",
      starter_health_vitality_title: "Health & Vitality",
      starter_health_vitality_desc:
        "2500ml water intake, 30-min exercise, and consistent sleep schedule.",
      starter_zen_mindfulness_title: "Zen & Mindfulness",
      starter_zen_mindfulness_desc:
        "Gratitude journal, nature walk, and digital sunset.",
      starter_fitness_strength_title: "Fitness & Strength",
      starter_fitness_strength_desc:
        "Strength training, 100g daily protein, and 10,000 active steps.",
      starter_lifelong_learning_title: "Lifelong Learning",
      starter_lifelong_learning_desc:
        "30-min skill practice, daily knowledge notes, and educational podcasts.",
      starter_financial_discipline_title: "Financial Discipline",
      starter_financial_discipline_desc:
        "Log daily expenses, avoid impulse purchases, and review savings goals.",
      starter_sleep_recovery_title: "Sleep & Recovery",
      starter_sleep_recovery_desc:
        "8-hour restorative sleep, warm evening relaxation, and zero late caffeine.",
      apply_starter_kit: "Activate Kit",
      starter_kit_applied_toast: "Starter kit activated successfully!",

      // Routine Clusters
      routine_morning: "Morning",
      routine_morning_time: "05:00 – 12:00",
      routine_afternoon: "Afternoon",
      routine_afternoon_time: "12:00 – 17:00",
      routine_evening: "Evening",
      routine_evening_time: "17:00 – 23:00",
      routine_anytime: "Anytime",
      routine_anytime_time: "Flexible",

      // Streaks & Metrics
      current_streak: "Current Streak",
      best_streak: "Best Streak",
      consistency_score: "30-Day Consistency Score",
      consistency_score_90d: "90-Day Consistency Score",
      freeze_token: "Streak Freeze Token",
      freeze_tokens_left: "{count} freeze tokens left",
      freeze_applied: "Streak Freeze Applied",
      daily_progress: "Daily Progress",
      total_completions: "Total Completions",
      perfect_days: "Perfect 100% Days",
      streak_days_count: "{count} days streak",
      streak_fire_badge: "{count}d 🔥",

      // Habit Types
      type_binary: "Binary (Yes/No)",
      type_numeric: "Numeric Counter",
      type_timer: "Duration / Timer",

      // Scheduling & Frequency
      freq_daily: "Every Day",
      freq_specific_days: "Specific Days of Week",
      freq_flexible: "Flexible Weekly Target",
      freq_interval: "Repeat Interval",
      vacation_pause_mode: "Vacation / Sick Pause",
      vacation_active_badge: "Paused (Vacation/Sick)",

      // Today Dashboard Actions & Feedback
      swipe_to_complete: "Swipe right to complete",
      swipe_to_details: "Swipe left for details & notes",
      tap_to_increment: "Tap + to log progress",
      daily_congrats_title: "Outstanding! 100% Day Completed!",
      daily_congrats_desc:
        "All your scheduled habits for today are completed. Keep up the great momentum!",
      no_habits_scheduled_today: "No habits scheduled for this day.",
      add_first_habit: "Add your first habit",
      empty_state_wizard_btn: "Identity Setup Wizard",
      empty_state_manual_btn: "Add Habit",

      // Habit Detail Bottom Sheet
      habit_details: "Habit Deep-Dive",
      streak_history: "Streak History",
      mini_heatmap_365: "365-Day Activity Grid",
      checkin_logs: "Historical Logs",
      checkin_notes: "Reflection Notes",
      add_note_placeholder: "Add a reflection note for this check-in...",
      save_note: "Save Note",
      delete_note: "Delete Note",
      note_saved: "Reflection note saved",
      timer_start: "Start",
      timer_pause: "Pause",
      timer_reset: "Reset",
      timer_completed: "Timer completed!",

      // Manager View
      add_habit: "Add Habit",
      edit_habit: "Edit Habit",
      habit_name_label: "Habit Name",
      habit_name_placeholder: "e.g., Morning Meditation, Drink 2L Water",
      habit_type_label: "Measurement Type",
      target_value_label: "Daily Target",
      target_unit_label: "Unit of Measurement",
      step_delta_label: "Step Increment (+ / -)",
      routine_label: "Time-of-Day Routine",
      schedule_label: "Frequency Schedule",
      color_theme_label: "Color Theme",
      icon_emoji_label: "Icon / Emoji",
      reminder_time_label: "Daily Reminder Time",
      archive_habit: "Archive Habit",
      restore_habit: "Restore Habit",
      delete_habit: "Delete Habit",
      confirm_delete_habit:
        "Are you sure you want to permanently delete this habit? Historical logs will be removed.",
      habit_saved: "Habit saved successfully",
      habit_archived: "Habit archived",
      habit_deleted: "Habit deleted",

      // Insights & Heatmap View
      yearly_heatmap_title: "52-Week Contribution Heatmap",
      heatmap_subtitle: "52-week activity and daily adherence momentum",
      weekday_adherence_title: "Day of Week Consistency",
      routine_adherence_title: "Routine Cluster Adherence",
      milestones_title: "Streak Milestone Badges",
      milestone_7d: "7-Day Seedling",
      milestone_21d: "21-Day Habit Spark",
      milestone_30d: "30-Day Fire Builder",
      milestone_66d: "66-Day Brain Wire",
      milestone_100d: "100-Day Master",
      milestone_365d: "365-Day Habit Legend",
      heatmap_less: "Less",
      heatmap_more: "More",

      // Settings & Appearance
      settings_title: "Settings & Cloud Sync",
      theme_select: "Theme & Appearance",
      theme_mode: "Theme Mode",
      theme_dark: "Dark (OLED)",
      theme_light: "Light",
      theme_system: "System",
      language_select: "Language",
      freeze_tokens_desc: "Automatically protect streak during busy days",
      vacation_mode_desc: "Freeze active streak during long trips or recovery",
      vacation_active_btn: "Paused ⏸️",
      vacation_inactive_btn: "Pause Mode ✈️",
      cloud_backup_title: "Cloud Backup & Sync",
      cloud_backup: "Encrypted Cloud Backup",
      cloud_connected: "Connected",
      cloud_not_connected: "Not configured",
      export_import_title: "Export & Import Data",
      export_json_btn: "Export JSON File",
      import_json_btn: "Import JSON File",
      btn_copy_json: "Copy JSON",
      btn_paste_json: "Paste JSON",
      btn_export_file_json: "Save File",
      btn_open_file_json: "Open File",
      paste_json_modal_title: "Paste JSON Data",
      paste_json_modal_desc:
        "Paste your JSON backup payload from clipboard or text below.",
      paste_from_clipboard_btn: "Paste from Clipboard",
      paste_json_placeholder: "Paste JSON backup text here...",
      paste_json_inspect_btn: "Inspect & Preview",
      copy_fallback_modal_title: "Copy JSON Payload",
      copy_fallback_modal_desc:
        "Automatic clipboard write is restricted in this browser. Please select all and copy manually.",
      copy_select_all_btn: "Select All",
      copy_done_btn: "Done",
      check_updates_btn: "Check for Updates",
      purge_cache_btn: "Purge Cache & Reload",
      pwa_version: "PWA Version",
      export_json: "Export Data (JSON)",
      import_json: "Import Data (JSON)",
      import_confirm:
        "Do you want to merge imported habits with existing data, or replace everything?",
      import_merge: "Merge with Existing",
      import_replace: "Replace All",
      import_success: "Data imported successfully!",
      import_preview_title: "Import Data Preview",
      import_preview_desc:
        "Review backup file content and select import strategy below.",
      import_stat_habits: "Habits",
      import_stat_logs: "Check-in Logs",
      import_stat_date_range: "Date Span",
      import_stat_settings: "Settings",
      import_stat_new: "new",
      import_stat_existing: "existing",
      import_strategy_title: "Select Import Strategy",
      import_strategy_merge_title: "Merge & Combine (Safe Additive)",
      import_strategy_merge_desc:
        "Combines habits and logs additively. No existing records will be deleted.",
      import_strategy_replace_title: "Replace Entire Database (Clean Restore)",
      import_strategy_replace_desc:
        "Wipes all current data and restores the exact state from this backup.",
      import_snapshot_notice:
        "🛡️ A rollback safety snapshot will be automatically created before importing.",
      import_confirm_btn: "Confirm & Import Data",
      import_cancel_btn: "Cancel",
      import_no_date_span: "No logs recorded",
      data_portability_card_title: "Data Portability & File Exchange",
      data_portability_card_desc:
        "1-click Clipboard copy/paste and lossless JSON file backup",
      snapshot_history_title: "Safety Snapshot History",
      snapshot_history_desc:
        "Rolling automated and manual snapshots for 1-click database rollback",
      create_snapshot_btn: "Create Snapshot",
      snapshot_restore_btn: "Restore",
      no_snapshots_yet: "No safety snapshots recorded yet",
      snap_reason_import: "Pre-Import",
      snap_reason_sync: "Pre-Sync",
      snap_reason_manual: "Manual",
      storage_breakdown_title: "Storage & Statistics",
      toast_snapshot_created: "Safety snapshot created successfully!",
      toast_snapshot_restored: "State restored from safety snapshot!",
      export_success: "JSON backup downloaded",
      cloud_sync_now: "Sync Now",
      cloud_syncing: "Syncing...",
      cloud_synced_just_now: "Synced just now",
      cloud_synced_ago: "Synced {time} ago",
      cloud_auto_sync: "Auto-Sync on Changes",
      cloud_gist_title: "GitHub Gist Cloud Sync",
      cloud_gist_desc: "Sync across devices via private GitHub Gist",
      cloud_drive_title: "Google Drive Cloud Sync",
      cloud_drive_desc: "Sync across devices via Google Drive AppData",
      gist_modal_title: "Configure GitHub Gist Sync",
      gist_modal_desc:
        "Enter your GitHub Personal Access Token (with 'gist' scope). Your habits and focus logs will be stored in a private secret Gist.",
      gist_token_label: "GitHub Personal Access Token (PAT)",
      gist_id_label: "Gist ID (Optional / Auto-generated)",
      gist_save_btn: "Save & Connect",
      gist_disconnect_btn: "Disconnect",
      gist_test_btn: "Test Connection",
      drive_modal_title: "Configure Google Drive Sync",
      drive_modal_desc:
        "Connect your Google account to sync habits to your private Google Drive AppData folder.",
      drive_client_id_label: "Google OAuth 2.0 Client ID",
      drive_connect_btn: "Sign in with Google",
      drive_disconnect_btn: "Disconnect Account",
      toast_sync_success: "Cloud synchronization completed successfully!",
      toast_sync_error: "Cloud sync failed: {message}",
      toast_gist_connected: "Connected to GitHub Gist successfully!",
      toast_gist_disconnected: "Disconnected from GitHub Gist.",
      toast_drive_connected: "Connected to Google Drive successfully!",
      toast_drive_disconnected: "Disconnected from Google Drive.",
      vault_encryption_title: "Zero-Knowledge Vault Encryption",
      vault_encryption_desc:
        "Encrypt cloud backups and exports with AES-GCM-256 before upload",
      vault_encrypt_toggle: "Encrypt with Passphrase",
      vault_status_unlocked: "Vault Unlocked (Session Active)",
      vault_status_locked: "Vault Locked (Passphrase Required)",
      vault_unlock_title: "Unlock Encrypted Habit Vault",
      vault_unlock_desc:
        "Your remote cloud state is protected with zero-knowledge AES-GCM-256 encryption. Enter your secret passphrase to decrypt and sync.",
      vault_passphrase_label: "Secret Vault Passphrase",
      vault_passphrase_placeholder: "Enter your encryption passphrase",
      vault_unlock_btn: "Unlock Vault",
      vault_lock_btn: "Lock Vault",
      vault_setup_title: "Set Vault Passphrase",
      vault_setup_desc:
        "Choose a strong secret passphrase. If lost, your encrypted remote backup cannot be recovered.",
      vault_error_wrong_pass: "Incorrect passphrase. Decryption failed.",
      vault_error_locked:
        "Encrypted vault is locked. Passphrase required to sync.",
      toast_vault_unlocked: "Vault unlocked successfully for this session!",
      toast_vault_locked: "Vault locked. Ephemeral key cleared from memory.",
      toast_vault_encryption_enabled: "Vault encryption enabled!",
      toast_vault_encryption_disabled: "Vault encryption disabled.",

      // System Toasts & Dialogs
      toast_backup_exported: "Backup JSON file exported successfully!",
      toast_json_copied: "JSON backup copied to clipboard!",
      toast_clipboard_read_error: "Clipboard read failed: {message}",
      toast_clipboard_copy_error: "Clipboard copy failed: {message}",
      toast_habit_deleted: "Habit deleted successfully",
      toast_notes_saved: "Journal note saved successfully!",
      toast_habit_archived: "Habit archived successfully",
      toast_habit_restored: "Habit restored successfully",
      toast_gist_pat_required:
        "GitHub Gist Sync: Please configure PAT Token in Settings",
      toast_drive_auth_required:
        "Google Drive Sync: Please connect Google Drive account in Settings",
      toast_update_checked: "Checked for latest updates.",
      toast_press_back_again: "Press back again to exit",
      delete_confirm_msg:
        "Are you sure you want to permanently delete this habit? Historical logs will be deleted.",
      toast_habit_saved: "Habit saved successfully!",
      toast_habit_updated: "Habit updated successfully!",
      toast_freeze_token_added: "Added {count} streak freeze tokens!",
      toast_vacation_enabled: "Vacation mode enabled.",
      toast_vacation_disabled: "Vacation mode disabled.",
      toast_import_success: "Data imported successfully!",
      toast_import_file_error: "File error: {errors}",
      toast_import_error: "Import error: {message}",
      undo: "Undo",
      undo_action: "Undo",
      move_up: "Move Up",
      move_down: "Move Down",
      toast_habit_restored: "Habit restored",
      quick_emoji_presets: "Preset Emojis",
      select_emoji_preset: "Preset Emojis",
      toast_habit_completed: "Habit completed",
      toast_habit_incremented: "Progress updated",
      toast_undo_success: "Action undone",
      preview_label: "Live Preview",
      reminders_notifications_title: "Daily Reminders & Notifications",
      reminders_notifications_desc:
        "Receive local alerts when it is time to complete your scheduled habits",
      perm_granted: "Enabled",
      perm_denied: "Blocked",
      perm_default: "Not enabled",
      enable_notifications_btn: "Enable Notifications",
      send_test_notification_btn: "Send Test Alert",
      toast_notification_test_sent: "Test notification sent!",
      toast_notifications_enabled: "Daily reminders enabled!",
      toast_notifications_blocked:
        "Notifications are blocked in browser permissions.",
      delete_confirm_title: "Delete Habit",
      delete_confirm_desc:
        'Are you sure you want to permanently delete "{name}"? Historical check-in logs will be permanently removed.',
      delete_confirm_btn: "Delete",
      delete_cancel_btn: "Cancel",
      jump_to_timer: "Active Timer",

      // Data Vault & Clean Data
      data_vault_title: "Data Hygiene & Vault Reset",
      data_vault_desc:
        "Manage storage, reset to starter habits, or purge all local data",
      reset_defaults_btn: "Reset to Sample Habits",
      reset_defaults_desc:
        "Clear historical logs and restore the 3 starter habits",
      factory_wipe_btn: "Complete Factory Wipe",
      factory_wipe_desc:
        "Permanently erase all habits, logs, and settings to empty state",
      reset_confirm_title: "Reset to Sample Habits",
      reset_confirm_desc:
        "Are you sure you want to restore the 3 starter habits? All custom habits and history logs will be cleared.",
      factory_wipe_confirm_title: "Complete Factory Wipe",
      factory_wipe_confirm_desc:
        "WARNING: This will permanently erase all habits, historical check-in logs, and settings. This action cannot be undone!",
      toast_reset_defaults_success: "Starter habits restored successfully!",
      toast_factory_wipe_success: "All application data wiped successfully!",
      reset_confirm_btn: "Reset Data",
      factory_wipe_confirm_btn: "Factory Wipe",
      habits_subview_catalog: "Habit Catalog",
      habits_subview_identity: "Identity & Starter Kits",
      modal_stage_1_title: "1. Basic Ritual",
      modal_stage_2_title: "2. Schedule & Theme",
      modal_btn_quick_save: "Quick Save",
      modal_btn_next_stage: "Next: Schedule ➔",
      modal_btn_prev_stage: "◀ Back",
      change_emoji: "Change Icon",
      more_actions: "More Actions",
      close: "Close",

      // Timer Enhancements
      timer_running: "Running",
      timer_paused: "Paused",
      timer_reset: "Reset",
      timer_pause: "Pause",
      timer_resume: "Resume",
      toast_timer_reset: "Timer reset to 0",
      toast_timer_session_expired:
        "Timer session reached maximum 12-hour limit and was saved",
      minutes_unit: "mins",
      focus_timer_title: "Focus Session",
      focus_timer_remaining: "Remaining",
      focus_timer_elapsed: "Elapsed",
      focus_timer_overtime: "Overtime Focus",
      focus_timer_target: "Target: {target}",
      focus_timer_start: "Start Focus",
      focus_timer_pause: "Pause Focus",
      focus_timer_reset: "Reset Timer",
      focus_timer_sound_on: "Sound On",
      focus_timer_sound_off: "Sound Off",
      focus_timer_adjust_plus1: "+1m",
      focus_timer_adjust_plus5: "+5m",
      focus_timer_adjust_minus1: "-1m",

      // Detail Sheet
      edit_habit_shortcut: "Edit Habit",
      archive_habit_shortcut: "Archive",
      schedule_rule_label: "Schedule Rule",
      today_progress_label: "Today Progress",

      // Days of week
      day_sun: "Sun",
      day_mon: "Mon",
      day_tue: "Tue",
      day_wed: "Wed",
      day_thu: "Thu",
      day_fri: "Fri",
      day_sat: "Sat",

      // Full Days
      day_sunday: "Sunday",
      day_monday: "Monday",
      day_tuesday: "Tuesday",
      day_wednesday: "Wednesday",
      day_thursday: "Thursday",
      day_friday: "Friday",
      day_saturday: "Saturday",

      // Identity Setup Wizard
      wizard_title: "Identity Setup Wizard",
      wizard_subtitle: "Build your personal habit system in 4 simple steps",
      wizard_step_lang_title: "Choose Your Language",
      wizard_step_lang_desc:
        "Select your preferred interface language. You can change this anytime in Settings.",
      wizard_lang_vi_title: "Tiếng Việt",
      wizard_lang_vi_desc: "Giao diện và tên thói quen tiếng Việt",
      wizard_lang_en_title: "English",
      wizard_lang_en_desc: "English interface and atomic habit kits",
      wizard_step_1_title: "Core Life Pillars",
      wizard_step_1_desc:
        "Ground your habits in 4 foundational domains: Health, Mind, Craft, and Discipline.",
      wizard_step_2_title: "1-Click Starter Kits",
      wizard_step_2_desc:
        "Choose a curated kit or adopt starter habits designed by behavioral science.",
      wizard_step_3_title: "Ready to Build Atomic Habits",
      wizard_step_3_desc:
        "Your system is primed. Small 1% improvements create massive compounding results.",
      wizard_btn_next: "Next ➔",
      wizard_btn_back: "Back",
      wizard_btn_finish: "Start Tracking Today 🔥",
      wizard_btn_skip: "Skip Wizard",
      open_identity_wizard: "Launch Setup Wizard",
      wizard_domain_health_desc: "Physical energy, hydration, exercise, sleep",
      wizard_domain_mind_desc: "Mental clarity, reading, mindfulness, focus",
      wizard_domain_craft_desc: "Deep work, coding, writing, key projects",
      wizard_domain_discipline_desc:
        "Daily adherence, routine consistency, tracking",

      // Actions
      cancel: "Cancel",
      save: "Save",
      close: "Close",
      done: "Done",
      completed: "Completed",
      pending: "Pending",
      edit: "Edit",
      delete: "Delete",
      clear: "Clear",
    },

    vi: {
      // App Header & Branding
      app_title: "Theo Dõi Thói Quen Hàng Ngày",
      app_tagline:
        "Xây dựng lộ trình bền vững với thói quen nguyên tử và chỉ số kiên trì",
      today_tab: "Hôm nay",
      insights_tab: "Thống kê",
      manager_tab: "Thói quen",
      habits_tab: "Thói quen",
      settings_tab: "Cài đặt",

      // 4 Perspective Lenses
      lens_today: "Hôm nay",
      lens_timeline: "Lịch trình",
      lens_matrix: "Ma trận",
      lens_identity: "Bản sắc",

      // Life Domains
      domain_health: "Sức khỏe & Sinh lực",
      domain_craft: "Tập trung & Sự nghiệp",
      domain_mind: "Tâm trí & Trí tuệ",
      domain_discipline: "Kỷ luật & Nề nếp",
      domain_all: "Tất cả",

      // Starter Kits
      starter_kits_title: "Gói thói quen khởi động",
      starter_kits_subtitle: "Kích hoạt hệ thống thói quen chỉ với 1 chạm",
      carousel_prev_kits: "Xem gói trước",
      carousel_next_kits: "Xem gói tiếp theo",
      identity_pillars_title: "4 Trụ Cột Bản Sắc",
      identity_pillars_subtitle:
        "Cân bằng phát triển bản thân theo phương pháp Atomic Habits",
      domain_habits_count: "{count} thói quen",
      domain_habits_count_singular: "1 thói quen",
      sw_update_title: "Phiên bản mới đã sẵn sàng",
      sw_update_desc: "Nhấn cập nhật để áp dụng phiên bản mới nhất.",
      sw_update_btn: "Cập nhật",
      toast_habit_name_required: "Vui lòng nhập tên thói quen",
      wizard_step_4_blank_title: "Bắt đầu với bảng trắng",
      wizard_step_4_blank_desc:
        "Bạn chưa chọn gói thói quen nào. Bạn sẽ bắt đầu với danh sách trống và tự tạo thói quen theo nhu cầu riêng.",
      wizard_step_4_blank_hint_title: "Tự do xây dựng lộ trình cá nhân",
      wizard_step_4_blank_hint_desc:
        "Nhấn Bắt đầu ngay để chuyển đến bảng theo dõi hàng ngày.",
      starter_morning_mastery_title: "Khởi đầu tỉnh thức",
      starter_morning_mastery_desc:
        "Uống nước, thiền định, giãn cơ và lập kế hoạch ngày.",
      starter_deep_focus_title: "Tập trung sâu & Dòng chảy",
      starter_deep_focus_desc:
        "Khối làm việc 45 phút, đọc 20 trang sách và chặn mạng xã hội.",
      starter_health_vitality_title: "Sức khỏe & Sinh lực",
      starter_health_vitality_desc:
        "Uống 2500ml nước, tập luyện 30 phút và ngủ đúng giờ.",
      starter_zen_mindfulness_title: "Tĩnh tâm & An lạc",
      starter_zen_mindfulness_desc:
        "Nhật ký biết ơn, đi bộ thư giãn và tắt màn hình buổi tối.",
      starter_fitness_strength_title: "Thể hình & Sức mạnh",
      starter_fitness_strength_desc:
        "Tập luyện sức mạnh, bổ sung protein và duy trì 10.000 bước chân.",
      starter_lifelong_learning_title: "Học tập & Tri thức",
      starter_lifelong_learning_desc:
        "Rèn luyện kỹ năng mới, đúc kết kiến thức và nghe podcast giáo dục.",
      starter_financial_discipline_title: "Quản lý Tài chính",
      starter_financial_discipline_desc:
        "Ghi chép chi tiêu, kiềm chế mua sắm bốc đồng và kiểm tra quỹ tiết kiệm.",
      starter_sleep_recovery_title: "Giấc ngủ & Phục hồi",
      starter_sleep_recovery_desc:
        "Ngủ đủ 8 tiếng, ngâm chân thư giãn và cắt giảm caffeine sau 14h.",
      apply_starter_kit: "Kích hoạt gói",
      starter_kit_applied_toast: "Đã kích hoạt gói thói quen thành công!",

      // Routine Clusters
      routine_morning: "Buổi sáng",
      routine_morning_time: "05:00 – 12:00",
      routine_afternoon: "Buổi chiều",
      routine_afternoon_time: "12:00 – 17:00",
      routine_evening: "Buổi tối",
      routine_evening_time: "17:00 – 23:00",
      routine_anytime: "Linh hoạt",
      routine_anytime_time: "Tự do",

      // Streaks & Metrics
      current_streak: "Chuỗi liên tục hiện tại",
      best_streak: "Kỷ lục chuỗi dài nhất",
      consistency_score: "Độ kiên trì 30 ngày",
      consistency_score_90d: "Độ kiên trì 90 ngày",
      freeze_token: "Vé bảo lưu chuỗi",
      freeze_tokens_left: "Còn {count} vé bảo lưu",
      freeze_applied: "Đã dùng vé bảo lưu chuỗi",
      daily_progress: "Tiến độ trong ngày",
      total_completions: "Tổng lượt hoàn thành",
      perfect_days: "Số ngày đạt 100%",
      streak_days_count: "Chuỗi {count} ngày",
      streak_fire_badge: "{count} ngày 🔥",

      // Habit Types
      type_binary: "Có / Không (Hoàn thành)",
      type_numeric: "Bộ đếm số lượng",
      type_timer: "Hẹn giờ thời lượng",

      // Scheduling & Frequency
      freq_daily: "Mỗi ngày",
      freq_specific_days: "Các ngày cố định trong tuần",
      freq_flexible: "Mục tiêu linh hoạt theo tuần",
      freq_interval: "Cách quãng mỗi N ngày",
      vacation_pause_mode: "Tạm dừng (Nghỉ phép / Ốm)",
      vacation_active_badge: "Đang tạm dừng (Nghỉ phép/Ốm)",

      // Today Dashboard Actions & Feedback
      swipe_to_complete: "Vuốt sang phải để hoàn thành",
      swipe_to_details: "Vuốt sang trái xem chi tiết & nhật ký",
      tap_to_increment: "Chạm + để ghi nhận tiến độ",
      daily_congrats_title: "Tuyệt vời! Đã hoàn thành 100% ngày hôm nay!",
      daily_congrats_desc:
        "Tất cả thói quen hôm nay đã hoàn tất. Hãy giữ vững phong độ nhé!",
      no_habits_scheduled_today:
        "Không có thói quen nào được lên lịch cho ngày này.",
      add_first_habit: "Thêm thói quen đầu tiên",
      empty_state_wizard_btn: "Thiết lập Bản Sắc (Wizard)",
      empty_state_manual_btn: "Thêm thói quen",

      // Habit Detail Bottom Sheet
      habit_details: "Chi tiết thói quen",
      streak_history: "Lịch sử chuỗi",
      mini_heatmap_365: "Biểu đồ 365 ngày",
      checkin_logs: "Lịch sử ghi nhận",
      checkin_notes: "Ghi chú nhật ký",
      add_note_placeholder: "Thêm ghi chú nhật ký cho lần hoàn thành này...",
      save_note: "Lưu ghi chú",
      delete_note: "Xóa ghi chú",
      note_saved: "Đã lưu ghi chú nhật ký",
      timer_start: "Bắt đầu",
      timer_pause: "Tạm dừng",
      timer_reset: "Đặt lại",
      timer_completed: "Đã hết giờ!",

      // Manager View
      add_habit: "Thêm thói quen",
      edit_habit: "Sửa thói quen",
      habit_name_label: "Tên thói quen",
      habit_name_placeholder: "VD: Thiền buổi sáng, Uống 2L nước, Đọc sách",
      habit_type_label: "Đơn vị đo lường",
      target_value_label: "Mục tiêu mỗi ngày",
      target_unit_label: "Đơn vị tính",
      step_delta_label: "Mỗi lần tăng giảm (+ / -)",
      routine_label: "Khung giờ trong ngày",
      schedule_label: "Lịch lặp lại",
      color_theme_label: "Màu chủ đạo",
      icon_emoji_label: "Biểu tượng / Emoji",
      reminder_time_label: "Giờ nhắc nhở mỗi ngày",
      archive_habit: "Lưu trữ thói quen",
      restore_habit: "Khôi phục thói quen",
      delete_habit: "Xóa thói quen",
      confirm_delete_habit:
        "Bạn có chắc chắn muốn xóa vĩnh viễn thói quen này? Toàn bộ lịch sử sẽ bị xóa.",
      habit_saved: "Đã lưu thói quen thành công",
      habit_archived: "Đã lưu trữ thói quen",
      habit_deleted: "Đã xóa thói quen",

      // Insights & Heatmap View
      yearly_heatmap_title: "Biểu đồ đóng góp 52 tuần",
      heatmap_subtitle: "Mức độ kiên trì và hoạt động hàng ngày trong 52 tuần",
      weekday_adherence_title: "Độ kiên trì theo ngày trong tuần",
      routine_adherence_title: "Tỷ lệ hoàn thành theo khung giờ",
      milestones_title: "Huy hiệu cột mốc chuỗi",
      milestone_7d: "Mầm Xanh 7 Ngày",
      milestone_21d: "Tia Lửa 21 Ngày",
      milestone_30d: "Lửa Bền Bỉ 30 Ngày",
      milestone_66d: "Khắc Sâu Thói Quen 66 Ngày",
      milestone_100d: "Bậc Thầy 100 Ngày",
      milestone_365d: "Huyền Thoại 365 Ngày",
      heatmap_less: "Ít",
      heatmap_more: "Nhiều",

      // Settings & Appearance
      settings_title: "Cài đặt & Sao lưu",
      theme_select: "Giao diện",
      theme_mode: "Giao diện",
      theme_dark: "Tối (OLED)",
      theme_light: "Sáng",
      theme_system: "Hệ thống",
      language_select: "Ngôn ngữ",
      freeze_tokens_desc: "Tự động bảo lưu chuỗi khi bận rộn",
      vacation_mode_desc: "Đóng băng chuỗi cho kỳ nghỉ dài",
      vacation_active_btn: "Đang tạm dừng ⏸️",
      vacation_inactive_btn: "Bật tạm dừng ✈️",
      cloud_backup_title: "Sao lưu đám mây",
      cloud_backup: "Sao lưu đám mây mã hóa",
      cloud_connected: "Đã liên kết",
      cloud_not_connected: "Chưa thiết lập",
      export_import_title: "Xuất & Nhập dữ liệu",
      export_json_btn: "Xuất tệp JSON",
      import_json_btn: "Nhập tệp JSON",
      btn_copy_json: "Sao chép JSON",
      btn_paste_json: "Dán JSON",
      btn_export_file_json: "Lưu tệp",
      btn_open_file_json: "Mở tệp",
      paste_json_modal_title: "Dán dữ liệu JSON",
      paste_json_modal_desc:
        "Dán mã JSON sao lưu từ bộ nhớ tạm hoặc nhập văn bản bên dưới.",
      paste_from_clipboard_btn: "Dán từ bộ nhớ tạm",
      paste_json_placeholder: "Dán nội dung JSON sao lưu vào đây...",
      paste_json_inspect_btn: "Kiểm tra & Xem trước",
      copy_fallback_modal_title: "Sao chép mã JSON",
      copy_fallback_modal_desc:
        "Trình duyệt giới hạn ghi bộ nhớ tạm tự động. Vui lòng chọn tất cả và sao chép thủ công.",
      copy_select_all_btn: "Chọn tất cả",
      copy_done_btn: "Xong",
      check_updates_btn: "Kiểm tra bản cập nhật",
      purge_cache_btn: "Xóa bộ nhớ đệm & Tải lại",
      pwa_version: "Phiên bản PWA",
      export_json: "Xuất dữ liệu (JSON)",
      import_json: "Nhập dữ liệu (JSON)",
      import_confirm:
        "Bạn muốn gộp dữ liệu nhập với dữ liệu hiện tại hay ghi đè toàn bộ?",
      import_merge: "Gộp với dữ liệu cũ",
      import_replace: "Ghi đè tất cả",
      import_success: "Nhập dữ liệu thành công!",
      import_preview_title: "Xem trước dữ liệu nhập",
      import_preview_desc:
        "Kiểm tra nội dung tệp sao lưu và chọn phương thức nhập bên dưới.",
      import_stat_habits: "Thói quen",
      import_stat_logs: "Nhật ký điểm danh",
      import_stat_date_range: "Khoảng thời gian",
      import_stat_settings: "Cài đặt",
      import_stat_new: "mới",
      import_stat_existing: "đã có",
      import_strategy_title: "Chọn phương thức nhập",
      import_strategy_merge_title:
        "Gộp dữ liệu (An toàn, giữ nguyên dữ liệu cũ)",
      import_strategy_merge_desc:
        "Bổ sung thói quen và nhật ký vào dữ liệu hiện có. Không xóa dữ liệu cũ.",
      import_strategy_replace_title: "Ghi đè toàn bộ (Khôi phục nguyên trạng)",
      import_strategy_replace_desc:
        "Xóa dữ liệu hiện tại và khôi phục chính xác trạng thái từ tệp sao lưu này.",
      import_snapshot_notice:
        "🛡️ Bản sao lưu an toàn sẽ tự động được tạo trước khi nhập để có thể hoàn tác.",
      import_confirm_btn: "Xác nhận & Nhập dữ liệu",
      import_cancel_btn: "Hủy",
      import_no_date_span: "Chưa có nhật ký",
      data_portability_card_title: "Xuất & Nhập dữ liệu",
      data_portability_card_desc:
        "Sao chép/dán JSON 1 chạm qua bộ nhớ tạm hoặc sao lưu tệp JSON không mất mát dữ liệu",
      snapshot_history_title: "Lịch sử điểm khôi phục an toàn",
      snapshot_history_desc:
        "Các điểm sao lưu tự động và thủ công để hoàn tác 1 chạm khi cần",
      create_snapshot_btn: "Tạo bản sao lưu",
      snapshot_restore_btn: "Khôi phục",
      no_snapshots_yet: "Chưa có bản sao lưu nào",
      snap_reason_import: "Trước khi nhập",
      snap_reason_sync: "Trước đồng bộ",
      snap_reason_manual: "Thủ công",
      storage_breakdown_title: "Dung lượng & Thống kê",
      toast_snapshot_created: "Đã tạo bản sao lưu an toàn thành công!",
      toast_snapshot_restored:
        "Đã khôi phục trạng thái từ bản sao lưu thành công!",
      export_success: "Đã tải về bản sao lưu JSON",
      cloud_sync_now: "Đồng bộ ngay",
      cloud_syncing: "Đang đồng bộ...",
      cloud_synced_just_now: "Vừa đồng bộ xong",
      cloud_synced_ago: "Đã đồng bộ {time} trước",
      cloud_auto_sync: "Tự động đồng bộ khi thay đổi",
      cloud_gist_title: "Đồng bộ qua GitHub Gist",
      cloud_gist_desc: "Đồng bộ đa thiết bị qua Gist bí mật của GitHub",
      cloud_drive_title: "Đồng bộ qua Google Drive",
      cloud_drive_desc:
        "Đồng bộ đa thiết bị qua thư mục AppData ẩn của Google Drive",
      gist_modal_title: "Cấu hình đồng bộ GitHub Gist",
      gist_modal_desc:
        "Nhập GitHub Personal Access Token (quyền 'gist'). Thói quen và nhật ký tập trung của bạn sẽ được lưu trong Gist bí mật.",
      gist_token_label: "Mã truy cập cá nhân GitHub (PAT)",
      gist_id_label: "Mã Gist ID (Tùy chọn / Tự động tạo)",
      gist_save_btn: "Lưu & Kết nối",
      gist_disconnect_btn: "Ngắt kết nối",
      gist_test_btn: "Kiểm tra kết nối",
      drive_modal_title: "Cấu hình đồng bộ Google Drive",
      drive_modal_desc:
        "Kết nối tài khoản Google để đồng bộ dữ liệu vào thư mục AppData riêng tư trên Google Drive.",
      drive_client_id_label: "Google OAuth 2.0 Client ID",
      drive_connect_btn: "Đăng nhập với Google",
      drive_disconnect_btn: "Ngắt kết nối tài khoản",
      toast_sync_success: "Đồng bộ đám mây thành công!",
      toast_sync_error: "Đồng bộ thất bại: {message}",
      toast_gist_connected: "Đã kết nối GitHub Gist thành công!",
      toast_gist_disconnected: "Đã ngắt kết nối GitHub Gist.",
      toast_drive_connected: "Đã kết nối Google Drive thành công!",
      toast_drive_disconnected: "Đã ngắt kết nối Google Drive.",
      vault_encryption_title: "Mã hóa Vault Zero-Knowledge",
      vault_encryption_desc:
        "Mã hóa bản sao lưu và xuất dữ liệu bằng AES-GCM-256 trước khi tải lên",
      vault_encrypt_toggle: "Mã hóa bằng mật khẩu",
      vault_status_unlocked: "Đã mở khóa (Phiên đang hoạt động)",
      vault_status_locked: "Đã khóa (Yêu cầu mật khẩu)",
      vault_unlock_title: "Mở khóa Vault thói quen",
      vault_unlock_desc:
        "Dữ liệu đám mây của bạn được bảo vệ bằng mã hóa AES-GCM-256 zero-knowledge. Nhập mật khẩu bí mật để giải mã và đồng bộ.",
      vault_passphrase_label: "Mật khẩu Vault bí mật",
      vault_passphrase_placeholder: "Nhập mật khẩu mã hóa của bạn",
      vault_unlock_btn: "Mở khóa Vault",
      vault_lock_btn: "Khóa Vault",
      vault_setup_title: "Thiết lập mật khẩu Vault",
      vault_setup_desc:
        "Chọn mật khẩu an toàn. Nếu quên, dữ liệu đám mây đã mã hóa sẽ không thể khôi phục.",
      vault_error_wrong_pass: "Mật khẩu không chính xác. Giải mã thất bại.",
      vault_error_locked: "Vault đang bị khóa. Cần nhập mật khẩu để đồng bộ.",
      toast_vault_unlocked: "Đã mở khóa Vault thành công cho phiên này!",
      toast_vault_locked: "Đã khóa Vault. Khóa tạm thời đã xóa khỏi bộ nhớ.",
      toast_vault_encryption_enabled: "Đã bật chế độ mã hóa Vault!",
      toast_vault_encryption_disabled: "Đã tắt chế độ mã hóa Vault.",

      // System Toasts & Dialogs
      toast_backup_exported: "Đã xuất tệp sao lưu JSON thành công!",
      toast_json_copied: "Đã sao chép dữ liệu JSON vào bộ nhớ tạm!",
      toast_clipboard_read_error: "Không thể đọc bộ nhớ tạm: {message}",
      toast_clipboard_copy_error:
        "Không thể sao chép vào bộ nhớ tạm: {message}",
      toast_habit_deleted: "Đã xóa thói quen",
      toast_notes_saved: "Đã lưu ghi chú nhật ký!",
      toast_habit_archived: "Đã lưu trữ thói quen",
      toast_habit_restored: "Đã khôi phục thói quen",
      toast_gist_pat_required:
        "GitHub Gist Sync: Vui lòng thiết lập PAT Token trong Cài đặt",
      toast_drive_auth_required:
        "Google Drive Sync: Vui lòng kết nối tài khoản Google Drive trong Cài đặt",
      toast_update_checked: "Đã kiểm tra phiên bản mới nhất.",
      toast_press_back_again: "Nhấn back lần nữa để thoát",
      delete_confirm_msg:
        "Bạn có chắc chắn muốn xóa vĩnh viễn thói quen này? Toàn bộ lịch sử sẽ bị xóa.",
      toast_habit_saved: "Đã lưu thói quen thành công!",
      toast_habit_updated: "Đã cập nhật thói quen thành công!",
      toast_freeze_token_added: "Đã thêm {count} vé bảo lưu chuỗi!",
      toast_vacation_enabled: "Đã bật chế độ tạm dừng nghỉ phép.",
      toast_vacation_disabled: "Đã tắt chế độ tạm dừng.",
      toast_import_success: "Đã nhập dữ liệu thành công!",
      toast_import_file_error: "Lỗi tệp: {errors}",
      toast_import_error: "Lỗi nhập tệp: {message}",
      undo: "Hoàn tác",
      undo_action: "Hoàn tác",
      move_up: "Di chuyển lên",
      move_down: "Di chuyển xuống",
      toast_habit_restored: "Đã khôi phục thói quen",
      quick_emoji_presets: "Biểu tượng gợi ý",
      select_emoji_preset: "Biểu tượng gợi ý",
      toast_habit_completed: "Đã hoàn thành thói quen",
      toast_habit_incremented: "Đã cập nhật tiến độ",
      toast_undo_success: "Đã hoàn tác thao tác",
      preview_label: "Xem trước",
      reminders_notifications_title: "Nhắc nhở & Thông báo hàng ngày",
      reminders_notifications_desc:
        "Nhận thông báo cục bộ khi đến giờ hoàn thành các thói quen đã lên lịch",
      perm_granted: "Đã bật",
      perm_denied: "Bị chặn",
      perm_default: "Chưa bật",
      enable_notifications_btn: "Bật thông báo",
      send_test_notification_btn: "Gửi thông báo thử nghiệm",
      toast_notification_test_sent: "Đã gửi thông báo thử nghiệm!",
      toast_notifications_enabled: "Đã bật nhắc nhở hàng ngày!",
      toast_notifications_blocked:
        "Thông báo đã bị chặn trong cài đặt trình duyệt.",
      delete_confirm_title: "Xác nhận xóa thói quen",
      delete_confirm_desc:
        'Bạn có chắc chắn muốn xóa vĩnh viễn thói quen "{name}"? Tất cả dữ liệu nhật ký lịch sử sẽ bị xóa hoàn toàn.',
      delete_confirm_btn: "Xóa",
      delete_cancel_btn: "Hủy",
      jump_to_timer: "Đang hẹn giờ",

      // Data Vault & Clean Data
      data_vault_title: "Dữ liệu & Khôi phục",
      data_vault_desc:
        "Quản lý dữ liệu, khôi phục thói quen mẫu hoặc xóa toàn bộ",
      reset_defaults_btn: "Khôi phục thói quen mẫu",
      reset_defaults_desc:
        "Xóa toàn bộ nhật ký và đặt lại 3 thói quen mẫu ban đầu",
      factory_wipe_btn: "Xóa sạch toàn bộ dữ liệu",
      factory_wipe_desc:
        "Xóa vĩnh viễn tất cả thói quen, nhật ký và cài đặt về trạng thái trống",
      reset_confirm_title: "Khôi phục dữ liệu mẫu",
      reset_confirm_desc:
        "Bạn có chắc chắn muốn khôi phục 3 thói quen mẫu ban đầu? Toàn bộ thói quen tùy chỉnh và nhật ký sẽ bị xóa.",
      factory_wipe_confirm_title: "Xác nhận xóa sạch toàn bộ dữ liệu",
      factory_wipe_confirm_desc:
        "CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn tất cả thói quen, lịch sử ghi chép và cài đặt. Bạn không thể hoàn tác thao tác này!",
      toast_reset_defaults_success: "Đã khôi phục các thói quen mẫu!",
      toast_factory_wipe_success: "Đã xóa sạch toàn bộ dữ liệu ứng dụng!",
      reset_confirm_btn: "Khôi phục",
      factory_wipe_confirm_btn: "Xóa sạch",
      habits_subview_catalog: "Danh mục thói quen",
      habits_subview_identity: "Hệ giá trị & Gợi ý",
      modal_stage_1_title: "1. Nghi thức cơ bản",
      modal_stage_2_title: "2. Lịch trình & Giao diện",
      modal_btn_quick_save: "Lưu nhanh",
      modal_btn_next_stage: "Tiếp tục: Lịch trình ➔",
      modal_btn_prev_stage: "◀ Quay lại",
      change_emoji: "Đổi biểu tượng",
      more_actions: "Tùy chọn khác",
      close: "Đóng",

      // Timer Enhancements
      timer_running: "Đang chạy",
      timer_paused: "Tạm dừng",
      timer_reset: "Đặt lại",
      timer_pause: "Tạm dừng",
      timer_resume: "Tiếp tục",
      toast_timer_reset: "Đã đặt lại thời gian về 0",
      toast_timer_session_expired:
        "Phiên hẹn giờ đã đạt giới hạn 12 giờ và được lưu lại",
      minutes_unit: "phút",
      focus_timer_title: "Phiên Tập Trung",
      focus_timer_remaining: "Thời gian còn lại",
      focus_timer_elapsed: "Đã hoàn thành",
      focus_timer_overtime: "Tập trung thêm",
      focus_timer_target: "Mục tiêu: {target}",
      focus_timer_start: "Bắt đầu tập trung",
      focus_timer_pause: "Tạm dừng",
      focus_timer_reset: "Đặt lại",
      focus_timer_sound_on: "Bật âm thanh",
      focus_timer_sound_off: "Tắt âm thanh",
      focus_timer_adjust_plus1: "+1p",
      focus_timer_adjust_plus5: "+5p",
      focus_timer_adjust_minus1: "-1p",

      // Detail Sheet
      edit_habit_shortcut: "Chỉnh sửa",
      archive_habit_shortcut: "Lưu trữ",
      schedule_rule_label: "Quy tắc lịch trình",
      today_progress_label: "Tiến độ hôm nay",

      // Days of week
      day_sun: "CN",
      day_mon: "T2",
      day_tue: "T3",
      day_wed: "T4",
      day_thu: "T5",
      day_fri: "T6",
      day_sat: "T7",

      // Full Days
      day_sunday: "Chủ nhật",
      day_monday: "Thứ hai",
      day_tuesday: "Thứ ba",
      day_wednesday: "Thứ tư",
      day_thursday: "Thứ năm",
      day_friday: "Thứ sáu",
      day_saturday: "Thứ bảy",

      // Identity Setup Wizard
      wizard_title: "Hướng Dẫn Thiết Lập Bản Sắc",
      wizard_subtitle:
        "Xây dựng hệ thống thói quen cá nhân trong 4 bước đơn giản",
      wizard_step_lang_title: "Chọn Ngôn Ngữ Hiển Thị",
      wizard_step_lang_desc:
        "Chọn ngôn ngữ hiển thị ưa thích của bạn. Bạn có thể thay đổi bất cứ lúc nào trong phần Cài đặt.",
      wizard_lang_vi_title: "Tiếng Việt",
      wizard_lang_vi_desc: "Giao diện và tên thói quen tiếng Việt",
      wizard_lang_en_title: "English",
      wizard_lang_en_desc: "English interface and atomic habit kits",
      wizard_step_1_title: "Trụ Cột Cuộc Sống",
      wizard_step_1_desc:
        "Neo giữ thói quen vào 4 lĩnh vực cốt lõi: Sức khỏe, Tâm trí, Sự nghiệp và Kỷ luật.",
      wizard_step_2_title: "Gói Khởi Động 1-Chạm",
      wizard_step_2_desc:
        "Chọn một gói thói quen tuyển chọn theo khoa học hành vi để bắt đầu ngay.",
      wizard_step_3_title: "Sẵn Sàng Bứt Phá Thói Quen",
      wizard_step_3_desc:
        "Hệ thống đã sẵn sàng. Tiến bộ 1% mỗi ngày sẽ tạo nên sự chuyển hóa vượt bậc.",
      wizard_btn_next: "Tiếp theo ➔",
      wizard_btn_back: "Quay lại",
      wizard_btn_finish: "Bắt đầu Hôm nay 🔥",
      wizard_btn_skip: "Bỏ qua",
      open_identity_wizard: "Mở Hướng dẫn Thiết lập",
      wizard_domain_health_desc:
        "Năng lượng thể chất, nước uống, tập luyện, giấc ngủ",
      wizard_domain_mind_desc:
        "Tâm trí sáng suốt, đọc sách, tĩnh tâm, tập trung",
      wizard_domain_craft_desc:
        "Làm việc sâu, lập trình, viết lách, dự án trọng điểm",
      wizard_domain_discipline_desc:
        "Tính kiên trì, nề nếp kỷ luật, theo dõi đều đặn",

      // Actions
      cancel: "Hủy",
      save: "Lưu",
      close: "Đóng",
      done: "Xong",
      completed: "Đã xong",
      pending: "Chưa xong",
      edit: "Sửa",
      delete: "Xóa",
      clear: "Xóa sạch",
    },
  };

  /**
   * Retrieves translation for given key with parameter interpolation
   */
  function t(key, params = {}, lang = "vi") {
    const selectedLang = lang === "en" ? "en" : "vi";
    const dict = TRANSLATIONS[selectedLang] || TRANSLATIONS.vi;
    let str = dict[key] || TRANSLATIONS.en[key] || key;

    if (params && typeof params === "object") {
      for (const p in params) {
        str = str.replace(new RegExp(`\\{${p}\\}`, "g"), params[p]);
      }
    }

    return str;
  }

  /**
   * Formats numbers per locale
   */
  function formatNumber(num, lang = "vi") {
    const n = Number(num) || 0;
    const locale = lang === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale).format(n);
  }

  /**
   * Formats percentages per locale
   */
  function formatPercent(num, lang = "vi") {
    const n = Number(num) || 0;
    return `${Math.round(n)}%`;
  }

  /**
   * Formats dates per locale
   */
  function formatDate(dateInput, lang = "vi", formatType = "short") {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const locale = lang === "en" ? "en-US" : "vi-VN";

    if (formatType === "weekday_short") {
      const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const daysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      return lang === "en" ? daysEn[d.getDay()] : daysVi[d.getDay()];
    }

    if (formatType === "full") {
      return d.toLocaleDateString(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Default short
    return d.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Formats duration in seconds to unified digital clock format:
   * - 00:00 (MM:SS) if totalSeconds <= 3600 (60 mins)
   * - 00:00:00 (HH:MM:SS) if totalSeconds > 3600
   * - Optional prefix for overtime (+00:01, +01:05:00)
   */
  function formatDurationClock(totalSeconds, prefix = "") {
    const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const prefixStr = typeof prefix === "string" ? prefix : "";

    if (sec > 3600) {
      const hStr = String(h).padStart(2, "0");
      const mStr = String(m).padStart(2, "0");
      const sStr = String(s).padStart(2, "0");
      return `${prefixStr}${hStr}:${mStr}:${sStr}`;
    }

    const mStr = String(Math.floor(sec / 60)).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");
    return `${prefixStr}${mStr}:${sStr}`;
  }

  /**
   * Formats duration to unified digital clock format across all locales (e.g. 00:00 or 00:00:00)
   */
  function formatDuration(totalSeconds, lang = "vi") {
    return formatDurationClock(totalSeconds);
  }

  const i18nExports = {
    TRANSLATIONS,
    t,
    formatNumber,
    formatPercent,
    formatDate,
    formatDuration,
    formatDurationClock,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = i18nExports;
  } else {
    global.Habiti18n = i18nExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
