// ============================================
// Google Apps Script для UX-опроса Neuroom
// ============================================
//
// ИНСТРУКЦИЯ:
// 1. Создай новую Google Таблицу (sheets.new)
// 2. Переименуй первый лист в «UX»
// 3. В первую строку впиши заголовки (каждый в свою ячейку):
//    Время | Воспоминание | Разделы | Разделы ✓ | Разделы ✗ | Маскот | Маскот ✓ | Маскот ✗ | Очки | Очки ✓ | Очки ✗ | Тупик | Тупик где | Домашка flow | Фичи реакция | Непонятное | Использовал бы | Почему | Другу | Одно слово | Смен темы | Финальная тема
// 4. Открой Расширения → Apps Script
// 5. Удали всё содержимое и вставь этот код
// 6. Нажми «Развернуть» → «Новое развёртывание»
//    - Тип: Веб-приложение
//    - Выполнять от: Меня
//    - Доступ: Все (включая анонимных)
// 7. Скопируй URL развёртывания
// 8. Вставь его в docs/ux-survey/index.html в строку GOOGLE_SCRIPT_URL = '...'
//

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('UX');

  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.free_recall || '',
    data.sections_recall || '',
    data.sections_recall_correct || '',
    data.sections_recall_wrong || '',
    data.mascot_purpose || '',
    data.mascot_purpose_correct || '',
    data.mascot_purpose_wrong || '',
    data.points_understanding || '',
    data.points_understanding_correct || '',
    data.points_understanding_wrong || '',
    data.dead_end || '',
    data.dead_end_detail || '',
    data.homework_flow || '',
    data.feature_reaction || '',
    data.confusing_elements || '',
    data.would_use || '',
    data.would_use_detail || '',
    data.explain_friend || '',
    data.one_word || '',
    data.theme_switches || 0,
    data.final_theme || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}
