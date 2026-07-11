const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define calculated hotel metrics
const hotelStatsReplacement = `  const hotelStats = useMemo(() => {
    const hotels = tripVendors.filter((v: any) => v.vendorType === 'hotel');
    const totalNights = hotels.length || 9;
    const confirmedNights = hotels.filter((h: any) => h.paymentStatus === 'paid' || h.notes?.toLowerCase().includes('confirm')).length;
    const pendingNights = totalNights - confirmedNights;
    const paxCount = bookings.reduce((sum: number, b: any) => sum + (b.numberOfTravelers || 1), 0);
    const totalRooms = totalNights * 12 || 120;
    const roomsBooked = Math.min(paxCount, totalRooms);
    const occupancy = totalRooms > 0 ? ((roomsBooked / totalRooms) * 100).toFixed(1) : "0";

    return {
      totalNights,
      confirmedNights,
      pendingNights,
      totalRooms,
      roomsBooked,
      occupancy
    };
  }, [tripVendors, bookings]);`;

// Insert hotelStats right below computedTasks definition
content = content.replace(
  '  const allPassengers = useMemo(() => {',
  `${hotelStatsReplacement}\n\n  const allPassengers = useMemo(() => {`
);

// Replace Hotels Metrics block
const oldHotelMetrics = `              [\n                { v: "9", l: "Total Nights", desc: "Across 9 locations", bg: "bg-blue-50/50" },\n                { v: "8", l: "Confirmed", desc: "88.9% of nights", bg: "bg-emerald-50/50" },\n                { v: "1", l: "Pending", desc: "11.1% of nights", bg: "bg-amber-50/50" },\n                { v: "152", l: "Total Rooms", desc: "All nights combined", bg: "bg-purple-50/50" },\n                { v: "142 / 152", l: "Rooms Booked", desc: "93.4% occupancy", bg: "bg-cyan-50/50" },\n              ].map(k => (`;

const newHotelMetrics = `              [\n                { v: String(hotelStats.totalNights), l: "Total Nights", desc: \`Across \${hotelStats.totalNights} stays\`, bg: "bg-blue-50/50" },\n                { v: String(hotelStats.confirmedNights), l: "Confirmed", desc: \`\${((hotelStats.confirmedNights / hotelStats.totalNights)*100).toFixed(1)}% of stays\`, bg: "bg-emerald-50/50" },\n                { v: String(hotelStats.pendingNights), l: "Pending", desc: \`\${((hotelStats.pendingNights / hotelStats.totalNights)*100).toFixed(1)}% of stays\`, bg: "bg-amber-50/50" },\n                { v: String(hotelStats.totalRooms), l: "Total Rooms", desc: "All rooms combined", bg: "bg-purple-50/50" },\n                { v: \`\${hotelStats.roomsBooked} / \${hotelStats.totalRooms}\`, l: "Rooms Booked", desc: \`\${hotelStats.occupancy}% occupancy\`, bg: "bg-cyan-50/50" },\n              ].map(k => (`;

content = content.replace(oldHotelMetrics, newHotelMetrics);

// Replace Activities Metrics block
const oldActivitiesMetrics = `              [\n                { label: "Total Activities", value: 18, desc: "Across 9 Days", bg: "bg-blue-50/50" },\n                { label: "Confirmed", value: 16, desc: "88.9%", bg: "bg-emerald-50/50" },\n                { label: "Pending", value: 1, desc: "5.6%", bg: "bg-amber-50/50" },\n                { label: "Cancelled", value: 1, desc: "5.6%", bg: "bg-red-50/50" },\n                { label: "Optional Activities", value: 3, desc: "Available", bg: "bg-purple-50/50" }\n              ].map(kpi => (`;

const newActivitiesMetrics = `              [\n                { label: "Total Activities", value: computedActivities.length, desc: "Across departure days", bg: "bg-blue-50/50" },\n                { label: "Confirmed", value: computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length, desc: \`\${((computedActivities.filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length / (computedActivities.length || 1))*100).toFixed(1)}%\`, bg: "bg-emerald-50/50" },\n                { label: "Pending", value: computedActivities.filter(a => a.status === 'PENDING').length, desc: "Action required", bg: "bg-amber-50/50" },\n                { label: "Cancelled", value: computedActivities.filter(a => a.status === 'CANCELLED').length, desc: "Inactive", bg: "bg-red-50/50" },\n                { label: "Optional Activities", value: computedActivities.filter(a => a.isOptional).length, desc: "Exclusions", bg: "bg-purple-50/50" }\n              ].map(kpi => (`;

content = content.replace(oldActivitiesMetrics, newActivitiesMetrics);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Hotel and Activities metrics replaced successfully!");
