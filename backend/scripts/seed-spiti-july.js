const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tripId = 'SPT-1';
  const departureDate = '2026-07-02T00:00:00.000Z';
  const departureDateShort = '2026-07-02';

  try {
    console.log('Seeding Spiti Valley July batch with exact passenger names...');

    // 1. Ensure the trip has this departure date available
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }

    let availableDates = Array.isArray(trip.availableDates) ? trip.availableDates : [];
    const dateExists = availableDates.some(d => (d.date || d) === departureDateShort);
    if (!dateExists) {
      availableDates.push({ date: departureDateShort, capacity: 99, bookedCount: 34 });
      await prisma.trip.update({
        where: { id: tripId },
        data: { availableDates }
      });
      console.log(`Added departure date ${departureDateShort} to trip availableDates`);
    }

    // 2. Clear any existing bookings for this departure to prevent duplicates
    const deleteRes = await prisma.booking.deleteMany({
      where: {
        tripId,
        departureDate
      }
    });
    console.log(`Cleared ${deleteRes.count} existing bookings for ${departureDateShort}`);

    // 3. Define the bookings to seed (34 participants across 10 bookings)
    const bookingsData = [
      {
        bookingId: 'BK-260518294643',
        name: 'Takshrajsinh Rana',
        email: 'takshrajsinhrana@gmail.com',
        phone: '+918866525115',
        amount: 47000,
        advancePaid: 10000,
        passengers: [
          { name: 'Mr Takshrajsinh Rana', gender: 'Male', age: 18, phone: '+918866525115', email: 'takshrajsinhrana@gmail.com', roomPreference: 'Double Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Chandramouli Patel', gender: 'Male', age: 17, phone: '+918320209404', email: '', roomPreference: 'Double Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260427292510',
        name: 'Hiya Hardik Shah',
        email: 'shahiya1008@gmail.com',
        phone: '+918160839603',
        amount: 235000,
        advancePaid: 50000,
        notes: 'Ahmedabad to Ahmedabad 3 tier Ac sleeper per person = 23500 /- stay = 3 room food = Breckfast and dinner included jain river rafting stay included',
        passengers: [
          { name: 'Miss Kanishka Chauhan', gender: 'Female', age: 17, phone: '+9173780934', email: 'kanishkachauhan220908@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Miss Vrisha Umrania', gender: 'Female', age: 17, phone: '+919879333699', email: 'vrisha1019@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Miss Mahi Solanki', gender: 'Female', age: 17, phone: '+919274712173', email: 'krishnaomicron@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Mr Ridham Solanki', gender: 'Male', age: 17, phone: '+917984285852', email: 'solankiiridham@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Mr Swayam Mandaliya', gender: 'Male', age: 17, phone: '+919723204508', email: 'soniswayam458@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Mr Jayraj Barad', gender: 'Male', age: 18, phone: '+917567755552', email: 'jayrajbarad567@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Mr Aarav Jayswal', gender: 'Male', age: 17, phone: '+919924101919', email: 'aaravjayswal2008@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Mr Dev Patel', gender: 'Male', age: 17, phone: '+919727897111', email: 'devp04291@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Miss Kamya Maheshwari', gender: 'Female', age: 17, phone: '+919213496021', email: 'kamyamaheshwari08@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' },
          { name: 'Miss Hiya Shah', gender: 'Female', age: 17, phone: '+918160839603', email: 'shahiya1008@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Jain Food' }
        ]
      },
      {
        bookingId: 'BK-260502292995',
        name: 'Diya Pareshbhai Gondaliya',
        email: 'gondaliyadiya06@gmail.com',
        phone: '+919925157331',
        amount: 71254.50,
        advancePaid: 34250,
        passengers: [
          { name: 'Miss Diya Makwana', gender: 'Female', age: 20, phone: '+918866117466', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Miss Diya Gondaliya', gender: 'Female', age: 20, phone: '+919925157331', email: 'gondaliyadiya06@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Miss Vishwa Solanki', gender: 'Female', age: 22, phone: '+918849430053', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260502293021',
        name: 'Rajveersinh Chauhan',
        email: 'rajveerchauhan1821@gmail.com',
        phone: '+919725292046',
        amount: 142499.70,
        advancePaid: 30500,
        passengers: [
          { name: 'Mr Earth Patel', gender: 'Male', age: 22, phone: '+919265920925', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Harsh Verma', gender: 'Male', age: 22, phone: '+919712345678', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Abhikum Patel', gender: 'Male', age: 22, phone: '+919712345679', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Rajveersinh Chauhan', gender: 'Male', age: 22, phone: '+919725292046', email: 'rajveerchauhan1821@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Aakash Bhatt', gender: 'Male', age: 22, phone: '+919712345680', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Mehta Mineshkumar', gender: 'Male', age: 22, phone: '+919712345681', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260505293294',
        name: 'Miksha M Patel',
        email: 'patel.miksha@yahoo.in',
        phone: '+918128730687',
        amount: 108010.35,
        advancePaid: 15750,
        passengers: [
          { name: 'Miss Keshaben Patel', gender: 'Female', age: 20, phone: '+918128730687', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Miss Miksha Patel', gender: 'Female', age: 20, phone: '+918128730688', email: 'patel.miksha@yahoo.in', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Miss Jyotikaben Patel', gender: 'Female', age: 20, phone: '+918128730689', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260511293820',
        name: 'Shasan Kalpeshkumar Shah',
        email: 'shasanks92@gmail.com',
        phone: '+919023276710',
        amount: 117500.25,
        advancePaid: 15000,
        passengers: [
          { name: 'Mr Shasan Shah', gender: 'Male', age: 25, phone: '+919023276710', email: 'shasanks92@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Yash Mehta', gender: 'Male', age: 25, phone: '+919023276711', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Divy Mehta', gender: 'Male', age: 25, phone: '+919023276712', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Vansh Mehta', gender: 'Male', age: 25, phone: '+919023276713', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Veer Shah', gender: 'Male', age: 25, phone: '+919023276714', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' },
          { name: 'Mr Harsh Gandhi', gender: 'Male', age: 25, phone: '+919023276715', email: '', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260512293964',
        name: 'Tharunkumar Uthamchand',
        email: 'smartsingam@gmail.com',
        phone: '+918610400438',
        amount: 23000.25,
        advancePaid: 7000,
        passengers: [
          { name: 'Mr Tharunkumar Uthamchand', gender: 'Male', age: 24, phone: '+918610400438', email: 'smartsingam@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260515294290',
        name: 'Tushar Mahida',
        email: 'tusharmahida776@gmail.com',
        phone: '+919313592637',
        amount: 23749.95,
        advancePaid: 10000,
        passengers: [
          { name: 'Mr Tushar Mahida', gender: 'Male', age: 21, phone: '+919313592637', email: 'tusharmahida776@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260516294371',
        name: 'Tirth Charola',
        email: 'tirthcharola@gmail.com',
        phone: '+919313592699',
        amount: 23500,
        advancePaid: 5000,
        passengers: [
          { name: 'Mr Tirth Charola', gender: 'Male', age: 21, phone: '+919313592699', email: 'tirthcharola@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      },
      {
        bookingId: 'BK-260516294379',
        name: 'Krishiv Rajiv Gor',
        email: 'gorkrishiv3@gmail.com',
        phone: '+918200304255',
        amount: 23500.50,
        advancePaid: 5000,
        passengers: [
          { name: 'Mr Krishiv Gor', gender: 'Male', age: 18, phone: '+918200304255', email: 'gorkrishiv3@gmail.com', roomPreference: 'Triple Sharing', foodPreference: 'Normal Food' }
        ]
      }
    ];

    // 4. Insert the bookings into the database
    for (const b of bookingsData) {
      await prisma.booking.create({
        data: {
          bookingId: b.bookingId,
          tenantId: 'default',
          tripId,
          tripName: trip.title,
          departureDate,
          name: b.name,
          email: b.email,
          phone: b.phone,
          amount: b.amount,
          advancePaid: b.advancePaid,
          paymentStatus: 'Partial',
          status: 'Confirmed',
          notes: b.notes || '',
          passengers: b.passengers
        }
      });
      console.log(`Created booking ${b.bookingId} for ${b.name}`);
    }

    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
