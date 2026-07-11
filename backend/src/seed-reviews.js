require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');

const reviews = [
    {
      userName: "Bhumit Rabadiya",
      city: "Ahmedabad",
      tripName: "Thailand Trip",
      comment: "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference!",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/bhumit.travels",
      userImage: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80"
    },
    {
      userName: "Janak Chauhan",
      city: "Surat",
      tripName: "Spiti Valley",
      comment: "Just few weeks back I took the trip to Spiti Valley with Youthcamping and believe me I had an amazing expedition of lifetime.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/janak_explorer",
      userImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80"
    },
    {
      userName: "Utsav Nathvani",
      city: "Rajkot",
      tripName: "Ladakh Expedition",
      comment: "It won't be wrong to say Youthcamping is synonymous with great adventures. And it also won't be wrong to say that you can...",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/utsav_nath",
      userImage: "https://images.unsplash.com/photo-1544621245-09893d567909?auto=format&fit=crop&q=80"
    },
    {
      userName: "Deep Bhansali",
      city: "Mumbai",
      tripName: "Spiti Valley",
      comment: "Spiti valley trip : Best experience, good facilities, group leader (Mayur vora) is also friendly and best service by Youthcamping.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/deep_vibe",
      userImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80"
    },
    {
      userName: "Krima Pandya",
      city: "Vadodara",
      tripName: "Ladakh Tour",
      comment: "Highly Recommended for tour booking. Everything was smoothly organized by SAGAR BUTANI. We had a great time in Ladakh.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/krima_travels",
      userImage: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80"
    },
    {
      userName: "Parth Patel",
      city: "Ahmedabad",
      tripName: "Spiti Valley Road Trip",
      comment: "Spiti trip was insane! Proper adventure + perfect management. Roads were crazy but team handled everything smoothly.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/parthpatell.315",
      userImage: "https://i.pravatar.cc/150?u=Parth%20Patel"
    },
    {
      userName: "Hemal Patel",
      city: "Ahmedabad",
      tripName: "Kerala Group Trip 2026",
      comment: "Kerala trip felt like a dream. Houseboat stay was the best part. Food and vibes were top notch.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/hemalpatelhere",
      userImage: "https://i.pravatar.cc/150?u=Hemal%20Patel"
    },
    {
      userName: "Neeki Diyali",
      city: "Ahmedabad",
      tripName: "Bhrigu Lake Trek",
      comment: "Bhrigu Lake trek was challenging but totally worth it. Snow views were unreal!",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/neeki_0606",
      userImage: "https://i.pravatar.cc/150?u=Neeki%20Diyali"
    },
    {
      userName: "Suresh Chaudhary",
      city: "Ahmedabad",
      tripName: "Spiti Valley Road Trip",
      comment: "Spiti Valley is not for beginners but this team made it very comfortable. Loved the experience.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/suru_chaudhary2927",
      userImage: "https://i.pravatar.cc/150?u=Suresh%20Chaudhary"
    },
    {
      userName: "Vidhi Thummar",
      city: "Ahmedabad",
      tripName: "Kerala Group Trip 2026",
      comment: "Kerala trip was peaceful and well planned. Perfect mix of chill and exploration.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/vidhiithummar",
      userImage: "https://i.pravatar.cc/150?u=Vidhi%20Thummar"
    },
    {
      userName: "Parth Patel",
      city: "Ahmedabad",
      tripName: "Spiti Valley Road Trip",
      comment: "Loved the Spiti circuit. Chandratal Lake was the highlight. Highly recommended.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/parthpatell.315",
      userImage: "https://i.pravatar.cc/150?u=Parth%20Patel"
    },
    {
      userName: "Hemal Patel",
      city: "Ahmedabad",
      tripName: "Bhrigu Lake Trek",
      comment: "Bhrigu trek was my first trek and I enjoyed every bit of it. Guides were very supportive.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/hemalpatelhere",
      userImage: "https://i.pravatar.cc/150?u=Hemal%20Patel"
    },
    {
      userName: "Neeki Diyali",
      city: "Ahmedabad",
      tripName: "Kerala Group Trip 2026",
      comment: "Kerala waterfalls and greenery were next level. Felt refreshed after this trip.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/neeki_0606",
      userImage: "https://i.pravatar.cc/150?u=Neeki%20Diyali"
    },
    {
      userName: "Suresh Chaudhary",
      city: "Ahmedabad",
      tripName: "Spiti Valley Road Trip",
      comment: "Amazing Spiti experience. Roads, mountains, monasteries — everything was perfect.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/suru_chaudhary2927",
      userImage: "https://i.pravatar.cc/150?u=Suresh%20Chaudhary"
    },
    {
      userName: "Vidhi Thummar",
      city: "Ahmedabad",
      tripName: "Bhrigu Lake Trek",
      comment: "Bhrigu Lake view was magical. Worth every step of the trek.",
      rating: 5,
      isFeatured: true,
      instagram: "https://instagram.com/vidhiithummar",
      userImage: "https://i.pravatar.cc/150?u=Vidhi%20Thummar"
    }
];

const seedReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Review Seeding...');

    await Review.deleteMany();
    await Review.insertMany(reviews);
    console.log('Reviews Seeded Successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedReviews();
