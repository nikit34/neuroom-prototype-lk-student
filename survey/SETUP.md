# Neuroom Beta Survey — Настройка

## 1. Подключение Google Sheets

### Шаг 1: Создай Google Таблицу
Создай новую таблицу. Первая строка — заголовки столбцов:

```
timestamp | free_recall | sections_recall | sections_recall_correct | sections_recall_wrong | mascot_purpose | mascot_purpose_correct | mascot_purpose_wrong | points_understanding | points_understanding_correct | points_understanding_wrong | dead_end | dead_end_detail | homework_flow | feature_reaction | confusing_elements | would_use | would_use_detail | explain_friend | one_word
```

### Шаг 2: Создай Google Apps Script
1. В таблице: **Расширения → Apps Script**
2. Замени содержимое на:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(h) { return data[h] || ''; });

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Развернуть → Новое развёртывание**
4. Тип: **Веб-приложение**
5. Выполнять от: **Меня**
6. Доступ: **Все**
7. Скопируй URL развёртывания

### Шаг 3: Вставь URL в опросник
В `index.html` найди строку:
```javascript
const GOOGLE_SCRIPT_URL = '';
```
Вставь свой URL:
```javascript
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';
```

## 2. Деплой на GitHub Pages

```bash
# Из корня репозитория
git add survey/
git commit -m "Add beta survey"
git push

# Включи GitHub Pages в Settings → Pages → Source: main, folder: /survey
# Или используй gh-pages:
npx gh-pages -d survey
```

Опросник будет доступен по адресу:
`https://<username>.github.io/<repo>/survey/`

## 3. Без Google Sheets (офлайн)

Если не подключать Google Sheets, ответы сохраняются в `localStorage` браузера.
Чтобы выгрузить: открой DevTools → Console:
```javascript
JSON.parse(localStorage.getItem('neuroom_survey_responses'))
```
