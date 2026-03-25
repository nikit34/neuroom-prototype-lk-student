// ============================================
// Google Apps Script — вставить в редактор скрипта Google Sheets
// ============================================
//
// ИНСТРУКЦИЯ:
// 1. Создай новую Google Таблицу (sheets.new)
// 2. Переименуй первый лист в «Ответы»
// 3. В первую строку впиши заголовки:
//    Время | Вариант | Почему | Важная инфо | Мотивация | Частота | AI-репетитор | Не хватает | Геймификация
// 4. Открой Расширения → Apps Script
// 5. Удали всё содержимое и вставь этот код
// 6. Нажми «Развернуть» → «Новое развёртывание»
//    - Тип: Веб-приложение
//    - Выполнять от: Меня
//    - Доступ: Все (включая анонимных)
// 7. Скопируй URL развёртывания
// 8. Вставь его в docs/index.html в строку GOOGLE_SHEET_URL = '...'
//

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ответы');

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
    data.variant || '',
    data.variant_reason || '',
    data.first_info || '',
    data.motivation || '',
    data.frequency || '',
    data.ai_use || '',
    data.missing || '',
    data.gamification_importance || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Нужен для CORS preflight (GET-запросы тоже обрабатываем)
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready' }))
    .setMimeType(ContentService.MimeType.JSON);
}
