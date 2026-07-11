/**
 * YouthCamping — Google Apps Script
 * 
 * Creates Google Forms + Sheets for trip bookings.
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 * 
 * ═══════════════════════════════════════════════════
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://script.google.com
 * 2. Click "New Project"
 * 3. Paste this entire code into Code.gs
 * 4. Click Deploy → New Deployment
 * 5. Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL
 * 7. Paste it in backend/.env as GOOGLE_APPS_SCRIPT_URL
 * ═══════════════════════════════════════════════════
 */

// ─── CONFIG ──────────────────────────────────────────
// Optional: Set a Google Drive folder ID to organize sheets.
// Leave empty to create in your Drive root.
const PARENT_FOLDER_ID = '';

// ─── MAIN HANDLER ────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const tripName = data.tripName || 'Unknown Trip';
    const date = data.date || 'No-Date';
    
    const sanitizedName = tripName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const sheetTitle = sanitizedName + '-' + date;
    
    // 1. Check if sheet already exists
    let spreadsheet = findSpreadsheetByName(sheetTitle);
    let isNew = false;
    
    if (!spreadsheet) {
      // 2. Create new spreadsheet
      spreadsheet = SpreadsheetApp.create(sheetTitle);
      isNew = true;
      
      // Move to folder if configured
      if (PARENT_FOLDER_ID) {
        try {
          const file = DriveApp.getFileById(spreadsheet.getId());
          const folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
          folder.addFile(file);
          DriveApp.getRootFolder().removeFile(file);
        } catch (err) {
          Logger.log('Could not move to folder: ' + err.message);
        }
      }
      
      // Setup header row
      const sheet = spreadsheet.getActiveSheet();
      sheet.setName('Responses');
      const headers = [
        'Timestamp',
        'Primary Name',
        'Phone',
        'Email',
        'Participant Name',
        'Age',
        'Gender',
        'Participant Email',
        'Participant Contact',
        'Room Sharing',
        'Train Option',
        'Boarding City',
        'Aadhaar Upload'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1a1a2e')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      
      // Auto-resize columns
      for (let i = 1; i <= headers.length; i++) {
        sheet.setColumnWidth(i, 150);
      }
    }
    
    // 3. Create Google Form
    const formTitle = 'YouthCamping Booking – ' + tripName + ' (' + date + ')';
    const form = FormApp.create(formTitle);
    
    form.setDescription(
      '🏕️ Welcome to YouthCamping!\n\n' +
      'Trip: ' + tripName + '\n' +
      'Travel Date: ' + date + '\n\n' +
      'Please fill in all details accurately. Your booking will be confirmed after payment.\n\n' +
      'For queries, contact: +91 99242 46267'
    );
    
    form.setConfirmationMessage(
      '✅ Your booking details have been received!\n\n' +
      'Our team will contact you shortly for payment confirmation.\n\n' +
      'Trip: ' + tripName + '\n' +
      'Date: ' + date + '\n\n' +
      'Thank you for choosing YouthCamping! 🏕️'
    );
    
    // ── FORM FIELDS ──
    
    // Section: Primary Contact
    form.addSectionHeaderItem()
      .setTitle('👤 Primary Contact Information')
      .setHelpText('This is the main person responsible for the booking.');
    
    form.addTextItem()
      .setTitle('Primary Name')
      .setRequired(true)
      .setHelpText('Full name as per ID proof');
    
    form.addTextItem()
      .setTitle('Phone')
      .setRequired(true)
      .setHelpText('WhatsApp number preferred');
    
    form.addTextItem()
      .setTitle('Email')
      .setRequired(true)
      .setHelpText('Booking confirmation will be sent here');
    
    // Section: Participant Details
    form.addSectionHeaderItem()
      .setTitle('🧑‍🤝‍🧑 Participant Details')
      .setHelpText('Details of the person traveling (can be same as primary contact)');
    
    form.addTextItem()
      .setTitle('Participant Name')
      .setRequired(true)
      .setHelpText('Full name as per Aadhaar/ID');
    
    form.addTextItem()
      .setTitle('Age')
      .setRequired(true);
    
    form.addMultipleChoiceItem()
      .setTitle('Gender')
      .setChoiceValues(['Male', 'Female', 'Other'])
      .setRequired(true);
    
    form.addTextItem()
      .setTitle('Participant Email')
      .setRequired(false);
    
    form.addTextItem()
      .setTitle('Participant Contact')
      .setRequired(true)
      .setHelpText('If different from primary contact');
    
    // Section: Preferences
    form.addSectionHeaderItem()
      .setTitle('🏨 Travel Preferences');
    
    form.addMultipleChoiceItem()
      .setTitle('Room Sharing')
      .setChoiceValues(['Twin Sharing', 'Triple Sharing', 'Quad Sharing'])
      .setRequired(true);
    
    form.addMultipleChoiceItem()
      .setTitle('Train Option')
      .setChoiceValues(['AC (3 Tier)', 'Non-AC (Sleeper)', 'Not Required'])
      .setRequired(true);
    
    form.addTextItem()
      .setTitle('Boarding City')
      .setRequired(true)
      .setHelpText('City from where you will board the train/bus');
    
    // Section: Documents
    form.addSectionHeaderItem()
      .setTitle('📄 Documents');
    
    form.addTextItem()
      .setTitle('Aadhaar Upload')
      .setRequired(false)
      .setHelpText('Paste a Google Drive link to your Aadhaar scan/photo. Or share on WhatsApp: +91 99242 46267');
    
    // 4. Link form to spreadsheet
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
    
    // 5. Make form/sheet publicly accessible
    try {
      DriveApp.getFileById(spreadsheet.getId()).setSharing(
        DriveApp.Access.ANYONE_WITH_LINK,
        DriveApp.Permission.VIEW
      );
    } catch (err) {
      Logger.log('Sharing error: ' + err.message);
    }
    
    // 6. Return URLs
    const result = {
      success: true,
      formUrl: form.getPublishedUrl(),
      formEditUrl: form.getEditUrl(),
      formId: form.getId(),
      sheetUrl: spreadsheet.getUrl(),
      sheetId: spreadsheet.getId(),
      sheetName: sheetTitle,
      isNewSheet: isNew
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const errResult = {
      success: false,
      error: error.message,
      stack: error.stack
    };
    return ContentService
      .createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── HELPER: Find existing spreadsheet by exact name ──
function findSpreadsheetByName(name) {
  const files = DriveApp.getFilesByName(name);
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(file.getId());
    }
  }
  return null;
}

// ─── GET handler (for testing) ────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      service: 'YouthCamping Booking Form Generator',
      usage: 'POST with { tripName, date }'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
