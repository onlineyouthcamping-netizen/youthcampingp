const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = 'Total Nights';
const startIdx = content.indexOf('{ v: "9", l: "Total Nights"');
if (startIdx !== -1) {
  const endIdx = content.indexOf('bg-cyan-50/50" }', startIdx);
  if (endIdx !== -1) {
    const fullEndIdx = endIdx + 'bg-cyan-50/50" }'.length;
    const oldSlice = content.substring(startIdx - 15, fullEndIdx + 10);
    console.log("Found slice:", JSON.stringify(oldSlice));
    
    const newSlice = `[
                { v: String(hotelStats.totalNights), l: "Total Nights", desc: \`Across \${hotelStats.totalNights} stays\`, bg: "bg-blue-50/50" },
                { v: String(hotelStats.confirmedNights), l: "Confirmed", desc: \`\${((hotelStats.confirmedNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays\`, bg: "bg-emerald-50/50" },
                { v: String(hotelStats.pendingNights), l: "Pending", desc: \`\${((hotelStats.pendingNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays\`, bg: "bg-amber-50/50" },
                { v: String(hotelStats.totalRooms), l: "Total Rooms", desc: "All rooms combined", bg: "bg-purple-50/50" },
                { v: \`\${hotelStats.roomsBooked} / \${hotelStats.totalRooms}\`, l: "Rooms Booked", desc: \`\${hotelStats.occupancy}% occupancy\`, bg: "bg-cyan-50/50" },
              ]`;
              
    const targetSlice = content.substring(startIdx - 15, fullEndIdx + 2);
    // Find the enclosing brackets
    const bracketStart = content.lastIndexOf('[', startIdx);
    const bracketEnd = content.indexOf(']', endIdx);
    
    if (bracketStart !== -1 && bracketEnd !== -1) {
      content = content.substring(0, bracketStart) + newSlice + content.substring(bracketEnd + 1);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log("Hotels metrics array replaced successfully!");
    }
  }
} else {
  console.log("Hotel start slice not found!");
}
