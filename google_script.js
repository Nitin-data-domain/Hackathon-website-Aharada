function doPost(e) {
  // Allow all origins to POST data
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Auto-setup headers if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Leader Name", "Leader Email", "Leader Phone", "College", "Team Name", 
        "Problem Statement", "Proposed Solution", "Team Size", 
        "Member 2 Name", "Member 2 Email", "Member 2 Phone",
        "Member 3 Name", "Member 3 Email", "Member 3 Phone",
        "Member 4 Name", "Member 4 Email", "Member 4 Phone",
        "Member 5 Name", "Member 5 Email", "Member 5 Phone"
      ]);
      // Make headers bold
      sheet.getRange("A1:U1").setFontWeight("bold");
    }
    
    // Extract member data (up to 4 additional members since max team size is 5)
    // data.members[0] will be Member 2
    // data.members[1] will be Member 3
    // data.members[2] will be Member 4
    // data.members[3] will be Member 5
    
    const getMemberDetail = (index, key) => {
      if (data.members && data.members.length > index) {
        return data.members[index][key] || "";
      }
      return "";
    };

    // Construct the row in the exact order of your headers
    const row = [
      new Date(),                             // A: Timestamp
      data.leaderName,                        // B: Leader Name
      data.email,                             // C: Leader Email
      data.phone,                             // D: Leader Phone
      data.college,                           // E: College
      data.teamName,                          // F: Team Name
      data.problemStatement,                  // G: Problem Statement
      data.proposedSolution,                  // H: Proposed Solution
      data.teamSize,                          // I: Team Size
      getMemberDetail(0, 'name'),             // J: Member 2 Name
      getMemberDetail(0, 'email'),            // K: Member 2 Email
      getMemberDetail(0, 'phone'),            // L: Member 2 Phone
      getMemberDetail(1, 'name'),             // M: Member 3 Name
      getMemberDetail(1, 'email'),            // N: Member 3 Email
      getMemberDetail(1, 'phone'),            // O: Member 3 Phone
      getMemberDetail(2, 'name'),             // P: Member 4 Name
      getMemberDetail(2, 'email'),            // Q: Member 4 Email
      getMemberDetail(2, 'phone'),            // R: Member 4 Phone
      getMemberDetail(3, 'name'),             // S: Member 5 Name
      getMemberDetail(3, 'email'),            // T: Member 5 Email
      getMemberDetail(3, 'phone'),            // U: Member 5 Phone
    ];
    
    // Append the row to the sheet
    sheet.appendRow(row);
    
    // Return a success response
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // Return an error response
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

// Ensure the script handles preflight OPTIONS requests from the browser
function doOptions(e) {
  return ContentService.createTextOutput("")
      .setMimeType(ContentService.MimeType.TEXT);
}
