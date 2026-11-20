const REVIEW_COLUMNS = [
  'Received at',
  'Original display name',
  'Initial rating',
  'Visibility',
  'Browser ID',
  'Response ID',
];
const CONSENT_PREFIX = 'อนุญาตให้นำข้อความรีวิวและชื่อที่กรอกไว้';

function setupReviewLedger() {
  const book = reviewBook();
  if (book.getSheetByName('Review controls')) return;
  const sheet = book.insertSheet('Review controls');
  sheet.appendRow(REVIEW_COLUMNS);
  sheet.setFrozenRows(1);
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['show', 'hide', 'exclude'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('D2:D').setDataValidation(validation);
}

function doGet() {
  try {
    const { form, ratingItem, commentItem, nameItem, permissionItem, permission } = reviewForm();
    const controls = new Map(reviewRows(reviewSheet()).map((row) => [row[5], row[3]]));
    const date = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
    const cards = [];
    let scoreCount = 0;
    let ratingTotal = 0;
    for (const response of form.getResponses()) {
      const id = response.getId();
      const visibility = controls.get(id);
      if (visibility !== 'show' && visibility !== 'hide') continue;
      const rating = Number(response.getResponseForItem(ratingItem)?.getResponse());
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
      scoreCount++;
      ratingTotal += rating;

      const consent = response.getResponseForItem(permissionItem)?.getResponse();
      if (visibility !== 'show' || !Array.isArray(consent) || !consent.includes(permission))
        continue;
      const displayName = String(response.getResponseForItem(nameItem)?.getResponse() ?? '').trim();
      const comment = String(response.getResponseForItem(commentItem)?.getResponse() ?? '').trim();
      if (!canPublishReview(displayName, comment)) continue;
      cards.push({
        order: dailyReviewOrder(date + id),
        review: { displayName, rating, comment },
      });
    }
    cards.sort((first, second) => first.order - second.order);
    return reviewResult({
      scoreCount,
      average: scoreCount ? ratingTotal / scoreCount : null,
      reviews: cards.slice(0, 6).map((card) => card.review),
    });
  } catch {
    return reviewResult({ ok: false });
  }
}

function doPost(event) {
  const { rating, comment, displayName, mayPublish, browserId } = event?.parameter ?? {};
  if (
    !/^[1-5]$/.test(rating) ||
    typeof comment !== 'string' ||
    comment.length > 500 ||
    typeof displayName !== 'string' ||
    !displayName.trim() ||
    displayName.length > 80 ||
    !['true', 'false'].includes(mayPublish) ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(browserId)
  ) {
    return reviewResult({ ok: false });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return reviewResult({ ok: false });
  try {
    const sheet = reviewSheet();
    const existing = reviewRows(sheet).find((row) => row[4] === browserId);
    if (existing)
      return reviewResult({ ok: Boolean(existing[5]), duplicate: Boolean(existing[5]) });
    const { form, ratingItem, commentItem, nameItem, permissionItem, permission } = reviewForm();
    if (!form.isAcceptingResponses()) return reviewResult({ ok: false });
    const response = form
      .createResponse()
      .withItemResponse(ratingItem.createResponse(Number(rating)))
      .withItemResponse(nameItem.createResponse(displayName.trim()));
    if (comment.trim()) response.withItemResponse(commentItem.createResponse(comment.trim()));
    if (mayPublish === 'true')
      response.withItemResponse(permissionItem.createResponse([permission]));

    // Reserve the browser ID before saving to Forms to prevent duplicates after a timeout.
    const row = sheet.getLastRow() + 1;
    sheet.appendRow([new Date(), "'" + displayName.trim(), Number(rating), 'show', browserId]);
    SpreadsheetApp.flush();
    const saved = response.submit();
    const id = saved.getId();
    if (!id) return reviewResult({ ok: false });
    sheet.getRange(row, 6).setValue(id);
    SpreadsheetApp.flush();
    return reviewResult({
      ok: true,
      editUrl: form.canEditResponse() ? saved.getEditResponseUrl() : null,
    });
  } catch {
    return reviewResult({ ok: false });
  } finally {
    lock.releaseLock();
  }
}

function reviewBook() {
  return SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('REVIEW_SHEET_ID'),
  );
}

function reviewSheet() {
  const sheet = reviewBook().getSheetByName('Review controls');
  if (!sheet) throw new Error('Run setupReviewLedger first');
  return sheet;
}

function reviewRows(sheet) {
  const count = sheet.getLastRow() - 1;
  return count > 0 ? sheet.getRange(2, 1, count, REVIEW_COLUMNS.length).getValues() : [];
}

function reviewForm() {
  const form = FormApp.openById(
    PropertiesService.getScriptProperties().getProperty('REVIEW_FORM_ID'),
  );
  if (form.collectsEmail()) throw new Error('Review email collection must be disabled');
  const type = FormApp.ItemType;
  const ratingItem = reviewItem(form, type.RATING).asRatingItem();
  const commentItem = reviewItem(form, type.PARAGRAPH_TEXT).asParagraphTextItem();
  const nameItem = reviewItem(form, type.TEXT).asTextItem();
  const permissionItem = reviewItem(form, type.CHECKBOX).asCheckboxItem();
  const permission = permissionItem
    .getChoices()
    .map((choice) => choice.getValue())
    .find((choice) => choice.startsWith(CONSENT_PREFIX));
  if (!permission || ratingItem.getRatingScaleLevel() !== 5)
    throw new Error('Unexpected review fields');
  return { form, ratingItem, commentItem, nameItem, permissionItem, permission };
}

function reviewItem(form, type) {
  const items = form.getItems(type);
  if (items.length !== 1) throw new Error('Unexpected review form structure');
  return items[0];
}

function canPublishReview(name, comment) {
  if (!name || name.length > 80 || !comment || comment.length > 500) return false;
  const normalized = (value) =>
    value
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\p{Cf}/gu, '');
  const nameText = normalized(name);
  const text = normalized(name + ' ' + comment);
  const profanity = /เหี้ย|สัส|ควย|เย็ด|ห่า|\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*)\b/iu;
  const impersonation =
    /แอดมิน|ผู้ดูแล|เจ้าของเว็บ|ทีมงาน|igfollowanalyzer|(?:^|\W)(?:admin|moderator|support|official)(?:$|\W)/iu;
  return (
    /[\p{L}\p{N}]/u.test(nameText) &&
    !impersonation.test(nameText.replace(/[._-]/g, ' ')) &&
    !nameText.replace(/[^\p{L}\p{N}]+/gu, '').includes('igfollowanalyzer') &&
    !profanity.test(text) &&
    !profanity.test(text.replace(/[._*-]+/g, '')) &&
    !/@|https?:|www\.|(?:\d[\s().-]*){7}|[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|co\.th)\b/iu.test(
      text,
    )
  );
}

function dailyReviewOrder(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function reviewResult(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
