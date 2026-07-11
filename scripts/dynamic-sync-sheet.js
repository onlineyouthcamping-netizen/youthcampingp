/**
 * YouthCamping — Dynamic Sheet Sync (1:1 Mapping)
 * 
 * Behavior:
 * 1. Read first row (headers) and return them as JSON.
 * 2. Append rows matching headers exactly.
 * 3. Auto-generate srNo.
 * 
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const SPREADSHEET_NAME = "YouthCamping_Master_Bookings";

function doGet(e) {
  return ContentService.createTextOutput("Dynamic Sync API Active.");
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action || "submit_row";
    
    const ss = getOrCreateSpreadsheet(SPREADSHEET_NAME);
    const sheet = ss.getSheets()[0]; // Use the first sheet as master
    
    if (action === "get_headers") {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        headers: headers.filter(h => h !== "")
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "submit_row") {
      const data = contents.data;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      
      // Auto-generate srNo if it exists in headers
      if (headers.includes("srNo")) {
        const lastRow = sheet.getLastRow();
        data.srNo = lastRow > 1 ? Number(sheet.getRange(lastRow, headers.indexOf("srNo") + 1).getValue()) + 1 : 1;
      }
      
      // Map data to row based on header order
      const row = headers.map(header => {
        if (!header) return "";
        return data[header] !== undefined ? data[header] : "";
      });
      
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Row appended successfully",
        srNo: data.srNo
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Invalid action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSpreadsheet(name) {
  const files = DriveApp.getFilesByName(name);
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }
  const ss = SpreadsheetApp.create(name);
  // Default headers for initial setup
  const initialHeaders = [
    "srNo", "name", "age", "gender", "trainClass", "ticketStatus", 
    "advancePayment", "advanceTransactionId", "advanceVerifiedBy", "advancePaymentDate", 
    "remainingPayment", "remainingTransactionId", "remainingVerifiedBy", "remainingPaymentDate", 
    "mobileNumber", "room", "remark"
  ];
  ss.getSheets()[0].appendRow(initialHeaders);
  return ss;
}
