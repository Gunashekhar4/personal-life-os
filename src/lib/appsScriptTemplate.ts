/**
 * Google Apps Script Web App Sync Bridge (Template)
 * This script runs in the user's personal Google Apps Script environment.
 * It operates with their permission, allowing zero-cost secure Sheets DB & Google Drive storage.
 */

export const APPS_SCRIPT_TEMPLATE = `/**
 * Personal AI Life OS - Google Apps Script Sync Bridge
 * 
 * INSTRUCTIONS:
 * 1. Open Google Drive (drive.google.com)
 * 2. Create a new Google Sheet named "Life OS Database"
 * 3. Go to "Extensions" -> "Apps Script"
 * 4. Paste this ENTIRE code into the editor (replace default myFunction)
 * 5. Click "Deploy" -> "New Deployment"
 * 6. Select type "Web App"
 * 7. Set "Execute as": "Me (<your-email>)"
 * 8. Set "Who has access": "Anyone" (Required so your web app can call it via API)
 * 9. Click "Deploy" & authorize the permissions.
 * 10. Copy the "Web App URL" and paste it in the "Google Sheets & Drive Sync Center" in your Life OS.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var action = payload.action;
    
    // Open the spreadsheet by active state or ID
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      // Create if none active (backup)
      var files = DriveApp.getFilesByName("Life OS Database");
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create("Life OS Database");
      }
    }
    
    if (action === "test") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Life OS Cloud Bridge authenticated successfully! Spreadsheet URL: " + ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "pull") {
      var dbData = pullAllSheets(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: dbData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "push") {
      var localData = payload.data;
      pushAllSheets(ss, localData);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All modules synced successfully with Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "upload") {
      var fileData = payload.file; // { name: "", type: "", data: "base64" }
      var category = payload.category || "General";
      
      // Get or create drive folder
      var folders = DriveApp.getFoldersByName("Life OS Vault");
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("Life OS Vault");
      }
      
      // Decode base64
      var byteCharacters = Utilities.base64Decode(fileData.data);
      var blob = Utilities.newBlob(byteCharacters, fileData.type, fileData.name);
      
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        fileUrl: file.getUrl(),
        driveId: file.getId(),
        downloadUrl: file.getDownloadUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action parameter specified: " + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Sync Server Exception: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Life OS Personal Cloud API is online. Please use POST for sync requests.");
}

// Fetch all sheets as simple dictionary arrays
function pullAllSheets(ss) {
  var data = {};
  var sheets = ss.getSheets();
  
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    var range = sheet.getDataRange();
    var values = range.getValues();
    
    if (values.length <= 1) {
      data[sheetName] = [];
      continue;
    }
    
    var headers = values[0];
    var list = [];
    
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        var val = row[c];
        
        // Handle dates and arrays
        if (val instanceof Date) {
          obj[key] = val.toISOString().split('T')[0];
        } else if (typeof val === "string" && (val.indexOf("[") === 0 || val.indexOf("{") === 0)) {
          try {
            obj[key] = JSON.parse(val);
          } catch(e) {
            obj[key] = val;
          }
        } else {
          obj[key] = val;
        }
      }
      list.push(obj);
    }
    data[sheetName] = list;
  }
  return data;
}

// Overwrite worksheets with local arrays
function pushAllSheets(ss, data) {
  for (var storeName in data) {
    var list = data[storeName];
    if (!Array.isArray(list)) continue;
    
    var sheet = ss.getSheetByName(storeName);
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(storeName);
    }
    
    if (list.length === 0) {
      sheet.appendRow(["id"]); // Empty header
      continue;
    }
    
    // Assemble Headers
    var headers = Object.keys(list[0]);
    sheet.appendRow(headers);
    
    var rows = [];
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var row = [];
      for (var c = 0; c < headers.length; c++) {
        var val = item[headers[c]];
        if (typeof val === "object" && val !== null) {
          row.push(JSON.stringify(val));
        } else {
          row.push(val === undefined ? "" : val);
        }
      }
      rows.push(row);
    }
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
`;
