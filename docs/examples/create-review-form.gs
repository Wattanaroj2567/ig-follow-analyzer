function createReviewForm() {
  const form = FormApp.create('รีวิวการใช้งาน / Review IG Follow Analyzer', false);
  form
    .setDescription(
      'เรานำคะแนนไปรวมเพื่อสรุปผลรีวิว กรุณาไม่ใส่รหัสผ่าน ชื่อบัญชี หรือข้อมูลส่วนตัว\n' +
        'Ratings contribute to the review summary. Please leave out passwords, usernames, and personal information.',
    )
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setPublishingSummary(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('ขอบคุณที่รีวิว IG Follow Analyzer / Thank you for your review.');

  form
    .addRatingItem()
    .setTitle('ให้คะแนนการใช้งาน / Rate your experience')
    .setRatingScaleLevel(5)
    .setRatingIcon(FormApp.RatingIconType.STAR)
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle('เล่าประสบการณ์สั้น ๆ / Tell us about your experience')
    .setHelpText('ส่วนไหนช่วยคุณได้ หรือส่วนไหนยังใช้งานยาก? / What helped you, or what was hard to use?')
    .setValidation(
      FormApp.createParagraphTextValidation()
        .requireTextLengthLessThanOrEqualTo(500)
        .setHelpText('กรอกได้สูงสุด 500 ตัวอักษร / Enter up to 500 characters.')
        .build(),
    )
    .setRequired(false);

  form
    .addTextItem()
    .setTitle('ชื่อที่ต้องการให้แสดง / Display name')
    .setHelpText('ใช้ชื่อเล่นหรือนามแฝงได้ / You can use a nickname or alias.')
    .setRequired(true);

  form
    .addCheckboxItem()
    .setTitle('การเผยแพร่ข้อความรีวิว / Sharing your review comment')
    .setHelpText(
      'หากยินยอม เราอาจแสดงข้อความพร้อมชื่อที่คุณกรอกหลังตรวจแล้ว\n' +
        'If you opt in, we may publish your reviewed comment with the name you entered.',
    )
    .setChoiceValues([
      'อนุญาตให้นำข้อความรีวิวและชื่อที่กรอกไว้ไปแสดงบนเว็บ / You may share my review comment and the name I entered on the website.',
    ])
    .setRequired(false);

  console.log(form.getEditUrl());
}
