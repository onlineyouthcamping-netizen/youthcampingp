const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/controllers/bookingController.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = /passengers:\s*true,/;
if (target.test(content)) {
  // Let's replace the first instance inside findMany
  content = content.replace(target, "passengers: true, trainTicketStatus: true, trainTicketRequired: true,");
  fs.writeFileSync(filePath, content);
  console.log("bookingController.js patched successfully.");
} else {
  console.log("Could not find passengers: true");
}
