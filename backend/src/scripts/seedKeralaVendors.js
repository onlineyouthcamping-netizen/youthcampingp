const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Vendor = require('../models/Vendor');
const TripVendor = require('../models/TripVendor');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const vendorsData = [
    {
        name: 'Lake and Hills',
        type: 'hotel',
        phone: '96568 44800',
        location: 'Munnar',
        agreedCost: 4800, // 28800 / 6
        paidAmount: 4800,
        notes: 'Cost per person (6 pax total). Original Total: ₹28,800. Paid in full.'
    },
    {
        name: 'Coffee Routes',
        type: 'hotel',
        phone: '70127 57383',
        location: 'Thekkady',
        agreedCost: 2250, // 13500 / 6
        paidAmount: 2250,
        notes: 'Cost per person (6 pax total). Original Total: ₹13,500. Paid in full.'
    },
    {
        name: 'Royal Rivers Alleppey',
        type: 'hotel',
        phone: '62354 22211',
        location: 'Alleppey',
        agreedCost: 2750, // 16500 / 6
        paidAmount: 2750,
        notes: 'Cost per person (6 pax total). Original Total: ₹16,500. Paid in full.'
    },
    {
        name: 'Faizal (Innova Crysta)',
        type: 'transport',
        phone: '8139090390',
        location: 'Kerala',
        agreedCost: 3567, // 21400 / 6
        paidAmount: 3567,
        notes: 'Cost per person (6 pax total). Original Total: ₹21,400. Paid in full.'
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find the Kerala trip
        let trip = await Trip.findOne({ $or: [{ id: 'kerala-getaway' }, { title: /Kerala/i }] });
        if (!trip) {
            console.log('Kerala trip not found, creating a placeholder...');
            trip = await Trip.create({
                id: 'kerala-getaway',
                title: 'Kerala Getaway',
                location: 'Kerala',
                price: 15999,
                duration: '4 Nights 5 Days',
                description: 'Kerala tour for 06 persons',
                status: 'published'
            });
        }
        console.log(`Using Trip: ${trip.title} (${trip._id})`);

        for (const data of vendorsData) {
            // 2. Find or create vendor
            let vendor = await Vendor.findOne({ name: data.name });
            if (!vendor) {
                vendor = await Vendor.create({
                    name: data.name,
                    type: data.type,
                    phone: data.phone,
                    location: data.location
                });
                console.log(`Created Vendor: ${vendor.name}`);
            } else {
                console.log(`Vendor already exists: ${vendor.name}`);
            }

            // 3. Associate with trip in TripVendor
            const tripVendor = await TripVendor.findOneAndUpdate(
                { tripId: trip._id, vendorId: vendor._id },
                {
                    agreedCost: data.agreedCost,
                    paidAmount: data.paidAmount,
                    paymentStatus: 'paid',
                    notes: data.notes
                },
                { upsert: true, new: true }
            );
            console.log(`Updated TripVendor entry for ${vendor.name}`);
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
