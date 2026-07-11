/**
 * YouthCamping — Unified Master Booking System (Multi-Tab Edition)
 * 
 * Stores ALL bookings in ONE master spreadsheet, but creates a 
 * separate tab (sheet) for every unique trip.
 * 
 * Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const SPREADSHEET_NAME = "YouthCamping_Master_Bookings";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const tripName = data.tripName || "Uncategorized";
    
    // 1. Get or Create the ONE Master Spreadsheet
    const ss = getOrCreateSpreadsheet(SPREADSHEET_NAME);
    
    // 2. Get or Create a specific TAB for this trip
    const tabName = tripName.substring(0, 30).replace(/[\\\/\?\*\[\]]/g, "");
    const sheet = getOrCreateTripTab(ss, tabName);
    
    // 3. If this is just an initialization call, stop here
    if (data.isInit || data.name === "SYSTEM_INIT") {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          sheetUrl: ss.getUrl(),
          message: "Tab initialized: " + tabName
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. Prepare Data Row
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const bookingId = data.bookingId || ("YC-" + Math.random().toString(36).substr(2, 6).toUpperCase());
    
    const row = [
      bookingId,
      timestamp,
      data.salesPersonName || "Direct",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.tripName || "",
      data.date || "TBD",
      data.pickupLocation || "TBD",
      data.participants || 1,
      data.totalAmount || 0,
      data.paidAmount || 0,
      data.remainingAmount || 0,
      data.paymentMode || "N/A",
      data.status || "Pending",
      data.notes || ""
    ];
    
    // 4. Append to the Trip-specific Tab
    sheet.appendRow(row);
    
    // Formatting
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat("dd/MM/yyyy HH:mm:ss");
    
    // 5. Update Master Summary
    updateMasterSummary(ss);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        bookingId: bookingId,
        sheetName: tabName,
        sheetUrl: ss.getUrl(),
        spreadsheetId: ss.getId(),
        message: "Booking stored & Summary updated"
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function updateMasterSummary(ss) {
  let summarySheet = ss.getSheetByName("MASTER_SUMMARY");
  if (!summarySheet) {
    summarySheet = ss.insertSheet("MASTER_SUMMARY", 0);
    summarySheet.appendRow(["Trip Name", "Total Bookings", "Accepted", "Revenue", "Pending Payments", "Last Updated"]);
    summarySheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1a1a2e").setFontColor("#ffffff");
    summarySheet.setFrozenRows(1);
  }

  const sheets = ss.getSheets();
  const summaryData = [];
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === "MASTER_SUMMARY" || name === "Sheet1") return;
    
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1);
    
    // Index mapping (adjust based on your headers)
    const statusIdx = headers.indexOf("Booking Status");
    const amountIdx = headers.indexOf("Total Amount");
    const paidIdx = headers.indexOf("Paid Amount");
    const remainingIdx = headers.indexOf("Remaining Amount");
    
    let total = data.length;
    let accepted = 0;
    let revenue = 0;
    let pending = 0;
    
    data.forEach(row => {
      const status = String(row[statusIdx]).toLowerCase();
      if (status === "accepted" || status === "confirmed" || status === "completed") {
        accepted++;
        revenue += Number(row[paidIdx]) || 0;
        pending += Number(row[remainingIdx]) || 0;
      }
    });
    
    summaryData.push([name, total, accepted, revenue, pending, new Date()]);
  });
  
  if (summaryData.length > 0) {
    summarySheet.getRange(2, 1, summarySheet.getLastRow() || 1, 6).clearContent();
    summarySheet.getRange(2, 1, summaryData.length, 6).setValues(summaryData);
    summarySheet.getRange(2, 4, summaryData.length, 2).setNumberFormat("₹#,##0");
  }
}

// ─── HELPERS ──────────────────────────────────────────

function getOrCreateSpreadsheet(name) {
  const files = DriveApp.getFilesByName(name);
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }
  return SpreadsheetApp.create(name);
}

function getOrCreateTripTab(ss, tabName) {
  let sheet = ss.getSheetByName(tabName);
  
  if (!sheet) {
    try {
      sheet = ss.insertSheet(tabName);
    } catch (e) {
      // Fallback for invalid names or duplicates
      tabName = tabName + "_" + Math.floor(Math.random() * 1000);
      sheet = ss.insertSheet(tabName);
    }
    
    // Cleanup default Sheet1 if empty
    const sheet1 = ss.getSheetByName("Sheet1");
    if (sheet1 && sheet1.getLastRow() === 0) ss.deleteSheet(sheet1);
    
    // Add Headers
    const headers = [
      "Booking ID", "Date of Entry", "Sales Person Name", 
      "Client Name", "Phone", "Email", "Trip Name", 
      "Travel Date", "Pickup Location", "No. of People",
      "Total Amount", "Paid Amount", "Remaining Amount",
      "Payment Mode", "Booking Status", "Notes"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1a1a2e")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    
    // Auto-width for columns
    for(let i=1; i<=headers.length; i++) sheet.setColumnWidth(i, 130);
  }
  
  return sheet;
}

function doGet(e) {
  return ContentService.createTextOutput("YouthCamping Multi-Tab API Active.");
}
