const http = require('http');

const reviews = [
  {
    userName: "Parth Patel",
    rating: 5,
    comment: "Absolutely magical experience, everything was smooth and perfectly managed.",
    instagram: "https://instagram.com/parthpatell.315",
    city: "Ahmedabad",
    tripName: "Kashmir"
  },
  {
    userName: "Hemal Patel",
    rating: 5,
    comment: "Loved the vibe, great stays and zero stress throughout the trip.",
    instagram: "https://instagram.com/hemalpatelhere",
    city: "Surat",
    tripName: "Manali Kasol"
  },
  {
    userName: "Zeel",
    rating: 5,
    comment: "Challenging trek but unforgettable views, totally worth it.",
    instagram: "https://instagram.com/_zeel_1608",
    city: "Vadodara",
    tripName: "Bhrigu Lake Trek"
  },
  {
    userName: "Vidhi",
    rating: 5,
    comment: "Snow, silence and stunning landscapes — once in a lifetime trip.",
    instagram: "https://instagram.com/vidhiithummar",
    city: "Rajkot",
    tripName: "Winter Spiti"
  },
  {
    userName: "Neeki",
    rating: 5,
    comment: "Peaceful and well-organized journey, felt safe and supported",
    instagram: "https://instagram.com/neeki_0606",
    city: "Mumbai",
    tripName: "Kedarnath"
  }
];

const postReview = (review) => {
  const data = JSON.stringify(review);
  
  const options = {
    hostname: 'localhost',
    port: 8888,
    path: '/api/reviews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
      console.log("[Status: " + res.statusCode + "] Added: " + review.userName);
      if (res.statusCode !== 201 && res.statusCode !== 200) {
        console.error("Error response:", responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error("Problem with request for " + review.userName + ": " + e.message);
  });

  req.write(data);
  req.end();
};

// Execute sequentially
reviews.forEach((review, index) => {
  setTimeout(() => {
    postReview(review);
  }, index * 500);
});

console.log("Starting to seed reviews...");
