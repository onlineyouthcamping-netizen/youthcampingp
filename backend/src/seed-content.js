require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./models/Blog');
const Review = require('./models/Review');
const Trip = require('./models/Trip');

const blogs = [
  { title: "Walking the Frozen Zanskar", author: "Aman Sharma", readTime: "8 MIN READ", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2", hasVideo: true, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", content: "The Chadar Trek is not just a journey; it is a pilgrimage through ice..." },
  { title: "Dubai: Sand, Skyscraper & Soul", author: "Priya Das", readTime: "6 MIN READ", image: "https://images.unsplash.com/photo-1518684079-3c830d9ce16a", content: "Exploring the hidden alleys of Old Dubai away from the glitz..." },
  { title: "Spiti in Winter: Surviving -20°C", author: "Karan Johar", readTime: "12 MIN READ", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3", content: "The quietude of Spiti in winter is deafening. Here is how we lived..." },
  { title: "The Colors of Kasol", author: "Siddharth", readTime: "5 MIN READ", image: "https://images.unsplash.com/photo-1598214817158-99ed26703f83", content: "From Parvati river banks to Tosh, the vibe is unmatched..." },
  { title: "Vietnam on a Scooter", author: "Sneha", readTime: "10 MIN READ", image: "https://images.unsplash.com/photo-1528127269322-539801943592", content: "3000km, two wheels, and a lot of Pho. My Vietnam diary..." },
  { title: "Star-gazing in Hanle", author: "Rajesh", readTime: "7 MIN READ", image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa", content: "The clearest skies in India. Hanle was a dream for photography..." },
  { title: "Bali: Beyond the Beaches", author: "Megha", readTime: "9 MIN READ", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4", content: "Ubud monkey forest and the terrace farms were the highlights..." },
  { title: "Trekking to Kheerganga", author: "Rahul", readTime: "4 MIN READ", image: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7", content: "The hot water spring at the top is the reward for the climb..." },
  { title: "Iceland: The Land of Fire", author: "Vikram", readTime: "15 MIN READ", image: "https://images.unsplash.com/photo-1504893524553-f8591ce26c58", content: "Glaciers and Volcanoes. Iceland felt like another planet..." },
  { title: "Backpacking through Meghalaya", author: "Anjali", readTime: "8 MIN READ", image: "https://images.unsplash.com/photo-1500382017468-9049fee5c0ce", content: "The root bridges and the cleanest village in Asia. Magical Meghalaya..." }
];

const names = ["Aditi", "Rahul", "Sameer", "Kavita", "Arjun", "Neha", "Vikram", "Siddharth", "Megha", "Rohan"];
const comments = [
  "Absolutely life-changing trip! The organizers were top-notch and the group vibe was incredible.",
  "Never thought I could survive -20 degrees, but YouthCamping made it feel like home. Recommending to everyone!",
  "Professional, fun, and deeply immersive. This wasn't just a tour; it was an experience.",
  "The attention to detail was amazing. From food to stay, everything was perfect.",
  "Met some of my best friends on this trip. The itinerary was perfectly balanced.",
  "Worth every penny. The guides were local experts and shared so many hidden stories.",
  "Seamless booking process and even better execution. Can't wait for my next adventure!",
  "The photography spots they took us to were out of this world. Highly impressed.",
  "A safe and inclusive environment for solo travelers. Felt completely at ease.",
  "Exceeded all my expectations. The Spiti winter trip is a must-do for everyone."
];

const seedContent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Content Seeding...');

    // Seed Blogs
    await Blog.deleteMany();
    await Promise.all(blogs.map(b => Blog.create(b)));
    console.log('10 Blogs Seeded');

    // Seed Reviews
    await Review.deleteMany();
    const trips = await Trip.find();
    
    const reviewData = [];
    for (let i = 0; i < 50; i++) {
      const trip = trips[i % trips.length];
      reviewData.push({
        userName: names[Math.floor(Math.random() * names.length)] + " " + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + ".",
        userImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        rating: 5,
        comment: comments[Math.floor(Math.random() * comments.length)],
        tripId: trip ? trip._id : null,
        tripName: trip ? trip.title : "Mystery Trip",
        isFeatured: i < 6,
        createdAt: new Date(Date.now() - Math.random() * 10000000000)
      });
    }
    await Review.insertMany(reviewData);
    console.log('50 Reviews Seeded');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedContent();
