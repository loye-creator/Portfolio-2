/* ------------------------------------------------------------------
   PORTFOLIO CONTACT FORM  ->  GOOGLE SHEET + EMAIL
   ------------------------------------------------------------------

   This runs on Google's servers, free, with no third-party account
   and no monthly submission cap. Every enquiry lands as a row in your
   own Sheet and sends you an email at the same time.

   SETUP, about five minutes
   -------------------------
   1. Go to sheets.new and make a blank spreadsheet.
      Name it something like "Portfolio enquiries".

   2. In that sheet: Extensions > Apps Script.
      Delete whatever is in the editor.
      Paste this whole file in. Save.

   3. Check the NOTIFY_EMAIL line below is the address you want
      notifications sent to. Change it if not.

   4. Click Deploy > New deployment.
      Click the gear icon next to "Select type" and pick "Web app".
      Description:  portfolio form
      Execute as:   Me
      Who has access:  Anyone          <-- this matters, it must be
                                           "Anyone", not "Anyone with
                                           a Google account"
      Click Deploy.

   5. Google will ask you to authorise it. Click through:
      Review permissions > pick your account > Advanced >
      "Go to ... (unsafe)" > Allow.
      That warning appears because the script is yours and unverified,
      which is normal for your own scripts.

   6. Copy the Web app URL it gives you. It looks like
      https://script.google.com/macros/s/AKfy...../exec

   7. Open site.js, find the line near the top that reads
         var FORM_ENDPOINT = "";
      and paste the URL between the quotes. Upload site.js.

   That's it. Test it by submitting your own form once.

   IF YOU EVER EDIT THIS SCRIPT: you must Deploy > Manage deployments >
   edit the existing one > Version: New version > Deploy. Just saving
   does not update the live URL.
------------------------------------------------------------------- */

var NOTIFY_EMAIL = "davidakin6@gmail.com";
var SHEET_NAME   = "Enquiries";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Honeypot: real people never fill this field, bots usually do.
    // Return success so the bot does not retry, but store nothing.
    if (data.website) {
      return json({ ok: true });
    }

    var sheet = getSheet();
    var when = new Date();

    sheet.appendRow([
      when,
      data.name    || "",
      data.email   || "",
      data.company || "",
      data.message || "",
      data.source  || "",
      "New"
    ]);

    notify(data, when);
    return json({ ok: true });

  } catch (err) {
    // Logged under Executions in the Apps Script editor if you need it.
    return json({ ok: false, error: String(err) });
  }
}

// Lets you open the /exec URL in a browser to confirm it is live.
function doGet() {
  return json({ ok: true, status: "Endpoint is live." });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Received", "Name", "Email", "Company", "Message", "Source", "Status"]);
    var header = sheet.getRange(1, 1, 1, 7);
    header.setFontWeight("bold");
    header.setBackground("#F2EFE8");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(5, 420);
  }
  return sheet;
}

function notify(data, when) {
  var name = data.name || "Someone";
  var subject = "Portfolio enquiry: " + name + (data.company ? " (" + data.company + ")" : "");

  var body =
    name + " got in touch through the portfolio.\n\n" +
    "Email:    " + (data.email || "not given") + "\n" +
    "Company:  " + (data.company || "not given") + "\n" +
    "Received: " + Utilities.formatDate(when, "Africa/Lagos", "EEE d MMM yyyy, HH:mm") + " Lagos time\n\n" +
    "What is breaking:\n" +
    (data.message || "") + "\n\n" +
    "---\n" +
    "Reply straight to this email to answer them.\n" +
    "Full log: " + SpreadsheetApp.getActiveSpreadsheet().getUrl();

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: subject,
    body: body,
    replyTo: data.email || NOTIFY_EMAIL
  });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
