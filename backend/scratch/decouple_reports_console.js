const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ycadmin/src/pages/admin/DepartureHubPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove named import
content = content.replace(
  'import ReportsConsole, { generateMockBookings } from "@/components/admin/ReportsConsole";',
  'import ReportsConsole from "@/components/admin/ReportsConsole";'
);

// 2. Define generateMockBookings locally at the top of the file (before the component)
const mockGeneratorDefinition = `// Helper to generate mock bookings for offline/fallback data
const generateMockBookings = (tripId: string, departureDateStr: string) => {
  const mockNames = [
    { name: "Aarav Mehta", gender: "Male", age: 24, phone: "9876543210", pickup: "Ahmedabad", email: "aarav.mehta@example.com" },
    { name: "Priya Sharma", gender: "Female", age: 22, phone: "9812345678", pickup: "Delhi", email: "priya.sharma@example.com" },
    { name: "Rahul Patel", gender: "Male", age: 27, phone: "9901234567", pickup: "Mumbai", email: "rahul.patel@example.com" },
    { name: "Sneha Reddy", gender: "Female", age: 23, phone: "8899887766", pickup: "Bangalore", email: "sneha.reddy@example.com" },
    { name: "Rohan Gupta", gender: "Male", age: 25, phone: "7766554433", pickup: "Vadodara", email: "rohan.gupta@example.com" },
    { name: "Ananya Rao", gender: "Female", age: 21, phone: "9012345678", pickup: "Delhi", email: "ananya.rao@example.com" }
  ];

  const bookingsArray = [];
  const statusOptions = ["Paid in Full", "Partial Payment", "Payment Pending"];

  let passengerCount = 0;
  for (let i = 0; i < 40; i++) {
    const primaryName = mockNames[i % mockNames.length];
    const totalAmount = 14500;
    const status = statusOptions[i % statusOptions.length];
    let advancePaid = totalAmount;
    if (status === "Partial Payment") {
      advancePaid = 6000;
    } else if (status === "Payment Pending") {
      advancePaid = 0;
    }

    const coTravelersCount = (i % 5 === 0 && passengerCount < 55) ? 2 : (i % 3 === 0 && passengerCount < 56) ? 1 : 0;
    const coTravelersList: any[] = [];
    for (let c = 0; c < coTravelersCount; c++) {
      const coName = mockNames[(i + c + 7) % mockNames.length];
      coTravelersList.push({
        name: coName.name + " (Guest)",
        gender: coName.gender,
        age: coName.age + (c % 2 === 0 ? 1 : -1),
        phone: coName.phone,
        pickupPoint: coName.pickup,
        email: coName.email
      });
      passengerCount++;
    }
    passengerCount++;

    bookingsArray.push({
      id: \`BK-\${1000 + i}\`,
      fullName: primaryName.name,
      gender: primaryName.gender,
      age: primaryName.age,
      phone: primaryName.phone,
      email: primaryName.email,
      pickupCity: primaryName.pickup,
      tripId: tripId,
      departureDate: departureDateStr + "T00:00:00.000Z",
      totalAmount: totalAmount,
      advancePaid: advancePaid,
      createdAt: "2027-06-15T00:00:00.000Z",
      passengers: {
        details: {
          roomAllocation: \`Room \${101 + Math.floor(i / 3)}\`,
          idProof: "Uploaded"
        },
        persons: coTravelersList
      }
    });
  }
  return bookingsArray;
};`;

content = content.replace(
  'export default function DepartureHubPage() {',
  `${mockGeneratorDefinition}\n\nexport default function DepartureHubPage() {`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("ReportsConsole import decoupled successfully!");
