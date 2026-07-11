const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to slugify names
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const ATTRACTIONS = [
  // ==========================================
  // MANALI KASOL AMRITSAR (17 Attractions)
  // ==========================================
  {
    name: "Golden Temple",
    destination: "Manali Kasol Amritsar",
    category: "Spiritual",
    location: "Amritsar, Punjab",
    altitude: "756 ft",
    bestTime: "October to March",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=800",
    description: "The Golden Temple, or Sri Harmandir Sahib, is the spiritual heart of Sikhism and a symbol of human equality. Surrounded by the sacred waters of the Amrit Sarovar, this stunning structure is covered in pure 24-karat gold. The temple stands as a testament to peace, welcoming travelers from all walks of life. Visitors can witness the deep spiritual prayers, experience the serene reflections over the water, and partake in the Langar—the world's largest community kitchen serving free vegetarian meals to over 100,000 people daily.",
    etiquette: [
      "Cover your head with a scarf at all times inside the premises",
      "Remove your shoes and wash your feet at the entrance pools",
      "Maintain silence and respect the spiritual ambiance near the sarovar",
      "Photography is strictly prohibited inside the main sanctum"
    ],
    faqs: [
      { question: "Is the Langar food free for everyone?", answer: "Yes, the kitchen serves free vegetarian meals to all visitors 24/7 without discrimination." },
      { question: "What is the best time to visit the temple?", answer: "While open all day, visiting during the early morning Palki Sahib ceremony or late at night when the temple is illuminated offers a magical experience." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Wagah Border ceremony",
    destination: "Manali Kasol Amritsar",
    category: "Cultural",
    location: "Amritsar, Punjab",
    altitude: "750 ft",
    bestTime: "October to April",
    visitingHours: "4:00 PM - 5:30 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1590483734724-383b853b3178?auto=format&fit=crop&q=80&w=800",
    description: "The Wagah Border ceremony is an intense and energetic daily military practice performed by the border security forces of India and Pakistan. Located 30 km from Amritsar, this Beating Retreat ceremony marks the formal closure of the international border gates at sunset. The performance is defined by high-stepping military drills, loud foot stomping, and coordinate lowering of the national flags. Surrounded by cheering, patriotic crowds waving flags and chanting, the atmosphere is electric and stands as an unforgettable highlight of North Indian travel.",
    etiquette: [
      "Arrive at least 1.5 to 2 hours early to secure good seats in the stadium",
      "Bags, food items, and large camera cases are not allowed inside; carry only phones and wallets",
      "Follow BSF personnel guidelines and maintain public order",
      "Ensure you keep your travel documents handy if requested by security"
    ],
    faqs: [
      { question: "Do we need pre-booked tickets?", answer: "No, entry is free and on a first-come, first-served basis, although VIP passes can sometimes be arranged via officials." },
      { question: "How far is the border from Amritsar city?", answer: "It is approximately 30 km away and takes around 45 to 50 minutes to reach via the Grand Trunk Road." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Jallianwala Bagh",
    destination: "Manali Kasol Amritsar",
    category: "Historical",
    location: "Amritsar, Punjab",
    altitude: "750 ft",
    bestTime: "Year-round",
    visitingHours: "6:30 AM - 7:30 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1588096344356-9b6d859d57a9?auto=format&fit=crop&q=80&w=800",
    description: "Jallianwala Bagh is a historic memorial garden of national importance located in the vicinity of the Golden Temple complex. It commemorates the tragic massacre of hundreds of peaceful Indian civilians by British occupation forces on April 13, 1919. Today, the garden is a place of quiet reflection, featuring the original bullet-marked walls, the Martyrs' Well where people jumped to save themselves, and a majestic eternal flame memorial. The site is a poignant reminder of India's struggle for independence and is beautifully preserved.",
    etiquette: [
      "Maintain a quiet and respectful demeanor as this is a memorial site",
      "Do not litter or damage the historical structures or gardens",
      "Avoid shouting or making loud noises inside the premises",
      "Respect the sanctity of the Martyrs' Well and the memorial monument"
    ],
    faqs: [
      { question: "How much time is needed to visit Jallianwala Bagh?", answer: "Usually, 30 to 45 minutes is enough to walk through the gardens, view the exhibits, and read the history plaques." },
      { question: "Is it close to the Golden Temple?", answer: "Yes, it is just a 5-minute walk from the main entrance of the Golden Temple." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Manikaran Gurudwara",
    destination: "Manali Kasol Amritsar",
    category: "Spiritual",
    location: "Parvati Valley, Himachal Pradesh",
    altitude: "5,700 ft",
    bestTime: "April to June, September to November",
    visitingHours: "5:00 AM - 9:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
    description: "Perched along the roaring Parvati River, Manikaran Sahib is a highly revered pilgrimage center for both Sikhs and Hindus. Famous for its natural, therapeutic hot sulphur springs, the Gurudwara is built directly over these thermal channels. The water is so hot that the Langar meals are cooked directly in the steaming pools. Pilgrims gather here to bathe in the healing waters, which are believed to cure skin diseases and joint pains, while enjoying the majestic pine-covered mountain backdrops.",
    etiquette: [
      "Cover your head with a headscarf inside the Gurudwara complex",
      "Maintain distance and follow guidelines in the separate hot spring bathing pools for men and women",
      "Remove footwear and wash your hands and feet before entering the worship area",
      "Be careful around the boiling water pools as the temperature is extremely high"
    ],
    faqs: [
      { question: "Are the hot springs safe to bathe in?", answer: "Yes, the indoor pools have regulated temperatures, making it safe and highly relaxing to soak in." },
      { question: "Can we get food there?", answer: "Yes, the Gurudwara serves hot Langar meals cooked in the geothermal hot springs throughout the day." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Kasol Market & cafes",
    destination: "Manali Kasol Amritsar",
    category: "Cultural",
    location: "Kasol, Himachal Pradesh",
    altitude: "5,180 ft",
    bestTime: "March to June, October to December",
    visitingHours: "9:00 AM - 10:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
    description: "Kasol, often called the 'Mini Israel of India,' is a vibrant, bohemian hamlet nestled in the Parvati Valley. The bustling local market is famous for its hipster apparel, hand-woven woolens, semi-precious jewelry, and incense. What makes Kasol truly legendary is its thriving cafe culture, serving authentic Israeli, Italian, and local Himachali cuisine. Nestled among towering deodar forests, travelers gather here to enjoy delicious food, listen to psychedelic music, and experience the laid-back, international backpacker vibe that flows through the valley.",
    etiquette: [
      "Respect local Himachali culture and customs, especially when interacting with villagers",
      "Keep the local environment clean; avoid littering plastic in the forest and valley",
      "Ask permission before photographing local residents or their properties",
      "Be courteous when bargaining in the market; support local artisans fairly"
    ],
    faqs: [
      { question: "What are some must-try foods in Kasol cafes?", answer: "Do not miss trying Shakshuka, Schnitzel, Falafel, and fresh trout fish, alongside specialized ginger-lemon-honey tea." },
      { question: "Is digital payment accepted in Kasol Market?", answer: "Yes, UPI and card payments are widely accepted, though carrying some cash is recommended due to sporadic network issues." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chalal Village trek",
    destination: "Manali Kasol Amritsar",
    category: "Trek",
    location: "Parvati Valley, Himachal Pradesh",
    altitude: "5,300 ft",
    bestTime: "April to June, September to November",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
    description: "The Chalal Village trek is a short, scenic hike that starts from Kasol and snakes along the beautiful Parvati River. The trail leads through a rustic suspension bridge and under a dense canopy of tall pine and deodar trees. Spanning just 2.5 kilometers, the trek is relatively easy and reveals scenic, untouched mountain villages, small cannabis fields, and cozy riverside cafes. Known for its music festivals and trance cafes, Chalal offers a serene escape into nature while maintaining a lively, alternative vibe.",
    etiquette: [
      "Do not litter on the trail; carry your plastic trash back to Kasol for proper disposal",
      "Stick to the marked trail and avoid venturing into dense private orchards",
      "Do not pluck local flowers, crops, or plants",
      "Respect the silence of the village and keep music levels low while walking"
    ],
    faqs: [
      { question: "How long does the Chalal trek take?", answer: "It is a 30 to 45-minute easy walk each way, making it perfect for a morning or late afternoon hike." },
      { question: "Do we need a guide for this trek?", answer: "No, the path is well-defined and runs parallel to the river, making it very easy to navigate on your own." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Bijli Mahadev Trek",
    destination: "Manali Kasol Amritsar",
    category: "Trek",
    location: "Kullu Valley, Himachal Pradesh",
    altitude: "8,000 ft",
    bestTime: "April to June, September to November",
    visitingHours: "6:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800",
    description: "The Bijli Mahadev Trek is one of the most stunning short treks in the Kullu Valley, leading to a sacred hilltop temple dedicated to Lord Shiva. The trek features a climb through dense forests of pine and deodar, opening up to expansive green meadows at the top. The temple is famous for its 60-foot-high staff that attracts divine lightning, which periodically shatters the Shiva Lingam, only for it to be restored with butter by the temple priests. The summit offers a breathtaking 360-degree view of the Parvati and Kullu valleys.",
    etiquette: [
      "Wear sturdy trekking shoes as the trail has steep stairs and forest sections",
      "Avoid consuming alcohol or carrying non-vegetarian food near the sacred temple premises",
      "Dispose of plastic and trash only in designated dustbins at the summit",
      "Maintain silence and respect local rituals at the temple"
    ],
    faqs: [
      { question: "What is the difficulty level of the trek?", answer: "It is an easy to moderate trek. The climb takes about 2 to 3 hours, featuring a mix of stairs and gradual forest slopes." },
      { question: "Is there water and food available on the trek?", answer: "Yes, there are several small shops and tea stalls along the trail and at the top serving snacks and refreshments." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Paragliding (Manali/Kullu)",
    destination: "Manali Kasol Amritsar",
    category: "Adventure",
    location: "Kullu, Himachal Pradesh",
    altitude: "8,000 ft",
    bestTime: "March to June, October to December",
    visitingHours: "9:00 AM - 4:00 PM",
    entryFee: "₹3,000 - ₹3,500 (Optional Paid Activity)",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Soar high like a bird over the snow-capped peaks and winding rivers of the Kullu Valley with paragliding. The take-off point in Kullu is one of the highest paragliding spots in the region, offering a thrilling 10 to 15-minute tandem flight with experienced pilots. The panoramic, bird's-eye views of the green forests, terraced fields, and the roaring Beas River below make it a must-try adventure for adrenaline seekers looking to experience the true majesty of the Himalayas from the sky.",
    etiquette: [
      "Carefully listen to the safety briefing and instructions provided by the pilot",
      "Wear tight-fitting sports shoes and warm windproof jackets",
      "Double-check your harness and helmet locks before take-off",
      "Do not attempt to touch the paraglider strings or disrupt the pilot during the flight"
    ],
    faqs: [
      { question: "Is paragliding safe for beginners?", answer: "Yes, all flights are tandem, meaning you fly with a certified, highly experienced pilot who handles all controls." },
      { question: "Are there weight limits for paragliding?", answer: "Yes, the standard weight limit is usually between 35 kg and 95 kg for safety reasons." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "White water rafting (Kullu)",
    destination: "Manali Kasol Amritsar",
    category: "Adventure",
    location: "Kullu, Himachal Pradesh",
    altitude: "4,000 ft",
    bestTime: "April to June, September to October",
    visitingHours: "9:00 AM - 5:00 PM",
    entryFee: "Included in Package",
    image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&q=80&w=800",
    description: "Get ready for a thrilling ride on the cold, rushing rapids of the Beas River in Kullu. The 8-kilometer river rafting stretch features a mix of Grade II and III rapids, offering the perfect combination of excitement and safety. Under the guidance of certified instructors, teams paddle through churning waves, flanked by spectacular views of alpine forests and towering cliffs. The cold splash of glacial water and the teamwork required to navigate the river make it an unforgettable group adventure.",
    etiquette: [
      "Wear the life jacket and helmet at all times while on the raft",
      "Securely tuck in loose clothes and wear waterproof footwear or sandals",
      "Pay close attention to the guide's commands for paddling forward, backward, or holding on",
      "Do not carry expensive electronics, jewelry, or wallets on the raft; store them in the dry bags"
    ],
    faqs: [
      { question: "Do I need to know swimming for river rafting?", answer: "No, swimming is not required as you wear high-buoyancy life jackets and are accompanied by professional rescue guides." },
      { question: "Is rafting available during monsoons?", answer: "No, river rafting is suspended from July to mid-September due to high water levels and heavy rains." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Solang Valley",
    destination: "Manali Kasol Amritsar",
    category: "Adventure",
    location: "Manali, Himachal Pradesh",
    altitude: "8,400 ft",
    bestTime: "Year-round (Winters for snow, summers for green meadows)",
    visitingHours: "9:00 AM - 6:00 PM",
    entryFee: "Free (Activities Paid on Site)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Solang Valley, located 14 km from Manali, is the adventure capital of Himachal Pradesh. Famous for its sweeping green meadows in summer and deep snow blankets in winter, it offers a wide range of activities. Visitors can try zorbing, quad biking, horse riding, and skiing. A cable car ride takes you up to Mt. Phatru, offering breathtaking views of the glaciers and snow-clad Himalayan peaks. It is a picturesque playground perfect for families and adventure seekers alike.",
    etiquette: [
      "Bargain politely for activity rates and verify safety equipment before participating",
      "Keep the valley clean; dispose of snack wrappers and plastic bottles in trash bins",
      "Stick to designated paths to avoid getting in the way of quad bikes or skiers",
      "Dress in warm layers during winters; snow suits are available on rent nearby"
    ],
    faqs: [
      { question: "When is the best time to see snow in Solang Valley?", answer: "Snow activities are best experienced from December to February, when the entire valley is covered in thick snow." },
      { question: "Are adventure activities included in the package?", answer: "No, entry to the valley is free, but individual rides like ATV, zorbing, and skiing are paid directly to local vendors." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Atal Tunnel (Rohtang)",
    destination: "Manali Kasol Amritsar",
    category: "Sightseeing",
    location: "Manali to Lahaul Valley, Himachal Pradesh",
    altitude: "10,040 ft",
    bestTime: "May to November (Accessible year-round)",
    visitingHours: "24 Hours (Subject to weather checks)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800",
    description: "The Atal Tunnel is an engineering marvel and the world's longest highway tunnel above 10,000 feet. Spanning 9.02 kilometers, it cuts through the Pir Panjal range of the Himalayas, connecting Manali to the high-altitude Lahaul and Spiti valleys. Passing through the tunnel is a surreal experience as you enter a dark, state-of-the-art structure and emerge on the other side to a completely different, barren, and majestic landscape of the cold desert. It has revolutionized travel in the region.",
    etiquette: [
      "Adhere strictly to the speed limit inside the tunnel (usually 60 km/h)",
      "Do not stop, park, or step out of your vehicle inside the tunnel under any circumstances",
      "Keep headlights on low beam and maintain a safe distance from other vehicles",
      "Do not litter or write on the tunnel walls"
    ],
    faqs: [
      { question: "How long does it take to cross the tunnel?", answer: "It takes about 10 to 12 minutes to drive through the 9-kilometer tunnel." },
      { question: "Does it remain open in winters?", answer: "Yes, it is designed to remain open throughout the year, though heavy snowfall at the portals can occasionally trigger brief closures." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Sissu village",
    destination: "Manali Kasol Amritsar",
    category: "Village",
    location: "Lahaul Valley, Himachal Pradesh",
    altitude: "10,200 ft",
    bestTime: "May to October, January to February for snow",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&q=80&w=800",
    description: "Sissu is a postcard-perfect Himalayan village located just beyond the northern portal of the Atal Tunnel in the Lahaul Valley. Flanked by the fast-flowing Chandra River, the village is famous for the majestic Palden Lhamo waterfall, which cascades down a steep cliff. Sissu is surrounded by fields of potatoes, barley, and poplars, turning bright gold in autumn and deep white in winter. It offers a peaceful, untouched look into Lahauli culture, away from the commercial crowds of Manali.",
    etiquette: [
      "Respect the privacy of local residents and do not enter private agricultural fields without permission",
      "Keep the village clean; Lahaul is a sensitive eco-zone, so minimize plastic waste",
      "Ask before taking close-up portraits of the locals, especially children",
      "Be prepared for colder temperatures and wear windproof layers"
    ],
    faqs: [
      { question: "What is the main attraction in Sissu?", answer: "The Sissu Waterfall (Palden Lhamo), the riverbed walks, and the lakeside adventure parks are the top spots to explore." },
      { question: "Is there mobile connectivity in Sissu?", answer: "Jio and Airtel work reasonably well, but other networks might have weak signals beyond the tunnel." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Jogini Waterfall Trek",
    destination: "Manali Kasol Amritsar",
    category: "Trek",
    location: "Vashisht, Manali, Himachal Pradesh",
    altitude: "7,300 ft",
    bestTime: "March to June, September to November",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=800",
    description: "The Jogini Waterfall Trek is a beautiful, scenic trail that winds through apple orchards, tall pine forests, and small mountain streams. Starting from the historic Vashisht Village, the 3-kilometer hike leads to the foot of a spectacular, 160-foot-tall waterfall cascading down a cliff. The pool at the bottom is sacred to local villagers, who worship the goddess Jogini. The mist from the waterfall, the sound of rushing water, and the panoramic views of the Beas River and snow peaks make it a highly refreshing experience.",
    etiquette: [
      "Wear shoes with good grip as the trail near the waterfall can get muddy and slippery",
      "Do not bathe or swim in the pool directly below the waterfall, as it is considered sacred and can be dangerous",
      "Avoid throwing trash along the forest trail; carry it back with you",
      "Respect local shrines and small temples built along the route"
    ],
    faqs: [
      { question: "How long does the trek take?", answer: "It takes about 1 to 1.5 hours to climb up from Vashisht temple, depending on your pace." },
      { question: "Is it suitable for children and seniors?", answer: "The trek is of easy difficulty, but it does feature some rocky steps and climbs, so moderate fitness is helpful." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Hadimba Devi Temple",
    destination: "Manali Kasol Amritsar",
    category: "Historical",
    location: "Dhungri, Manali, Himachal Pradesh",
    altitude: "6,700 ft",
    bestTime: "Year-round",
    visitingHours: "8:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1601934371720-6d42df2252a1?auto=format&fit=crop&q=80&w=800",
    description: "Nestled amidst a dense forest of giant deodar trees in Dhungri, the Hadimba Devi Temple is an ancient wooden structure of immense historical and religious importance. Built in 1553, this unique four-tiered pagoda-style temple is dedicated to Hadimba, the wife of Bhima from the epic Mahabharata. The temple features intricate wood carvings of mythological characters and animals, with a sacred rock cave inside instead of an idol. It stands as a timeless symbol of Manali's rich heritage.",
    etiquette: [
      "Remove your leather items, belts, and shoes before stepping onto the temple platform",
      "Do not touch the ancient wooden pillars and carvings inside the temple",
      "Stand in queue quietly during busy darshan hours",
      "Avoid feeding the local rabbits and yaks brought by vendors without checking safety"
    ],
    faqs: [
      { question: "What is the significance of the temple?", answer: "It is dedicated to Hadimba Devi, who is considered the patron deity of Manali. The temple is unique because it features pagoda architecture rather than classical Indian style." },
      { question: "Are there entry fees?", answer: "No, entry to the temple and the surrounding Dhungri forest is completely free." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Mall Road Manali",
    destination: "Manali Kasol Amritsar",
    category: "Sightseeing",
    location: "Manali, Himachal Pradesh",
    altitude: "6,725 ft",
    bestTime: "Year-round",
    visitingHours: "9:00 AM - 10:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&q=80&w=800",
    description: "Mall Road is the vibrant, beating heart of Manali town, serving as the main promenade for shopping, dining, and social activity. The vehicle-free street is lined with a variety of shops selling authentic Tibetan handicrafts, wooden toys, dry fruits, and hand-woven Himachali shawls. The street is also a foodie's delight, offering local Himachali street food, hot momos, and multi-cuisine restaurants. With snow-capped peaks in the background, it is the perfect place for a leisurely evening walk.",
    etiquette: [
      "Vehicles are not allowed on the main Mall Road; park in designated municipal parking lots",
      "Keep the street clean and use the public garbage bins placed along the walk",
      "Be aware of pickpockets in crowded market sections during peak tourist seasons",
      "Support local vendors and shops; follow fixed price norms where stated"
    ],
    faqs: [
      { question: "What can we buy on Mall Road?", answer: "Wooden items, woolens, saffron, dry fruits, prayer wheels, and Tibetan stone jewelry are popular purchases." },
      { question: "Is the market open on all days?", answer: "Yes, though individual shops might choose to close early on certain weekdays or national holidays." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Vashisht Hot Springs",
    destination: "Manali Kasol Amritsar",
    category: "Spiritual",
    location: "Vashisht, Manali, Himachal Pradesh",
    altitude: "7,000 ft",
    bestTime: "October to May",
    visitingHours: "7:00 AM - 1:00 PM, 2:00 PM - 9:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
    description: "Located across the Beas River, Vashisht Village is famous for its natural hot sulphur springs situated inside the ancient Vashisht Temple complex. The water flows from geothermal vents and is rich in minerals, believed to have therapeutic properties that heal skin ailments and relax tired muscles. The temple itself is dedicated to Sage Vashisht, the guru of Lord Rama. Separate public bathing tanks are provided for men and women, offering a unique, cultural soak in hot water amidst the cool Himalayan mountain breeze.",
    etiquette: [
      "Wash your hands and feet before entering the temple and bathing areas",
      "Bring your own towels and a change of clothes if you plan to soak in the hot springs",
      "Dress modestly when entering the temple complex",
      "Maintain cleanliness in the water pools and changing rooms"
    ],
    faqs: [
      { question: "Is it safe to bathe in the sulphur springs?", answer: "Yes, the water is natural and clean, but people with cardiovascular issues should consult a doctor before long soaks due to the heat." },
      { question: "Is it crowded?", answer: "Yes, it is very popular among pilgrims and travelers, so visiting early in the morning is highly recommended for peace." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Rope adventure activities",
    destination: "Manali Kasol Amritsar",
    category: "Adventure",
    location: "Manali Campsite, Himachal Pradesh",
    altitude: "6,500 ft",
    bestTime: "April to June, September to November",
    visitingHours: "9:00 AM - 5:00 PM",
    entryFee: "Included in Package",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Challenge your limits and bond with your fellow travelers with a range of rope adventure activities at our campsite. Under the supervision of trained instructors, guests can experience rock climbing, the Burma bridge, zip-lining, and commando nets. These activities are designed to build confidence and coordination while enjoying the fresh mountain air. Flanked by tall trees and mountain streams, it is a fun, complimentary experience that adds a thrilling camp vibe to your journey.",
    etiquette: [
      "Listen carefully to safety briefings and wear all safety harness gear properly",
      "Do not attempt any rope course without a certified instructor present",
      "Cheer on your group members and maintain a supportive, positive attitude",
      "Inform the instructors beforehand of any medical conditions or physical limitations"
    ],
    faqs: [
      { question: "Are these activities safe for children?", answer: "Yes, they are conducted with high-safety harnesses and are fully supervised by experienced camp guides." },
      { question: "Is there an extra charge for these activities?", answer: "No, they are fully complimentary as part of our premium camping experience." }
    ],
    includedPaid: "Included"
  },

  // ==========================================
  // SPITI VALLEY (15 Attractions)
  // ==========================================
  {
    name: "Mall Road Shimla",
    destination: "Spiti Valley",
    category: "Sightseeing",
    location: "Shimla, Himachal Pradesh",
    altitude: "7,200 ft",
    bestTime: "March to June, October to December",
    visitingHours: "9:00 AM - 10:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1562916600-23a98ab05531?auto=format&fit=crop&q=80&w=800",
    description: "The Mall Road in Shimla is a legendary colonial-era promenade that serves as the social and commercial center of Himachal's capital. Completely free of vehicular traffic, the wide street is flanked by Tudor and neo-Gothic heritage buildings, classic cafes, and local handloom shops. Walking down the Mall leads to 'The Ridge,' offering panoramic views of the snow-clad Himalayas. Illuminated by vintage street lamps at night, it offers a nostalgic charm and is the perfect starting point for any high-altitude Himachali journey.",
    etiquette: [
      "Smoking and littering are strictly prohibited on the Mall Road and attract heavy fines",
      "Vehicles, including cycles, are banned to keep the walk pedestrian-friendly",
      "Do not feed the local monkeys on the Ridge; they can get aggressive",
      "Follow traffic directions and preserve the historical heritage"
    ],
    faqs: [
      { question: "Where can we park our vehicles?", answer: "Vehicles must be parked at the multi-level parking lots near the lift, and you can take the municipal lift up to the Mall Road." },
      { question: "What are the historic landmarks nearby?", answer: "The Christ Church (second oldest in North India), Gaiety Theatre, and Town Hall are located right on the Ridge and Mall Road." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chitkul village",
    destination: "Spiti Valley",
    category: "Village",
    location: "Kinnaur Valley, Himachal Pradesh",
    altitude: "11,320 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
    description: "Chitkul is a dreamlike, remote village nestled on the banks of the Baspa River, famously known as the last inhabited village on the Indo-Tibetan border. Surrounded by snow-covered mountains, mustard fields, and apple orchards, the village features traditional wooden houses with slate roofs and a beautiful temple dedicated to the goddess Mathi. Travelers visit Chitkul to walk along the riverbed, taste food at the 'Hindustan ka Aakhri Dhaba' (India's Last Dhaba), and soak in the raw, serene beauty of this border paradise.",
    etiquette: [
      "Do not litter; Chitkul is an ecologically sensitive border zone with no waste treatment plants",
      "Respect the local culture and do not touch the inner sanctum of the Mathi Temple",
      "Dress warmly as wind speeds are very high and temperatures drop quickly",
      "Avoid clicking photos of defense posts or military personnel near the border checkposts"
    ],
    faqs: [
      { question: "Is the Indo-Tibetan border open for tourists?", answer: "You can travel up to Chitkul village freely, but the actual border line is 20 km ahead and is guarded by the ITBP, requiring special military permits." },
      { question: "Does it snow in Chitkul?", answer: "Yes, Chitkul receives heavy snow and remains closed from December to April due to blocked roads." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Nako Lake",
    destination: "Spiti Valley",
    category: "Lake",
    location: "Kinnaur, Himachal Pradesh",
    altitude: "11,811 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Nako Lake is a high-altitude, mystical lake situated in the quiet village of Nako in the upper Kinnaur district. Flanked by willow and poplar trees, the lake is surrounded by barren, wind-swept mountains and historic Buddhist temples. The water is pristine, reflecting the clear blue skies and the dramatic mountains. It is considered sacred by the locals, and legend says Guru Padmasambhava meditated here, leaving footprints on a rock nearby. In winter, the lake freezes completely, turning into a natural ice rink.",
    etiquette: [
      "Do not litter, wash clothes, or throw anything into the sacred lake water",
      "Walk clockwise around the lake and the local Buddhist stupas out of respect",
      "Avoid making loud noises; Nako is a peaceful, meditative monastic village",
      "Do not step on the thin ice if the lake is frozen in winter; it can be dangerous"
    ],
    faqs: [
      { question: "What is there to see in Nako village?", answer: "Besides the lake, you can explore the 11th-century Nako Monastery and hike up to the village viewpoint for stunning valley views." },
      { question: "Can we boat in Nako Lake?", answer: "No, boating is not allowed as the lake is considered sacred by the Buddhist community." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Tabo Monastery",
    destination: "Spiti Valley",
    category: "Historical",
    location: "Tabo, Spiti Valley, Himachal Pradesh",
    altitude: "10,760 ft",
    bestTime: "May to October",
    visitingHours: "6:00 AM - 5:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1588096344356-9b6d859d57a9?auto=format&fit=crop&q=80&w=800",
    description: "Tabo Monastery, founded in 996 AD, is a UNESCO World Heritage site and the oldest continuously operating Buddhist monastery in India. Often called the 'Ajanta of the Himalayas,' the monastery complex is famous for its simple mud brick structures that house ancient wall paintings, frescoes, and clay statues of Buddhist deities. The artwork is exceptionally preserved due to the cold, dry climate. The monastery stands as a monumental center for Buddhist study and is highly revered by His Holiness the Dalai Lama.",
    etiquette: [
      "Remove your shoes before entering the dark prayer halls and temple chambers",
      "Photography is strictly prohibited inside the historical mud temple rooms to protect the ancient frescoes",
      "Walk around the stupas and prayer wheels in a clockwise direction",
      "Maintain absolute silence and do not touch the ancient murals or statues"
    ],
    faqs: [
      { question: "Why is it called the Ajanta of the Himalayas?", answer: "It earned this name because of the ancient, detailed frescoes and clay sculptures inside its dark mud chambers, which resemble the Ajanta Caves in Maharashtra." },
      { question: "Are there caves nearby?", answer: "Yes, the Tabo caves are located on the cliffs overlooking the monastery, where monks used to meditate." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Dhankar Village & Gompa",
    destination: "Spiti Valley",
    category: "Historical",
    location: "Dhankar, Spiti Valley, Himachal Pradesh",
    altitude: "12,774 ft",
    bestTime: "May to October",
    visitingHours: "7:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
    description: "Dhankar is a dramatically perched village that was once the ancient capital of the Spiti Kingdom. The historic Dhankar Monastery (Gompa) is built on a high mud cliff, seemingly clinging to the edge of a precipitous mountain face. Overlooking the spectacular confluence of the Spiti and Pin rivers, the monastery houses ancient Buddhist scriptures, murals, and a statue of Vairochana. The dramatic location, coupled with wind-eroded rock pillars, makes Dhankar one of the most visually stunning and spiritually historic sites in the valley.",
    etiquette: [
      "Be extremely careful when walking inside the ancient monastery structure; parts of it are fragile",
      "Remove shoes before entering the prayer rooms",
      "Do not run, shout, or stomp on the wooden floors of the ancient structure",
      "Support the local community by buying handmade souvenirs or donating to the monastery restoration fund"
    ],
    faqs: [
      { question: "Is the monastery safe to enter?", answer: "Yes, but due to its fragile mud structure and cliffside erosion, visitors are restricted to small groups in certain older sections." },
      { question: "Can we hike to Dhankar Lake?", answer: "Yes, there is a moderate 1.5-hour uphill trek from the village that leads to the beautiful, high-altitude Dhankar Lake." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Key Monastery",
    destination: "Spiti Valley",
    category: "Spiritual",
    location: "Key, Spiti Valley, Himachal Pradesh",
    altitude: "13,668 ft",
    bestTime: "May to October",
    visitingHours: "6:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
    description: "Key Monastery (Kye Gompa) is the largest and most iconic Tibetan Buddhist monastery in the Spiti Valley. Perched dramatically on a volcanic cone-shaped hill, it resembles a majestic fortress built of stacked white mud-brick rooms. Established in the 11th century, it houses rare manuscripts, ancient murals, wind instruments, and weapons. The monastery is home to hundreds of young Lama monks who study here. The peaceful spiritual chanting, the smell of butter lamps, and the panoramic views of the Spiti River make it a highlight of the trip.",
    etiquette: [
      "Remove your shoes before entering the prayer halls and assembly rooms",
      "Do not take photos or videos inside the main prayer halls where the monks worship",
      "Walk around the corridors and prayer cylinders in a clockwise direction",
      "Be respectful when interacting with the young monks and request permission before photographing them"
    ],
    faqs: [
      { question: "Do the monks offer tea to visitors?", answer: "Yes, the hospitable monks often offer hot herbal tea (and sometimes butter tea) to travelers visiting the assembly hall." },
      { question: "How far is Key Monastery from Kaza?", answer: "It is about 12 km from Kaza, the main administrative town of Spiti, taking around 20 minutes by road." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Komic village",
    destination: "Spiti Valley",
    category: "Village",
    location: "Spiti Valley, Himachal Pradesh",
    altitude: "15,050 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800",
    description: "Komic is a tiny, high-altitude hamlet that holds the proud distinction of being the world's highest village connected by a motorable road. Situated at an altitude of 15,050 feet, it is a remote settlement with a population of under 150 people. The village is home to the ancient Komic Lundup Chemo Gompa, a 14th-century monastery. Living in this barren, cold desert environment requires immense resilience. Travelers visit Komic to witness the rugged lifestyle, enjoy hot food at the world's highest cafe, and experience the feeling of standing on top of the world.",
    etiquette: [
      "Move very slowly and do not run, as the air is extremely thin at 15,050 feet and oxygen levels are low",
      "Carry ample warm clothing; wind speeds are high and temperatures can drop below freezing in minutes",
      "Women are not allowed in the inner prayer chamber of the old monastery due to ancient traditions",
      "Keep the village clean; pick up any trash and support the local cafe"
    ],
    faqs: [
      { question: "Is altitude sickness common in Komic?", answer: "Yes, due to the high elevation, it is essential to stay hydrated, move slowly, and ensure you have acclimated in Kaza before visiting." },
      { question: "Is there a cafe in the village?", answer: "Yes, the 'Spiti Organic Kitchen' is famous as the world's highest organic cafe, serving delicious momos and hot tea." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Langza Buddha statue",
    destination: "Spiti Valley",
    category: "Sightseeing",
    location: "Langza, Spiti Valley, Himachal Pradesh",
    altitude: "14,300 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800",
    description: "Langza, famously known as the 'Fossil Village of India,' is a spectacular high-altitude village guarded by a giant, 1000-year-old statue of Lord Buddha. The colorful statue sits on a hilltop overlooking the mud houses, terraced fields, and snow-clad peaks, presenting one of Spiti's most iconic landscapes. The region was once part of the prehistoric Tethys Sea, and the surrounding clay cliffs are rich in marine fossils dating back millions of years. It offers a majestic blend of geology, spirituality, and ancient mountain culture.",
    etiquette: [
      "Respect the Buddha statue and do not climb or write on the pedestal",
      "Do not buy or illegally excavate marine fossils; it is crucial to preserve the natural heritage of the village",
      "Dress in warm layers; the wind at the statue site is exceptionally cold and strong",
      "Ask permission before entering the village homes or farms"
    ],
    faqs: [
      { question: "Where can we find fossils in Langza?", answer: "You can find small fossils in the clay soil around the village streams and cliffs, but it is illegal to commercialize or take them out of the region." },
      { question: "How far is Langza from Kaza?", answer: "It is about 16 km away, taking around 30 to 45 minutes of uphill drive along winding roads." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Hikkim Post Office",
    destination: "Spiti Valley",
    category: "Sightseeing",
    location: "Hikkim, Spiti Valley, Himachal Pradesh",
    altitude: "14,400 ft",
    bestTime: "May to October",
    visitingHours: "9:00 AM - 5:00 PM (Monday to Saturday)",
    entryFee: "Free (Postcards and Stamps Paid)",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Hikkim is a small village nestled in the cold desert of Spiti, famous for housing the world's highest post office. Operating at a staggering altitude of 14,400 feet, this simple mud post office has been managed by postmaster Rinchen Chhering since its inception in 1983. The post office is a vital lifeline for the villagers, but has also become a major bucket-list spot for travelers, who climb up to Hikkim to buy postcards, get the unique postmark, and mail them to their loved ones from the clouds.",
    etiquette: [
      "Be patient as the post office can get crowded with travelers buying stamps and postcards",
      "Do not disrupt the postmaster's official duties; keep interactions polite and short",
      "Keep Hikkim clean; do not discard scrap paper or wrappers in the village",
      "Carry cash to buy postcards and stamps, as digital payments are not possible here"
    ],
    faqs: [
      { question: "How long does it take for a postcard to reach other cities?", answer: "Due to the remote location, postcards usually take 2 to 4 weeks to reach major Indian cities, and slightly longer for international destinations." },
      { question: "Is the post office open on Sundays?", answer: "No, it is closed on Sundays and national holidays, though you can still drop postcards in the letterbox outside." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Kibber village",
    destination: "Spiti Valley",
    category: "Village",
    location: "Spiti Valley, Himachal Pradesh",
    altitude: "14,200 ft",
    bestTime: "May to October (Winters for snow leopard spotting)",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
    description: "Kibber is a beautiful, high-altitude village surrounded by barren mountains, green agricultural patches, and deep limestone gorges. The village features traditional Tibetan-style stone houses, all painted in uniform white with black borders. Kibber is situated within the Kibber Wildlife Sanctuary, a critical habitat for the elusive and endangered snow leopard, Siberian ibex, and blue sheep. The village offers a peaceful base for high-altitude treks, wildlife tracking, and exploring the unique biodiversity of the Trans-Himalayan region.",
    etiquette: [
      "Keep noise levels to a minimum to avoid disturbing the local wildlife",
      "Do not venture into the wildlife sanctuary without a local guide or proper permits",
      "Minimize your plastic footprint; carry your trash back with you",
      "Dress in warm, neutral-colored layers when tracking wildlife"
    ],
    faqs: [
      { question: "When is the best time to spot snow leopards?", answer: "Snow leopard spotting expeditions are conducted in the freezing winter months from January to March, when the leopards descend to lower altitudes." },
      { question: "Is there accommodation in Kibber?", answer: "Yes, there are several simple, clean homestays run by local families, offering authentic Spitian meals." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chicham Bridge",
    destination: "Spiti Valley",
    category: "Sightseeing",
    location: "Chicham, Spiti Valley, Himachal Pradesh",
    altitude: "13,596 ft",
    bestTime: "May to October",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
    description: "Chicham Bridge is a spectacular steel truss bridge that holds the record for being the highest bridge in Asia. Suspended at a height of 13,596 feet, it spans a breathtaking, 1000-foot-deep gorge carved by the Samba Lamba Nallah, connecting the remote villages of Kibber and Chicham. Crossing the bridge is a thrilling experience as you look down at the dizzying heights. It is an iconic photography spot, offering dramatic views of the barren, rugged cliffs of Spiti and the distant snow peaks.",
    etiquette: [
      "Do not lean over the bridge railings or climb on the steel structures for selfies",
      "Vehicles should not park on the bridge; park at the designated spaces on either side",
      "Do not throw plastic, trash, or stones down into the deep gorge",
      "Drive slowly and carefully when crossing, especially during windy conditions"
    ],
    faqs: [
      { question: "Why was this bridge built?", answer: "Before the bridge was constructed in 2017, villagers had to use a dangerous manual cable trolley to cross the deep gorge, which took hours. The bridge has cut down travel times significantly." },
      { question: "Is it safe to walk on the bridge?", answer: "Yes, it is a fully functional, sturdy metal bridge with pedestrian walks on both sides." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chandrataal Lake",
    destination: "Spiti Valley",
    category: "Lake",
    location: "Lahaul & Spiti, Himachal Pradesh",
    altitude: "14,100 ft",
    bestTime: "June to September",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Chandrataal Lake, or the 'Moon Lake,' is a high-altitude lake of breathtaking beauty situated on the Samudra Tapu plateau in the Himalayas. The lake gets its name from its crescent shape. Its color changes throughout the day, from deep turquoise to emerald green and electric blue, reflecting the surrounding snow-capped peaks and clear skies. The lake is surrounded by alpine meadows and is a protected wetland. Camping near the lake under the brilliant, star-studded night sky is one of the most magical experiences in Spiti.",
    etiquette: [
      "Camping is strictly banned within 2-3 km of the lake to protect its fragile ecosystem; use the designated campsite area",
      "Do not wash utensils, clothes, or bathe in the lake water",
      "Carry all plastic waste and garbage back from the lake site",
      "Walk gently on the surrounding meadows and stick to the defined paths"
    ],
    faqs: [
      { question: "Can we drive up to the lake?", answer: "Vehicles can go up to the parking lot, which is 1.5 km away from the lake. From there, you must take an easy, flat walk to the water." },
      { question: "Is it very cold at night near Chandrataal?", answer: "Yes, temperatures routinely drop below freezing even in summer, so high-quality sleeping bags and heavy thermal layers are essential." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Solang Valley (Spiti route)",
    destination: "Spiti Valley",
    category: "Adventure",
    location: "Manali, Himachal Pradesh",
    altitude: "8,400 ft",
    bestTime: "May to October",
    visitingHours: "9:00 AM - 5:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Explore the scenic Solang Valley as we descend from the high-altitude pass of Kunzum La and the Chandrataal Lake back to Manali. Flanked by lush green meadows and towering pine forests, the valley serves as a refreshing transition from the cold desert landscapes of Spiti back to the green valleys of Kullu. Travelers can stop here for a hot meal, enjoy a quick walk through the pine groves, and witness paragliders soaring over the valley before entering Manali town.",
    etiquette: [
      "Keep the valley clean; do not litter snack wrappers along the roadside",
      "Support local tea stalls and souvenir shops fairly",
      "Follow driver guidelines regarding scheduled stops and departure times",
      "Be prepared for changing weather conditions during the descent"
    ],
    faqs: [
      { question: "Is this stop different from the Manali trip?", answer: "It is the same geographic valley, but visited as a relaxing stopover on the return journey from Spiti to Manali." },
      { question: "Can we do activities here?", answer: "Depending on the time of arrival, you can participate in quick activities like zorbing or horse riding if time permits." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Hadimba Temple & Mall Road (Manali)",
    destination: "Spiti Valley",
    category: "Sightseeing",
    location: "Manali, Himachal Pradesh",
    altitude: "6,700 ft",
    bestTime: "Year-round",
    visitingHours: "8:00 AM - 8:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1601934371720-6d42df2252a1?auto=format&fit=crop&q=80&w=800",
    description: "Enjoy classic Manali sightseeing on the final day of your Spiti Valley expedition. Visit the historic, pagoda-style Hadimba Temple situated inside the dense Dhungri forest, and walk along the lively Mall Road for last-minute souvenir shopping. It is the perfect opportunity to reflect on your high-altitude journey, enjoy a cup of coffee at local cafes, and buy Tibetan crafts, shawls, and dry fruits before boarding your return bus or train.",
    etiquette: [
      "Remove your shoes before entering the temple platform",
      "Keep your luggage safely loaded in the transport vehicle during the walk",
      "Dispose of trash in designated dustbins along Mall Road",
      "Follow the group schedule to avoid missing the evening departure timings"
    ],
    faqs: [
      { question: "Is this included on the last day?", answer: "Yes, this sightseeing is curated as a relaxing way to spend your final hours in Manali before your journey back home." },
      { question: "Are card payments accepted in the shops?", answer: "Yes, but carrying some cash is recommended for small street-side purchases and temple offerings." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Paragliding / River Rafting (Manali)",
    destination: "Spiti Valley",
    category: "Adventure",
    location: "Kullu/Manali, Himachal Pradesh",
    altitude: "4,000 ft - 8,000 ft",
    bestTime: "May to October",
    visitingHours: "9:00 AM - 4:00 PM",
    entryFee: "Paid on Site (Optional)",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Experience the ultimate rush of adventure on the final day of your Spiti journey in the Kullu Valley. Choose between soaring high over the valley with tandem paragliding or battling the cold, roaring rapids of the Beas River with white water rafting. Led by certified instructors with high-safety equipment, these activities offer the perfect final dose of adrenaline to wrap up your epic Himalayan expedition.",
    etiquette: [
      "Listen carefully to all safety briefings and pilot instructions",
      "Wear comfortable clothing and secure sports shoes",
      "Do not carry phones or cameras on the river raft unless in a waterproof mount",
      "Ensure you are in good physical health before participating"
    ],
    faqs: [
      { question: "Can we do both activities?", answer: "Depending on the departure schedule, it is usually possible to do one of the activities comfortably. Coordinate with your trip leader." },
      { question: "Are these activities safe?", answer: "Yes, they are conducted by certified operators using professional, double-checked safety gear." }
    ],
    includedPaid: "Paid"
  },

  // ==========================================
  // KEDARNATH (16 Attractions)
  // ==========================================
  {
    name: "Har Ki Pauri (Haridwar)",
    destination: "Kedarnath",
    category: "Spiritual",
    location: "Haridwar, Uttarakhand",
    altitude: "1,030 ft",
    bestTime: "October to March",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80&w=800",
    description: "Har Ki Pauri is a highly revered ghat on the banks of the Ganga in Haridwar, famously known as the place where the river leaves the mountains and enters the plains. The name translates to 'Steps of Lord Vishnu,' and it is believed that Vishnu's footprint is imprinted on a stone wall here. Pilgrims gather at this sacred ghat to take a holy dip in the fast-flowing, cold waters of the Ganga, which is believed to wash away sins, serving as the traditional starting point for the holy Char Dham pilgrimage.",
    etiquette: [
      "Use the metal chains and railings provided at the ghat while taking a holy dip, as the current is very strong",
      "Remove your shoes before stepping onto the sacred ghat steps",
      "Avoid using soaps or throwing plastics into the holy river",
      "Be respectful of pilgrims performing rituals and prayers"
    ],
    faqs: [
      { question: "What is the significance of the ghat?", answer: "It is believed that drops of Amrit (nectar) fell here during the Samudra Manthan, making it one of the most auspicious places for a holy dip." },
      { question: "Is it safe to bathe at night?", answer: "Yes, the ghat is well-lit and monitored, but caution is advised due to the cold water and strong currents." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Ganga Aarti (Triveni Ghat)",
    destination: "Kedarnath",
    category: "Spiritual",
    location: "Rishikesh, Uttarakhand",
    altitude: "1,120 ft",
    bestTime: "October to April",
    visitingHours: "6:00 PM - 7:00 PM Daily",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
    description: "The Ganga Aarti at Triveni Ghat is a world-famous, deeply spiritual ceremony performed daily at sunset on the banks of the holy Ganges in Rishikesh. Triveni Ghat is the confluence of three holy rivers: the Ganga, Yamuna, and Saraswati. The aarti is defined by rhythmic Vedic chants, the sound of conch shells, and priests holding massive, multi-tiered brass lamps. The sight of thousands of tiny oil lamps floating down the dark, shimmering river creates a deeply meditative, emotional, and visually spectacular atmosphere.",
    etiquette: [
      "Arrive at the ghat by 5:00 PM to secure a seating spot close to the prayer platforms",
      "Remove your shoes and keep them in the designated storage counters",
      "Maintain absolute silence and devotion during the chanting and rituals",
      "Avoid standing up or blocking the view of others during the aarti"
    ],
    faqs: [
      { question: "Can we participate in floating the lamps?", answer: "Yes, you can buy small leaf-cups filled with flowers and a candle (diyas) from local vendors to float in the river after the aarti." },
      { question: "How long does the ceremony last?", answer: "The actual aarti and prayers last for about 45 minutes." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Lakshman Jhula & Ram Jhula",
    destination: "Kedarnath",
    category: "Sightseeing",
    location: "Rishikesh, Uttarakhand",
    altitude: "1,150 ft",
    bestTime: "Year-round",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1598977123418-45f04b61b4bb?auto=format&fit=crop&q=80&w=800",
    description: "Lakshman Jhula and Ram Jhula are two iconic iron suspension bridges spanning the holy Ganga River in Rishikesh. Lakshman Jhula is historically significant, built on the spot where Lord Lakshman is said to have crossed the river on jute ropes. The bridges connect the bustling ghats, vibrant temples, ashrams, and local markets on both banks. Walking across these swinging bridges offers a spectacular view of the river, the mountains, and the colorful multi-story temples lining the riverbanks.",
    etiquette: [
      "Keep to your left when walking across the bridges to allow smooth flow of pedestrians",
      "Watch out for local monkeys on the bridge wires; do not carry food open in your hands",
      "Do not stand in the middle of the bridge to take group selfies as it blocks traffic",
      "Respect local holy men and sadhus walking along the path"
    ],
    faqs: [
      { question: "Is Lakshman Jhula currently open for heavy traffic?", answer: "No, Lakshman Jhula is currently restricted to light pedestrian traffic due to safety assessments, while Ram Jhula is fully functional." },
      { question: "What is the distance between the two bridges?", answer: "They are about 2 km apart, connected by a scenic walking path lined with cafes and shops along the river bank." }
    ],
    includedPaid: "Included"
  },
  {
    name: "River Rafting (Rishikesh)",
    destination: "Kedarnath",
    category: "Adventure",
    location: "Rishikesh, Uttarakhand",
    altitude: "1,200 ft",
    bestTime: "October to June",
    visitingHours: "8:00 AM - 3:00 PM",
    entryFee: "₹1,000 - ₹1,500 (Paid Activity)",
    image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&q=80&w=800",
    description: "Experience the ultimate thrill of white water rafting on the fast-flowing, emerald-green rapids of the Ganges in Rishikesh. Spanning popular stretches like Shivpuri to Rishikesh (16 km) or Marine Drive to Rishikesh (26 km), the river features exciting Grade III and IV rapids like 'Roller Coaster,' 'Golf Course,' and 'Club House.' Under the guidance of certified river guides, paddlers navigate through churning waters and deep gorges, with a chance to try cliff jumping in calmer stretches.",
    etiquette: [
      "Wear your helmet and high-buoyancy life jacket securely at all times on the river",
      "Follow the guide's commands for paddling and safety positioning instantly",
      "Wear secure strap sandals or water shoes; do not wear loose slippers",
      "Do not consume alcohol before or during the rafting session"
    ],
    faqs: [
      { question: "Is swimming a prerequisite for rafting?", answer: "No, life jackets keep you afloat safely, and the raft is guided by highly trained professionals who handle safety." },
      { question: "What is the minimum age for rafting?", answer: "For safety reasons, the minimum age is 14 years for standard rapids." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "Bungee Jumping / Flying Fox",
    destination: "Kedarnath",
    category: "Adventure",
    location: "Mohan Chatti, Rishikesh, Uttarakhand",
    altitude: "1,500 ft",
    bestTime: "September to June",
    visitingHours: "9:00 AM - 4:00 PM",
    entryFee: "₹3,500 - ₹4,500 (Paid Activity)",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Leap off India's highest fixed-platform bungee jumping spot, suspended at a staggering height of 83 meters (approx. 272 feet) over a rocky cliff at Mohan Chatti in Rishikesh. Designed by experts from New Zealand, the jump features international safety standards. The adrenaline-pumping free fall is followed by a gentle swing over a mountain stream. You can also try the Flying Fox, a massive 1-km-long zip-line where you glide at speeds of up to 140 km/h, offering a thrilling flight over the valley.",
    etiquette: [
      "Follow all safety instructions and weight/health guidelines strictly",
      "Wear comfortable sports shoes and snug clothing",
      "Do not look down if you feel nervous; focus on the horizon before jumping",
      "Inform the jump instructors of any history of high blood pressure, back pain, or heart conditions"
    ],
    faqs: [
      { question: "What is the height of the jump?", answer: "The jump is from a cantilever platform built over a rocky cliff at a height of 83 meters (272 feet)." },
      { question: "Do we get a certificate?", answer: "Yes, you get a 'Dare to Jump' certificate and a video of your jump (optional purchase) as a souvenir." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "Beatles Ashram & Parmarth Niketan",
    destination: "Kedarnath",
    category: "Historical",
    location: "Swarg Ashram, Rishikesh, Uttarakhand",
    altitude: "1,120 ft",
    bestTime: "October to April",
    visitingHours: "9:00 AM - 5:30 PM",
    entryFee: "₹150 for Indians, ₹600 for Foreigners (Included)",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
    description: "The Beatles Ashram, officially known as Chaurasi Kutia, is the historic ashram of Maharishi Mahesh Yogi where the legendary English rock band, The Beatles, stayed in 1968 to learn Transcendental Meditation. The abandoned ashram features unique stone-dome meditation caves and colorful graffiti murals of the band. Nearby, Parmarth Niketan is Rishikesh's largest ashram, famous for its clean, spiritual atmosphere and beautiful gardens. Together, they offer a fascinating look into the convergence of Western music and Eastern spirituality.",
    etiquette: [
      "Do not deface or write on the historical walls and graffiti of the ashram",
      "Maintain a peaceful and quiet attitude inside the meditation domes",
      "Wear modest clothing when visiting Parmarth Niketan",
      "Keep to the marked paths and do not litter"
    ],
    faqs: [
      { question: "What did the Beatles do at the ashram?", answer: "They stayed for several weeks, composed over 40 songs (many of which appeared on the White Album), and studied meditation under Maharishi Mahesh Yogi." },
      { question: "Is the ashram inside a forest?", answer: "Yes, it is situated on the edge of the Rajaji National Park, offering a very peaceful, natural forest environment." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Devprayag",
    destination: "Kedarnath",
    category: "Sightseeing",
    location: "Garhwal Himalayas, Uttarakhand",
    altitude: "2,723 ft",
    bestTime: "September to May",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1598977123418-45f04b61b4bb?auto=format&fit=crop&q=80&w=800",
    description: "Devprayag is a sacred town and the birthplace of the holy Ganga River. It is here that the two-toned waters of the Bhagirathi River (rushing and turbulent from Gaumukh) and the Alaknanda River (calm and deep from Badrinath) meet. The contrast between the muddy-green Bhagirathi and the clear blue Alaknanda is a spectacular sight. The town is built around the confluence ghat, where pilgrims gather to pray, take a holy dip, and visit the ancient, stone-built Raghunathji Temple dedicated to Lord Rama.",
    etiquette: [
      "Be careful on the steps near the confluence (Sangam) as the currents are extremely fast-flowing",
      "Remove footwear before stepping onto the bathing platforms at the Sangam",
      "Do not litter or dump plastic waste in the river",
      "Respect local priests performing rituals"
    ],
    faqs: [
      { question: "What is the meaning of Devprayag?", answer: "Devprayag means 'Godly Confluence.' It is the final of the five sacred confluences (Panch Prayag) of the Alaknanda River where it officially takes the name Ganga." },
      { question: "How far is it from Rishikesh?", answer: "It is about 70 km from Rishikesh along the Badrinath highway, taking around 2.5 hours by road." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Rudraprayag",
    destination: "Kedarnath",
    category: "Sightseeing",
    location: "Garhwal Himalayas, Uttarakhand",
    altitude: "2,936 ft",
    bestTime: "September to June",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80&w=800",
    description: "Rudraprayag is a sacred town named after Lord Shiva's 'Rudra' avatar. It marks the spectacular confluence of two major Himalayan rivers: the Alaknanda (flowing from Badrinath) and the Mandakini (flowing from Kedarnath). The confluence is a powerful sight, with roaring waters cutting through steep rocky cliffs. The town is built around the ghats, featuring temples dedicated to Rudranath and Chamunda Devi. It serves as a major transit junction for pilgrims heading to both the Kedarnath and Badrinath temples.",
    etiquette: [
      "Maintain safety near the river bank; the water level can rise suddenly during monsoon or snowmelt",
      "Dress modestly when visiting the local temples near the Sangam",
      "Do not throw plastics or waste into the river",
      "Ask permission before photographing local religious ceremonies"
    ],
    faqs: [
      { question: "Which rivers meet at Rudraprayag?", answer: "The Mandakini River, coming from the Kedarnath hills, and the Alaknanda River, coming from Badrinath, meet here." },
      { question: "Is it close to Kedarnath?", answer: "It is about 75 km from Gaurikund (the start of the Kedarnath trek), making it a popular night halt." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Dhari Devi Temple",
    destination: "Kedarnath",
    category: "Spiritual",
    location: "Kalyasaur, Srinagar, Uttarakhand",
    altitude: "1,840 ft",
    bestTime: "Year-round",
    visitingHours: "6:00 AM - 8:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
    description: "Dhari Devi Temple is a highly revered shrine located on the banks of the Alaknanda River near Srinagar. The temple houses the upper half of the deity of Goddess Dhari Devi, who is considered the guardian deity of Uttarakhand and protector of the Char Dhams. The idol is unique as it is situated in the middle of the river, raised on concrete pillars. According to local belief, the face of the goddess changes appearance from a girl in the morning to a woman in the afternoon and an elderly lady in the evening.",
    etiquette: [
      "Walk quietly along the hanging bridge that connects the highway to the river temple",
      "Photography of the main deity inside the sanctum is strictly prohibited",
      "Remove your shoes before entering the temple platform",
      "Avoid pushing in the narrow queue lines on the bridge"
    ],
    faqs: [
      { question: "What is the legend of Dhari Devi?", answer: "Locals believe the deity protector was moved from her original spot just hours before the devastating 2013 flood, and her anger triggered the landslide. The temple has since been restored on a raised platform." },
      { question: "Where is the lower half of the deity?", answer: "The lower half of the idol is located at the Kalimath Temple near Guptkashi, where she is worshipped as Goddess Kali." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Kedarnath Temple trek",
    destination: "Kedarnath",
    category: "Trek",
    location: "Kedarnath Valley, Uttarakhand",
    altitude: "11,750 ft",
    bestTime: "May to June, September to October",
    visitingHours: "4:00 AM - 9:00 PM (Darshan Timings)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "The Kedarnath Temple trek is a sacred, high-altitude 21-kilometer pilgrimage trek from Gaurikund to the historic Kedarnath Temple, one of the 12 Jyotirlingas of Lord Shiva. Flanked by roaring waterfalls, steep cliffs, and the fast-flowing Mandakini River, the paved trail climbs up to 11,750 feet. The final view of the ancient stone temple, standing dramatically against the massive, snow-covered Kedarnath peak (6,940m), is a deeply spiritual and emotional reward that washes away all physical exhaustion.",
    etiquette: [
      "Ensure you undergo the mandatory biometric registration before starting the trek",
      "Wear layered warm clothes and high-quality waterproof trekking shoes, as the weather is highly unpredictable",
      "Move at a slow, steady pace; carry portable oxygen cans and keep yourself hydrated",
      "Ponies and helicopter services are available; book them in advance during peak season"
    ],
    faqs: [
      { question: "How long does the trek take?", answer: "The uphill trek takes about 6 to 9 hours for an average walker, while the descent takes around 4 to 6 hours." },
      { question: "Can we stay at Kedarnath overnight?", answer: "Yes, there are government-run GMVN camps and basic guest houses near the temple, but advance booking is essential." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Bhairavnath Temple",
    destination: "Kedarnath",
    category: "Spiritual",
    location: "Kedarnath, Uttarakhand",
    altitude: "12,010 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80&w=800",
    description: "Bhairavnath Temple is located on a hilltop just 500 meters south of the main Kedarnath Temple. Dedicated to Lord Bhairav, the fierce avatar of Lord Shiva, he is considered the 'Kshetrapal' or guardian deity of the Kedarnath valley. According to tradition, Bhairav guards the temple and the valley when the main Kedarnath shrine closes during the freezing winter months. The short, steep walk up to this temple offers spectacular, bird's-eye views of the Kedarnath temple complex and the glacier below.",
    etiquette: [
      "Walk carefully as the path is steep and can be icy or slippery in the morning",
      "Do not touch the sacred stone idol of Bhairavnath with dirty hands",
      "Maintain silence and respect the fierce energy of the shrine",
      "Avoid littering plastic wrappers at the hilltop"
    ],
    faqs: [
      { question: "Is it mandatory to visit Bhairav temple?", answer: "According to local beliefs, a pilgrimage to Kedarnath is considered incomplete without paying respects at the Bhairavnath Temple." },
      { question: "How long does the walk take?", answer: "It is a short but steep 15 to 20-minute walk from the main Kedarnath temple." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Adi Shankaracharya Samadhi",
    destination: "Kedarnath",
    category: "Historical",
    location: "Kedarnath, Uttarakhand",
    altitude: "11,750 ft",
    bestTime: "May to October",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=800",
    description: "Located directly behind the main Kedarnath Temple, this historical monument is the final resting place (Samadhi) of Adi Shankaracharya, the great 8th-century philosopher who revived Hinduism. He is credited with establishing the four sacred Advaita seats (Char Dham) across India and restoring the Kedarnath temple. The original site was washed away in the 2013 floods and has been beautifully reconstructed by the government, featuring a magnificent, 12-foot-tall stone statue of the seer in a peaceful, underground meditation posture.",
    etiquette: [
      "Maintain absolute silence in the samadhi area as it is meant for quiet meditation",
      "Remove your shoes before entering the samadhi platform",
      "Do not touch or write on the stone statue or structural pillars",
      "Be respectful of pilgrims meditating nearby"
    ],
    faqs: [
      { question: "What is the significance of this samadhi?", answer: "It marks the spot where Adi Shankaracharya is said to have attained Mahasamadhi at the young age of 32, after completing his mission of uniting the spiritual paths of India." },
      { question: "Is it close to the main temple?", answer: "Yes, it is located right behind the main Kedarnath Temple building." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chopta meadows",
    destination: "Kedarnath",
    category: "Nature",
    location: "Rudraprayag district, Uttarakhand",
    altitude: "8,790 ft",
    bestTime: "April to June, October to December",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800",
    description: "Chopta, affectionately known as the 'Mini Switzerland of India,' is a pristine, high-altitude valley blanketed in lush green bugyal meadows and dense forests of oak, pine, and rhododendron. Part of the Kedarnath Wildlife Sanctuary, Chopta serves as the base for the trek to Tungnath Temple. The valley offers an untouched escape into nature, with spectacular views of massive snow peaks like Trishul, Nanda Devi, and Chaukhamba. It is popular for bird watching, alpine camping, and stargazing.",
    etiquette: [
      "Chopta is a plastic-free eco-zone; carry all plastic trash back to your hotel or campsite",
      "Do not play loud music or disrupt the peaceful wilderness of the sanctuary",
      "Do not pluck wild flowers or damage the delicate alpine meadows",
      "Be prepared for no electricity; carry fully charged power banks"
    ],
    faqs: [
      { question: "Does it snow in Chopta?", answer: "Yes, Chopta receives heavy snow from December to February, turning the green meadows into a winter wonderland." },
      { question: "Is there mobile network in Chopta?", answer: "Connectivity is very weak or non-existent; only BSNL and Jio work occasionally in specific spots." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Tungnath Temple trek",
    destination: "Kedarnath",
    category: "Trek",
    location: "Chopta, Uttarakhand",
    altitude: "12,070 ft",
    bestTime: "April to November (Accessible in snow for adventure)",
    visitingHours: "6:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "The Tungnath Temple trek is a spectacular 3.5-kilometer hike that leads to the highest Shiva temple in the world. Starting from Chopta, the paved stone path winds uphill through rhododendron forests and opens up to alpine meadows. Situated at 12,070 feet, the ancient stone temple is over 1000 years old and is part of the Panch Kedar. For the ultimate reward, hikers can climb 1.5 km further to Chandrashila Peak (13,120 ft), which offers a jaw-dropping, 360-degree view of the entire Garhwal Himalayas.",
    etiquette: [
      "Wear warm layers as the wind speeds at the temple and Chandrashila summit are extremely high",
      "Wear shoes with good grip; the trail can be covered in snow or ice in early summer and winter",
      "Do not consume alcohol or carry non-vegetarian food near the sacred temple premises",
      "Walk at a steady pace and drink water to avoid altitude sickness"
    ],
    faqs: [
      { question: "What is the difficulty level of the trek?", answer: "It is an easy to moderate trek. The trail is well-paved, but the steep incline makes it a good workout of about 2 to 3 hours." },
      { question: "Is the temple open in winters?", answer: "No, the temple remains closed during winter due to heavy snow, and the deity is moved down to Makkumath." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Badrinath Temple",
    destination: "Kedarnath",
    category: "Spiritual",
    location: "Chamoli district, Uttarakhand",
    altitude: "10,830 ft",
    bestTime: "May to June, September to November",
    visitingHours: "4:30 AM - 9:00 PM (Darshan Timings)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80&w=800",
    description: "Badrinath Temple is one of the most sacred pilgrimage sites in Hinduism and a key pillar of the Char Dham. Located along the banks of the Alaknanda River, the temple is dedicated to Lord Vishnu, who is worshipped here as Badrinarayan. The temple features a colorful, 50-foot-tall facade resembling a Buddhist vihara, with a black stone idol inside. Before entering, pilgrims take a holy bath in the Tapt Kund, a natural hot sulphur spring situated just below the temple on the cold riverbed.",
    etiquette: [
      "Remove your shoes and wash your hands before entering the temple queue",
      "Photography of the main deity inside the inner sanctum is strictly prohibited",
      "Respect the queues and follow guidelines in the Tapt Kund bathing areas",
      "Maintain silence and decorum inside the temple premises"
    ],
    faqs: [
      { question: "What is Tapt Kund?", answer: "It is a group of natural geothermal hot springs located on the river bank just below Badrinath Temple, where water stays at a hot 45°C throughout the year." },
      { question: "How is the road connectivity to Badrinath?", answer: "Unlike Kedarnath, Badrinath is fully connected by a motorable highway, and you can drive directly to the temple entrance." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Mana Village",
    destination: "Kedarnath",
    category: "Village",
    location: "Badrinath, Uttarakhand",
    altitude: "10,500 ft",
    bestTime: "May to October",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
    description: "Mana is a charming, historic village located just 3 km from Badrinath, proudly recognized as the 'Last Indian Village' before the Tibet border. Perched on the banks of the Saraswati River, the village is steeped in Mahabharata mythology. Visitors can explore the Bheem Pul—a massive natural stone bridge said to have been placed by Bheem—the Vyas Gufa cave where Sage Vyas wrote the Mahabharata, and the origin of the Saraswati River. It offers a spectacular blend of high-altitude scenery and ancient history.",
    etiquette: [
      "Do not litter; help keep this remote border village clean and eco-friendly",
      "Support the local community by purchasing hand-woven woolens and organic tea from village shops",
      "Ask permission before photographing local residents or their wooden homes",
      "Dress warmly as the winds coming from the Tibet pass are cold and fast"
    ],
    faqs: [
      { question: "What is Vyas Gufa?", answer: "It is an ancient rock cave in Mana where Sage Ved Vyas is believed to have composed the epic Mahabharata with the help of Lord Ganesha." },
      { question: "How far is the actual Tibet border?", answer: "The international border is about 24 km ahead, accessible only to the military via the Mana Pass." }
    ],
    includedPaid: "Included"
  },

  // ==========================================
  // LADAKH BIKE (13 Attractions)
  // ==========================================
  {
    name: "Sangam (Zanskar–Indus confluence)",
    destination: "Ladakh Bike",
    category: "Sightseeing",
    location: "Nimmu, Leh-Ladakh",
    altitude: "10,820 ft",
    bestTime: "June to September",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?auto=format&fit=crop&q=80&w=800",
    description: "Sangam is the spectacular confluence of two major Himalayan rivers: the Indus (flowing from Tibet) and the Zanskar (flowing from the Zanskar Valley). Located 35 km from Leh near Nimmu village, the confluence is famous for its striking contrast of colors. The Indus appears clear and shiny-green, while the Zanskar is muddy-blue and turbulent. The two rivers meet in a deep valley, surrounded by barren, sand-colored mountains. It is a stunning visual landscape and a popular spot for river rafting in Ladakh.",
    etiquette: [
      "Park your bikes/vehicles in the designated parking spaces off the highway",
      "Do not climb down the loose sandy slopes to the riverbed without caution",
      "Keep the river bank clean; do not discard plastic bottles or trash",
      "Listen to safety instructions if opting for river rafting at the Sangam"
    ],
    faqs: [
      { question: "Can we raft at the confluence?", answer: "Yes, this stretch of the Zanskar/Indus river is famous for white water rafting, offering Grade II and III rapids in summer." },
      { question: "Is the color contrast visible in winters?", answer: "In winter, the Zanskar freezes completely, creating a white sheet of ice that meets the flowing, clear blue Indus, which is also a spectacular sight." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Gurudwara Pathar Sahib",
    destination: "Ladakh Bike",
    category: "Spiritual",
    location: "Leh-Kargil Highway, Ladakh",
    altitude: "10,600 ft",
    bestTime: "May to October",
    visitingHours: "6:00 AM - 7:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
    description: "Gurudwara Pathar Sahib is a sacred shrine built in 1517 to honor the visit of Guru Nanak Dev to Ladakh. Located on the Leh-Kargil highway, it houses a massive boulder (Pathar) with the imprint of Guru Nanak's back and the footmark of a demon who tried to crush him. The gurudwara is managed and maintained by the Indian Army, who welcome all travelers with hot tea and Langar. It stands as a peaceful, spiritual oasis of warmth and service along the barren, wind-swept highway.",
    etiquette: [
      "Cover your head with a headscarf inside the gurudwara complex",
      "Remove shoes and wash your hands before entering the prayer hall",
      "Maintain quietness and respect the Army personnel managing the shrine",
      "Partake in the hot tea and prasad offered with respect"
    ],
    faqs: [
      { question: "Who runs this Gurudwara?", answer: "The Gurudwara is unique as it is fully managed by the Indian Army stationed in Ladakh." },
      { question: "Is it close to Leh town?", answer: "Yes, it is located about 25 km from Leh on the national highway, taking around 30 minutes by bike." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Magnetic Hill",
    destination: "Ladakh Bike",
    category: "Sightseeing",
    location: "Leh-Kargil Highway, Ladakh",
    altitude: "11,000 ft",
    bestTime: "May to October",
    visitingHours: "24 Hours Open",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Magnetic Hill is a famous gravity hill located on the Leh-Kargil highway that creates a mind-bending optical illusion. The surrounding hills and road slope are aligned in a way that makes a vehicle parked in neutral appear to roll uphill against gravity at speeds of up to 20 km/h. While scientists attribute this phenomenon to a magnetic force or optical illusion created by the dry horizon, it remains one of Ladakh's most popular and fun roadside attractions for bikers to test.",
    etiquette: [
      "Keep your vehicle inside the yellow box marked on the road to test the illusion",
      "Watch out for moving highway traffic while testing or photographing on the road",
      "Do not drive off-road into the fragile sandy slopes surrounding the hill",
      "Follow the instructions on the signboard placed by the local administration"
    ],
    faqs: [
      { question: "Does the car actually go uphill?", answer: "Yes, vehicles do move, but it is an optical illusion where the road actually slopes downhill, though the layout makes it look like an uphill climb." },
      { question: "Is it close to Gurudwara Pathar Sahib?", answer: "Yes, it is located just 4 km ahead of the Gurudwara on the same highway." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Hall of Fame",
    destination: "Ladakh Bike",
    category: "Historical",
    location: "Leh, Ladakh",
    altitude: "10,400 ft",
    bestTime: "Year-round",
    visitingHours: "9:00 AM - 1:00 PM, 2:00 PM - 7:00 PM",
    entryFee: "₹100 (Included)",
    image: "https://images.unsplash.com/photo-1590483734724-383b853b3178?auto=format&fit=crop&q=80&w=800",
    description: "The Hall of Fame is a magnificent war memorial and museum built and maintained by the Indian Army in memory of the brave soldiers who laid down their lives during the Indo-Pak wars, especially the Kargil War of 1999. The museum displays captured enemy weapons, biographic photos of war heroes, maps of battles, and specialized high-altitude gear used by soldiers in Siachen. It features a poignant sound-and-light show, leaving visitors with a deep sense of pride and respect for the armed forces.",
    etiquette: [
      "Maintain silence and respect inside the memorial galleries",
      "Photography is allowed, but avoid taking selfies near the martyrs' wall",
      "Do not touch the historical exhibits, weapons, or glass cases",
      "Show respect to the Army guards and guides present"
    ],
    faqs: [
      { question: "How long does it take to see the museum?", answer: "It takes about 1.5 to 2 hours to walk through all the galleries and read the historical displays." },
      { question: "Is it close to Leh Airport?", answer: "Yes, it is located on the Leh-Kargil road, just next to the Leh airfield." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Shanti Stupa",
    destination: "Ladakh Bike",
    category: "Spiritual",
    location: "Chanspa, Leh, Ladakh",
    altitude: "11,841 ft",
    bestTime: "May to October",
    visitingHours: "5:00 AM - 9:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
    description: "Shanti Stupa is a majestic, white-domed Buddhist monument perched on a steep hilltop in Chanspa, Leh. Built in 1991 by Japanese and Ladakhi Buddhists to promote world peace, the stupa houses relics of the Buddha at its base. The double-story structure is decorated with colorful reliefs depicting the life of Buddha. The stupa is famous for offering a breathtaking, 360-degree panoramic view of the Leh town, the Indus River, and the snow-capped Stok range, especially during sunset when it is illuminated.",
    etiquette: [
      "Remove your shoes before climbing the stairs onto the stupa platform",
      "Circumambulate the stupa only in a clockwise direction",
      "Do not smoke, consume alcohol, or play loud music in the sacred stupa complex",
      "Dress modestly out of respect for the religious site"
    ],
    faqs: [
      { question: "Can we drive to the top?", answer: "Yes, there is a fully paved motorable road leading to the stupa parking lot. Alternatively, you can climb 500 steep stone steps from the base." },
      { question: "What is the best time to visit?", answer: "Sunset is the most popular time as you can see the sun go down behind the mountains and watch the stupa light up." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Khardung La Pass",
    destination: "Ladakh Bike",
    category: "Adventure",
    location: "Leh, Ladakh",
    altitude: "17,582 ft",
    bestTime: "June to September",
    visitingHours: "9:00 AM - 5:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800",
    description: "Khardung La is a legendary mountain pass that serves as the gateway to the Nubra and Shyok valleys, historically famous as one of the highest motorable roads in the world. Situated at a dizzying altitude of 17,582 feet (often cited as 18,380 ft), crossing the pass is a major milestone for bikers. The pass is surrounded by steep cliffs of snow and ice, offering spectacular views of the Karakoram range. Standing at the top, amidst fluttering prayer flags and the freezing wind, is a thrilling Himalayan experience.",
    etiquette: [
      "Do not stay at the summit for more than 15-20 minutes to avoid severe altitude sickness (HAPE)",
      "Move slowly; do not run, jump, or exert yourself physically at this altitude",
      "Park your bikes in a single file on the roadside; do not block the narrow pass",
      "Wear heavy windproof jackets, gloves, and helmets at all times"
    ],
    faqs: [
      { question: "Is oxygen available at the pass?", answer: "Yes, there is an Indian Army medical post at the top equipped with oxygen cylinders for emergencies." },
      { question: "Is there snow at Khardung La in summer?", answer: "Yes, you will find snow at the top of the pass even in June and July." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Nubra Valley",
    destination: "Ladakh Bike",
    category: "Nature",
    location: "Ladakh",
    altitude: "10,000 ft",
    bestTime: "June to September",
    visitingHours: "24 Hours (Inner Line Permit Required)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
    description: "Nubra Valley is a unique, high-altitude cold desert located 150 km north of Leh, famous for its dramatic sand dunes, double-humped Bactrian camels, and spectacular mountain vistas. Created by the confluence of the Shyok and Nubra rivers, the valley features a striking contrast of green village orchards amidst barren, wind-swept sand dunes. The main attraction is Hunder, where travelers gather to ride the rare Bactrian camels—remnants of the ancient Silk Road trade route—and camp under a clear, star-studded sky.",
    etiquette: [
      "Carry your Inner Line Permit (ILP) at all times; there are several military checkposts in the valley",
      "Respect the double-humped camels; do not tease, feed them unauthorized snacks, or exceed rider weight limits",
      "Minimize water waste; Nubra is a dry desert region where water is scarce",
      "Keep the sand dunes clean; carry all plastic wrappers and trash back to your camp"
    ],
    faqs: [
      { question: "What is special about the camels in Nubra?", answer: "They are Bactrian camels, which have two humps and are native to Central Asia. They are remnants of the ancient Silk Road trade that passed through Ladakh." },
      { question: "How is the climate in Nubra?", answer: "It is warmer and at a lower altitude than Leh, making it easier to breathe, though wind speeds in the afternoon can be very high." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Turtuk village",
    destination: "Ladakh Bike",
    category: "Village",
    location: "Nubra Valley, Ladakh",
    altitude: "9,840 ft",
    bestTime: "June to September",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
    description: "Turtuk is a beautiful, green village nestled along the Shyok River on the Indo-Pak border, famously known as the last northernmost village of India. Opened to tourists only in 2010, the village was under Pakistani control until the 1971 war. The residents are Balti Muslims of Aryan descent, featuring a unique culture, language, and stone architecture completely distinct from Buddhist Ladakh. Surrounded by apricot orchards and barley fields, Turtuk offers a fascinating look into border history and warm hospitality.",
    etiquette: [
      "Respect the conservative culture of the Balti community; dress modestly when walking in the village",
      "Always ask for permission before taking photographs of the local villagers, especially women and children",
      "Do not cross the marked border fences or go near military checkposts on the cliffs",
      "Support the local economy by trying Balti food and buying fresh or dried apricots"
    ],
    faqs: [
      { question: "How far is Pakistan from Turtuk?", answer: "The actual Line of Control (LoC) is just 6 to 8 km ahead of the village, and you can see the Pakistani posts on the mountain ridges from the village view point." },
      { question: "What language do they speak?", answer: "They speak Balti, a language of Tibetan origin with Persian influence, which is written in Persian script." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Diskit Monastery",
    destination: "Ladakh Bike",
    category: "Spiritual",
    location: "Diskit, Nubra Valley, Ladakh",
    altitude: "10,310 ft",
    bestTime: "May to September",
    visitingHours: "7:00 AM - 6:00 PM",
    entryFee: "₹30 (Included)",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
    description: "Diskit Monastery is the oldest and largest Buddhist monastery in the Nubra Valley, founded in the 14th century. Perched on a steep hill overlooking the Shyok River, it belongs to the Gelugpa (Yellow Hat) sect. The highlight of the monastery is the majestic, 106-foot-tall statue of Maitreya Buddha (Future Buddha), which sits on a hilltop facing down the valley toward Pakistan as a symbol of peace and protection. The monastery houses ancient murals, scriptures, and offers spectacular views of the Nubra Valley sand dunes.",
    etiquette: [
      "Remove shoes before entering the temple assembly hall and prayer rooms",
      "Walk around the Maitreya Buddha statue platform in a clockwise direction",
      "Avoid taking photos inside the dark inner shrines of the monastery",
      "Do not touch the ancient murals or religious drums"
    ],
    faqs: [
      { question: "What is the significance of the Maitreya Buddha statue?", answer: "The massive 32-metre statue was consecrated by the Dalai Lama in 2010. It faces down the Shyok River to promote peace and prevent conflict along the border." },
      { question: "Is it close to the Hunder sand dunes?", answer: "Yes, it is about 10 km from Hunder, making it a perfect morning stop." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Pangong Lake",
    destination: "Ladakh Bike",
    category: "Lake",
    location: "Changthang Region, Ladakh",
    altitude: "14,270 ft",
    bestTime: "June to September",
    visitingHours: "Sunrise to Sunset (ILP Required)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800",
    description: "Pangong Tso is an iconic, endorheic alpine lake that stretches from India into Tibet, famous for its dramatic color changes from turquoise and azure to deep blue. Situated at 14,270 feet, this saline water lake is 134 km long, with only one-third of it lying in India. Famous from the climax of the movie '3 Idiots,' the lake is surrounded by barren, golden mountains, presenting a surreal landscape. The crystal-clear water, the cool lake breeze, and the brilliant stargazing opportunities at night make it a highlight of Ladakh.",
    etiquette: [
      "Do not throw trash, wash clothes, or litter near the lake; it is a sensitive, protected wetland",
      "Keep distance from the local black-necked cranes and migratory gulls nesting near the shores",
      "Move slowly as the altitude is high and oxygen levels are low; stay hydrated",
      "Do not enter the lake water as it is freezing cold and saline"
    ],
    faqs: [
      { question: "Does the lake freeze in winters?", answer: "Yes, despite being saline water, Pangong Lake freezes completely during winter, allowing people to walk and drive over the thick ice sheet." },
      { question: "Where do we stay?", answer: "Accommodation is in deluxe Swiss tents or wooden cottages located in the villages of Spangmik, Lukung, or Tangtse near the lake." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Chang La Pass",
    destination: "Ladakh Bike",
    category: "Adventure",
    location: "Leh, Ladakh",
    altitude: "17,590 ft",
    bestTime: "June to September",
    visitingHours: "9:00 AM - 5:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800",
    description: "Chang La is a high-altitude mountain pass that serves as the main gateway to the Pangong Lake, historically ranked as the third highest motorable pass in the world. Situated at a staggering altitude of 17,590 feet, the pass is named after the local temple of Changla Baba. The approach road is rugged, with steep hairpins and water streams (pagal nallahs) created by melting glaciers. Crossing the pass is a thrilling challenge for bikers, offering spectacular views of the snow-covered peaks and steep rocky valleys.",
    etiquette: [
      "Do not stop at the pass for more than 10-15 minutes due to low oxygen levels",
      "Ride slowly and carefully as the road near the summit can have ice patches and flowing water",
      "Yield to uphill climbing heavy vehicles and military convoys",
      "Wear heavy thermal and windproof layers to protect against the freezing winds"
    ],
    faqs: [
      { question: "Is it difficult to cross on a bike?", answer: "Yes, it is one of the more challenging passes in Ladakh due to loose gravel, mud, and water crossings. Sturdy riding skills are recommended." },
      { question: "Is there a toilet or shop at the top?", answer: "Yes, there is a basic toilet and a small tea stall run by the military serving hot black tea." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Thiksey Monastery",
    destination: "Ladakh Bike",
    category: "Spiritual",
    location: "Leh, Ladakh",
    altitude: "11,800 ft",
    bestTime: "May to October",
    visitingHours: "7:00 AM - 7:00 PM",
    entryFee: "₹50 (Included)",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
    description: "Thiksey Monastery is the largest and most spectacular monastery in central Ladakh, famous for its resemblance to the Potala Palace in Lhasa, Tibet. Stacked in a series of white and red buildings on a rocky hill, the 12-story complex belongs to the Gelugpa (Yellow Hat) sect. The highlights include the magnificent, two-story tall statue of Maitreya Buddha (Future Buddha) inside the temple, a rich collection of thangka paintings, and ancient stupas. The monastery offers a serene, spiritual atmosphere and spectacular views of the Indus Valley.",
    etiquette: [
      "Remove your shoes before entering any of the temple assembly chambers",
      "Walk clockwise around the prayer halls, stupas, and corridors",
      "Do not touch the ancient thangkas, scriptures, or the main Maitreya Buddha statue",
      "Ask permission before photographing the resident monks during their prayers"
    ],
    faqs: [
      { question: "What is the best time to visit Thiksey?", answer: "Visiting early in the morning (around 6:00 AM) allows you to witness the morning prayers, where monks chant to the sound of conch shells and drums." },
      { question: "How far is it from Leh?", answer: "It is about 19 km from Leh town along the Manali-Leh highway, taking around 25 minutes by road." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Shey Palace",
    destination: "Ladakh Bike",
    category: "Historical",
    location: "Shey, Leh, Ladakh",
    altitude: "11,200 ft",
    bestTime: "May to October",
    visitingHours: "8:00 AM - 6:00 PM",
    entryFee: "₹30 (Included)",
    image: "https://images.unsplash.com/photo-1588096344356-9b6d859d57a9?auto=format&fit=crop&q=80&w=800",
    description: "Shey Palace was the former summer capital of the royal family of Ladakh, built in 1655 by the king Deldan Namgyal. Mostly in ruins today, the palace is situated on a hill 15 km south of Leh. The palace complex houses the Shey Monastery, which is famous for its massive, 12-meter-tall seated Buddha statue made of copper and gilded in gold. The statue is the second largest Buddha statue in Ladakh. The palace ruins offer a fascinating look into royal history and offer a panoramic view of the Indus River valley.",
    etiquette: [
      "Remove shoes before stepping into the monastery temple containing the giant Buddha",
      "Do not climb or lean on the fragile mud walls of the palace ruins",
      "Keep to the marked paths and stairways for safety",
      "Respect the local temple keepers and monks"
    ],
    faqs: [
      { question: "What is inside the palace?", answer: "Most of the palace rooms are closed, but you can visit the monastery temple containing the giant gold-gilded Buddha statue and view the ancient scriptures." },
      { question: "Is there a lake nearby?", answer: "Yes, there is a small, sacred lake located directly below the palace on the roadside, reflecting the ruins." }
    ],
    includedPaid: "Included"
  },

  // ==========================================
  // KERALA (9 Attractions)
  // ==========================================
  {
    name: "Valara & Cheeyappara Waterfalls",
    destination: "Kerala",
    category: "Nature",
    location: "Adimali, Kerala",
    altitude: "1,500 ft",
    bestTime: "June to December (Post-monsoon is spectacular)",
    visitingHours: "24 Hours (Best viewed in daylight)",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=800",
    description: "Valara and Cheeyappara are twin waterfalls located on the scenic Cochin-Munnar highway, serving as a beautiful welcome to the hills of Munnar. Cheeyappara Waterfall cascades down in seven spectacular rocky steps, presenting a stunning visual sight. Nearby, Valara Waterfall is surrounded by dense, lush green forests and drops from a steep cliff. These roadside waterfalls are popular stops for travelers to take photos, enjoy fresh coconut water, and stretch their legs while enjoying the cool, mist-filled mountain air.",
    etiquette: [
      "Do not attempt to climb the slippery rocks near the waterfall cascades; it is highly dangerous",
      "Keep the roadside clean; do not litter plastic bottles or snack wrappers",
      "Watch out for moving highway traffic while taking photos from the roadside viewpoint",
      "Do not feed the local monkeys near the waterfalls"
    ],
    faqs: [
      { question: "Can we bathe in the waterfalls?", answer: "Bathing is dangerous and not allowed at Cheeyappara due to steep rock drops and fast currents, though you can stand near the spray at the bottom safely." },
      { question: "Are these close to Munnar?", answer: "They are located about 40 km before Munnar, serving as a popular stopover during the drive from Kochi." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Munnar tea plantations",
    destination: "Kerala",
    category: "Nature",
    location: "Munnar, Kerala",
    altitude: "5,200 ft",
    bestTime: "September to May",
    visitingHours: "Sunrise to Sunset",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
    description: "Munnar's iconic tea plantations are rolling green hills covered in manicured tea shrubs, presenting a breathtaking landscape that defines the Western Ghats. Originally introduced by British settlers, Munnar is home to some of the highest tea plantations in the world. Walking through the narrow pathways between the tea bushes under a blanket of morning mist is a serene experience. Visitors can watch local tea pluckers at work, visit historic tea museums, and taste fresh cardamom and green tea at source.",
    etiquette: [
      "Do not pluck tea leaves or damage the tea bushes; they are private estate properties",
      "Do not litter in the estates; keep the hills clean and green",
      "Ask permission before photographing the estate workers",
      "Stick to the defined paths and do not wander deep into the private tea hills"
    ],
    faqs: [
      { question: "Can we visit a tea factory?", answer: "Yes, there are several estate museums, like the Tata Tea Museum in Nallathanni, where you can watch the tea processing steps and buy premium teas." },
      { question: "Which is the highest tea estate nearby?", answer: "Kolukkumalai Tea Estate, located 35 km from Munnar, is famous as the highest organic tea estate in the world." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Eravikulam National Park",
    destination: "Kerala",
    category: "Wildlife",
    location: "Munnar, Kerala",
    altitude: "7,200 ft",
    bestTime: "September to February (Closed in Feb-March for calving)",
    visitingHours: "7:30 AM - 4:00 PM",
    entryFee: "₹125 for Indians, ₹420 for Foreigners (Optional Paid)",
    image: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800",
    description: "Eravikulam National Park is a pristine wildlife sanctuary located 15 km from Munnar, famous as the home of the Nilgiri Tahr—an endangered, high-altitude mountain goat native to the Western Ghats. The park features lush green shola forests and rolling grasslands, with the majestic Anamudi Peak (South India's highest peak at 8,842 ft) standing tall in the background. The park is also famous for the Neelakurinji flowers, which bloom once every 12 years, turning the entire hillsides into a carpet of violet.",
    etiquette: [
      "Do not feed, tease, or go too close to the Nilgiri Tahr goats; they are wild animals",
      "The park is a strict no-plastic and no-smoking zone; keep your trash in your bags",
      "Visitors must board the government forest department buses to go up; private vehicles are not allowed",
      "Maintain silence and stick to the paved walking tracks"
    ],
    faqs: [
      { question: "Is the park closed during certain months?", answer: "Yes, the park is closed for about 30 to 45 days in February and March each year for the calving season of the Nilgiri Tahr." },
      { question: "How much walking is required?", answer: "Once the forest bus drops you, there is a scenic, uphill paved walk of about 1.5 km to the viewpoint." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "Mattupetty Dam & Lake",
    destination: "Kerala",
    category: "Lake",
    location: "Munnar, Kerala",
    altitude: "5,570 ft",
    bestTime: "September to May",
    visitingHours: "9:00 AM - 5:30 PM",
    entryFee: "Free (Boating and Dairy Farm entrance paid)",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
    description: "Mattupetty Dam is a massive concrete gravity dam nestled in the hills of Munnar, built to conserve water for hydroelectric power. The dam creates a beautiful, serene lake surrounded by dense pine forests, tea estates, and misty hills. The lake is popular for speedboating and motorboat cruises, where travelers can often spot herds of wild elephants coming down to drink water on the forested shores. Nearby, the Indo-Swiss Dairy Project farm offers a unique look at high-yield cattle breeding.",
    etiquette: [
      "Wear a life jacket at all times if opting for speedboating or cruise boat rides",
      "Do not throw plastic bottles or food wrappers into the lake water",
      "Do not attempt to cross the safety barriers on the dam bridge",
      "Avoid making loud noises near the forest shores where elephants might be present"
    ],
    faqs: [
      { question: "What activities are available at Mattupetty?", answer: "Speedboating, rowboating, horse riding, and shopping at local handicraft stalls are the top activities." },
      { question: "Can we visit the Swiss dairy farm?", answer: "Yes, though entry is restricted to certain sections and hours; check with the farm office." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Echo Point & Kundala Lake",
    destination: "Kerala",
    category: "Lake",
    location: "Munnar, Kerala",
    altitude: "5,600 ft",
    bestTime: "September to May",
    visitingHours: "9:00 AM - 6:00 PM",
    entryFee: "Free (Included)",
    image: "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800",
    description: "Echo Point is a scenic spot located at the confluence of three mountain streams, famous for its natural acoustic echo phenomenon where your voice echoes back clearly through the valley. Nearby, Kundala Lake is a beautiful, peaceful reservoir surrounded by cherry blossom trees and pine forests. Kundala is famous for Kashmiri Shikara boat rides and pedal boat rides. Flanked by green tea hills, the spot is perfect for a relaxing afternoon walk, photography, and shopping for local spices.",
    etiquette: [
      "Do not shout excessively or use megaphones; enjoy the echo naturally and respect other travelers",
      "Follow safety guidelines when boarding the Shikara or pedal boats",
      "Use trash bins to discard wrappers and keep the lakeside clean",
      "Be careful on the wet, muddy slopes near the lake edge"
    ],
    faqs: [
      { question: "Why does it echo here?", answer: "The unique topography of the surrounding hills, water body, and dense forest canopy reflects sound waves, causing them to bounce back to the source." },
      { question: "Can we see Neela Kurinji flowers here?", answer: "Yes, the hillsides around Kundala Lake are known to be covered in purple blooms when the Neelakurinji season occurs every 12 years." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Blossom Park Munnar",
    destination: "Kerala",
    category: "Nature",
    location: "Munnar Town, Kerala",
    altitude: "5,000 ft",
    bestTime: "September to May",
    visitingHours: "9:00 AM - 7:00 PM",
    entryFee: "₹10 for Adults, ₹5 for Children (Optional Paid)",
    image: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=800",
    description: "Blossom Hydel Park is a beautiful, sprawling botanical garden located on the banks of the Muthirappuzha River in Munnar. Spanning 16 acres, the park is famous for its vibrant flower beds, rare orchids, manicured lawns, and giant treehouses. Visitors can enjoy walking along the paved pathways, bird watching, cycling, and boating in the calm waters of the river. The park is a popular spot for families to relax, have a picnic, and enjoy the cool mountain air and lush green surroundings.",
    etiquette: [
      "Do not pluck flowers or step on the delicate flower beds",
      "Dispose of plastic wrappers in trash bins; help preserve the park's clean, green look",
      "Keep to the paved pathways and do not damage the lawns",
      "Follow safety rules when using children's play areas or boating"
    ],
    faqs: [
      { question: "What are the main activities inside the park?", answer: "Cycling, boating, roller skating, walking through flower gardens, and climbing treehouses are the top activities." },
      { question: "Is the park close to Munnar town?", answer: "Yes, it is located just 3 km from the main Munnar town market." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "Periyar Wildlife Sanctuary",
    destination: "Kerala",
    category: "Wildlife",
    location: "Thekkady, Kerala",
    altitude: "3,000 ft",
    bestTime: "October to April",
    visitingHours: "6:00 AM - 6:00 PM (Boat safari timings: 7:30 AM, 9:30 AM, 11:15 AM, 1:45 PM, 3:30 PM)",
    entryFee: "₹45 for Adults, ₹150 for Boat Safari (Optional Paid)",
    image: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=800",
    description: "Periyar Wildlife Sanctuary, located in the misty hills of Thekkady, is one of India's premier tiger and elephant reserves. Set around a scenic, artificial lake created by the Mullaperiyar Dam, the sanctuary features dense evergreen and deciduous forests. The highlight is the boat safari on the lake, where visitors can spot herds of wild elephants, bison, wild boars, sambar deer, and a variety of water birds along the lake shores. It offers a unique opportunity to view wildlife in their natural habitat from the safety of a boat.",
    etiquette: [
      "Maintain absolute silence during the boat safari to avoid scaring away the wild animals",
      "Do not stand up, lean over, or shift weight suddenly on the boat; sit in your assigned seats",
      "Do not litter plastic in the forest or lake water; it is a protected reserve",
      "Wear muted, earthy-colored clothing (greens, browns) to blend into the forest environment"
    ],
    faqs: [
      { question: "Can we see tigers?", answer: "While Periyar is a tiger reserve, tiger sightings are rare due to the dense forest canopy, though elephant and bison sightings are highly common during the boat cruise." },
      { question: "How do we get tickets for the boat safari?", answer: "It is highly recommended to book the boat tickets online in advance via the Kerala Forest Department portal, as spot booking queues are long." }
    ],
    includedPaid: "Paid"
  },
  {
    name: "Thekkady spice markets",
    destination: "Kerala",
    category: "Cultural",
    location: "Thekkady, Kerala",
    altitude: "3,000 ft",
    bestTime: "September to May",
    visitingHours: "9:00 AM - 8:00 PM",
    entryFee: "Free (Spice Garden tour ₹100 paid on site)",
    image: "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
    description: "Thekkady is the spice capital of Kerala, and its aromatic spice markets are a sensory delight. The air is filled with the rich scent of cardamom, black pepper, cinnamon, cloves, nutmeg, and vanilla. Visitors can walk through local spice gardens to see how these spices are grown and harvested from plants. The markets offer the perfect opportunity to buy fresh, premium-quality spices directly at source, along with natural oils, organic tea, and handmade aromatic soaps, making it a great shopping experience.",
    etiquette: [
      "Buy from certified organic shops and check the packaging quality of spices",
      "Listen carefully to the spice garden guide's explanations; ask questions politely",
      "Do not touch or pluck spice leaves or pods in the gardens without permission",
      "Support local farmers and cooperative spice shops"
    ],
    faqs: [
      { question: "What is a spice garden tour?", answer: "It is a 30 to 45-minute guided walk through a plantation where you can see plants of black pepper, cardamom, cinnamon, vanilla, and cocoa growing naturally." },
      { question: "Which spices are famous in Thekkady?", answer: "Black pepper (known as black gold) and green cardamom are the most famous and premium spices of the region." }
    ],
    includedPaid: "Included"
  },
  {
    name: "Alleppey backwater cruise",
    destination: "Kerala",
    category: "Lake",
    location: "Alleppey, Kerala",
    altitude: "Sea Level",
    bestTime: "September to March",
    visitingHours: "10:00 AM - 5:30 PM (Overnight houseboats have different hours)",
    entryFee: "Included in Package",
    image: "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800",
    description: "Experience the ultimate tranquility of Kerala's famous backwaters with an Alleppey backwater cruise. Gliding slowly on a traditional houseboat or shikara boat through a network of canals, lakes, and lagoons, you are surrounded by coconut palms, green paddy fields, and floating lotus ponds. The cruise offers a peaceful, scenic look into the rustic village life of Kuttanad, where locals travel in canoes, fish, and harvest crops below sea level. Flanked by calm waters and misty horizons, it is the signature experience of Kerala.",
    etiquette: [
      "Follow the captain and boat crew's safety instructions regarding boarding and moving on the boat",
      "Do not throw trash, plastic bottles, or food waste into the canal water",
      "Do not jump or dive into the backwater canals, as the depth is unpredictable and currents can be tricky",
      "Respect the privacy of local villagers living along the canal banks"
    ],
    faqs: [
      { question: "What is the difference between a Shikara and a Houseboat?", answer: "Shikaras are smaller, open-sided boats perfect for day cruises in narrow canals, while Houseboats are large wooden structures with bedrooms, bathrooms, and a kitchen for overnight stays." },
      { question: "Is lunch served on the boat?", answer: "Yes, traditional Keralan meals (served on a banana leaf) are prepared fresh on board using local ingredients like coconut and pearl spot fish." }
    ],
    includedPaid: "Included"
  }
];

async function seed() {
  console.log('--- STARTING ATTRACTIONS SEEDING ---');
  try {
    for (const attr of ATTRACTIONS) {
      const slug = slugify(attr.name);
      
      // Map to destination trips
      let tripSlugs = [];
      if (attr.destination === "Manali Kasol Amritsar") {
        tripSlugs = ["bhrigu-lake-trek-manali-kasol-amritsar", "manali-kasol-amritsar-backpacking-trip"];
      } else if (attr.destination === "Spiti Valley") {
        tripSlugs = ["spiti-valley-road-trip", "winter-spiti-road-trip"];
      } else if (attr.destination === "Kedarnath") {
        tripSlugs = ["kedarnath-badrinath-tungnath-rishikesh", "kedarnath-tungnath-rishikesh-trip"];
      } else if (attr.destination === "Ladakh Bike") {
        tripSlugs = ["leh-ladakh-bike-expedition-2026"];
      } else if (attr.destination === "Kerala") {
        tripSlugs = ["kerala-getaway"];
      }

      console.log(`Upserting attraction: ${attr.name} (${slug})`);
      
      // 1. Create or Update in Attraction table
      await prisma.attraction.upsert({
        where: { slug: slug },
        update: {
          name: attr.name,
          location: attr.location,
          altitude: attr.altitude,
          bestTime: attr.bestTime,
          visitingHours: attr.visitingHours,
          entryFee: attr.entryFee,
          description: attr.description,
          image: attr.image,
          category: attr.category.toLowerCase(),
          etiquette: attr.etiquette,
          faqs: attr.faqs
        },
        create: {
          name: attr.name,
          slug: slug,
          location: attr.location,
          altitude: attr.altitude,
          bestTime: attr.bestTime,
          visitingHours: attr.visitingHours,
          entryFee: attr.entryFee,
          description: attr.description,
          image: attr.image,
          category: attr.category.toLowerCase(),
          etiquette: attr.etiquette,
          faqs: attr.faqs
        }
      });

      // 2. Add to matching trips attractions json field
      for (const tSlug of tripSlugs) {
        const trip = await prisma.trip.findUnique({
          where: { slug: tSlug }
        });

        if (trip) {
          // Parse existing or start empty
          let currentAttractions = [];
          if (trip.attractions) {
            currentAttractions = typeof trip.attractions === 'string'
              ? JSON.parse(trip.attractions)
              : trip.attractions;
          }

          if (!Array.isArray(currentAttractions)) {
            currentAttractions = [];
          }

          // Check if attraction already exists in list
          const exists = currentAttractions.some(a => a.slug === slug || a.name === attr.name);
          
          if (!exists) {
            currentAttractions.push({
              name: attr.name,
              slug: slug,
              image: attr.image,
              description: attr.description.substring(0, 120) + "..."
            });

            await prisma.trip.update({
              where: { id: trip.id },
              data: {
                attractions: currentAttractions
              }
            });
            console.log(`  Added attraction reference to trip: ${trip.title}`);
          }
        }
      }
    }
    console.log('--- SEEDING COMPLETED SUCCESSFUL ---');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
