"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Clear existing data
    await prisma.booking.deleteMany();
    await prisma.inquiry.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.user.deleteMany();
    await prisma.traveler.deleteMany();
    // Create Admin
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash('admin@123', salt);
    await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: 'admin@travelos.com',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });
    // Create Trips
    const trips = [
        {
            title: 'Spiti Valley Winter Expedition',
            slug: 'spiti-valley-winter',
            description: 'Experience the magic of Spiti Valley in winters. Snow-capped mountains, frozen rivers, and a unique culture.',
            price: 24999,
            duration: '7 Days / 6 Nights',
            location: 'Kaza, Himachal Pradesh',
            images: ['https://images.unsplash.com/photo-1589136142550-c2d478d052b1'],
            inclusions: ['Accommodation', 'Internal Transfers', 'Meals (B+D)', 'Guide'],
            exclusions: ['Flights', 'Personal Expenses', 'Travel Insurance'],
            itinerary: [
                { title: 'Arrival in Shimla', description: 'Meet the team and check-in at the hotel.' },
                { title: 'Drive to Kalpa', description: 'Scenic drive along the Sutlej river.' },
                { title: ' Kalpa to Kaza', description: 'Enter the cold desert of Spiti.' }
            ]
        },
        {
            title: 'Leh Ladakh Bike Trip',
            slug: 'leh-ladakh-bike-trip',
            description: 'The ultimate adventure on two wheels. Ride through the highest motorable passes in the world.',
            price: 35000,
            duration: '10 Days / 9 Nights',
            location: 'Leh, Ladakh',
            images: ['https://images.unsplash.com/photo-1544919982-b61976f0ba43'],
            inclusions: ['Royal Enfield 500cc', 'Mechanic support', 'Backup vehicle', 'Stay'],
            exclusions: ['Petrol', 'Bike security deposit', 'Lunch'],
            itinerary: [
                { title: 'Arrival in Leh', description: 'Acclimatization day.' },
                { title: 'Leh to Nubra Valley', description: 'Ride across Khardung La.' },
                { title: 'Nubra to Pangong Lake', description: 'A long ride along the Shyok river.' }
            ]
        }
    ];
    for (const trip of trips) {
        await prisma.trip.create({ data: trip });
    }
    console.log('Seed completed successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map