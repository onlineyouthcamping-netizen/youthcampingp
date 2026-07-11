const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the hotel metrics array directly using regex
const hotelRegex = /\{\s*v:\s*"9",\s*l:\s*"Total Nights",[\s\S]*?Rooms Booked".*?\}\s*\]/g;
const newHotelArray = `[
                { v: String(hotelStats.totalNights), l: "Total Nights", desc: \`Across \${hotelStats.totalNights} stays\`, bg: "bg-blue-50/50" },
                { v: String(hotelStats.confirmedNights), l: "Confirmed", desc: \`\${((hotelStats.confirmedNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays\`, bg: "bg-emerald-50/50" },
                { v: String(hotelStats.pendingNights), l: "Pending", desc: \`\${((hotelStats.pendingNights / (hotelStats.totalNights || 1))*100).toFixed(1)}% of stays\`, bg: "bg-amber-50/50" },
                { v: String(hotelStats.totalRooms), l: "Total Rooms", desc: "All rooms combined", bg: "bg-purple-50/50" },
                { v: \`\${hotelStats.roomsBooked} / \${hotelStats.totalRooms}\`, l: "Rooms Booked", desc: \`\${hotelStats.occupancy}% occupancy\`, bg: "bg-cyan-50/50" },
              ]`;

content = content.replace(hotelRegex, newHotelArray);

// Replace activities metrics array directly using regex
const activitiesRegex = /\{\s*label:\s*"Total Activities",[\s\S]*?Optional Activities".*?\}\s*\]/g;
const newActivitiesArray = `[
                { label: "Total Activities", value: computedActivities.length, desc: "Across departure days", bg: "bg-blue-50/50" },
                { label: "Confirmed", value: computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length, desc: \`\${((computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length / (computedActivities.length || 1))*100).toFixed(1)}%\`, bg: "bg-emerald-50/50" },
                { label: "Pending", value: computedActivities.filter(a => a.status === 'PENDING').length, desc: "Action required", bg: "bg-amber-50/50" },
                { label: "Cancelled", value: computedActivities.filter(a => a.status === 'CANCELLED').length, desc: "Inactive", bg: "bg-red-50/50" },
                { label: "Optional Activities", value: computedActivities.filter(a => a.isOptional).length, desc: "Exclusions", bg: "bg-purple-50/50" }
              ]`;

content = content.replace(activitiesRegex, newActivitiesArray);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Hotel and Activities metrics replaced successfully!");
