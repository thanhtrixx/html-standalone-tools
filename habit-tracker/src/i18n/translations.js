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
      timer_start: "Start Timer",
      timer_pause: "Pause Timer",
      timer_reset: "Reset Timer",
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
      export_csv_btn: "Export CSV File",
      import_json_btn: "Import JSON File",
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
      export_success: "JSON backup downloaded",
      cloud_sync_now: "Sync Cloud Backup Now",
      cloud_sync_success: "Cloud backup synced successfully",

      // System Toasts & Dialogs
      toast_backup_exported: "Backup JSON file exported successfully!",
      toast_csv_exported: "CSV data exported successfully!",
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

      // Timer Enhancements
      timer_running: "Running",
      timer_paused: "Paused",
      timer_reset: "Reset",
      timer_pause: "Pause",
      timer_resume: "Resume",
      toast_timer_reset: "Timer reset to 0",
      minutes_unit: "mins",

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
      timer_start: "Bắt đầu hẹn giờ",
      timer_pause: "Tạm dừng hẹn giờ",
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
      export_csv_btn: "Xuất tệp CSV",
      import_json_btn: "Nhập tệp JSON",
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
      export_success: "Đã tải về bản sao lưu JSON",
      cloud_sync_now: "Đồng bộ đám mây ngay",
      cloud_sync_success: "Đã đồng bộ đám mây thành công",

      // System Toasts & Dialogs
      toast_backup_exported: "Đã xuất tệp sao lưu JSON thành công!",
      toast_csv_exported: "Đã xuất dữ liệu CSV thành công!",
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

      // Timer Enhancements
      timer_running: "Đang chạy",
      timer_paused: "Tạm dừng",
      timer_reset: "Đặt lại",
      timer_pause: "Tạm dừng",
      timer_resume: "Tiếp tục",
      toast_timer_reset: "Đã đặt lại thời gian về 0",
      minutes_unit: "phút",

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
   * Formats duration in seconds to string (e.g. 30m 00s or 30p 00g)
   */
  function formatDuration(totalSeconds, lang = "vi") {
    const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const mStr = String(m).padStart(2, "0");
    const sStr = String(s).padStart(2, "0");

    if (lang === "en") {
      return `${mStr}m ${sStr}s`;
    }
    return `${mStr}p ${sStr}g`;
  }

  const i18nExports = {
    TRANSLATIONS,
    t,
    formatNumber,
    formatPercent,
    formatDate,
    formatDuration,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = i18nExports;
  } else {
    global.Habiti18n = i18nExports;
  }
})(typeof window !== "undefined" ? window : globalThis);
