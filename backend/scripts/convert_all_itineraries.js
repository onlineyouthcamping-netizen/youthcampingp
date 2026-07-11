const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ACTION_VERBS = [
  'Arrive', 'Depart', 'Transfer', 'Visit', 'Explore', 'Hike', 'Enjoy', 'Walk',
  'Board', 'Check', 'Trek', 'Witness', 'Experience', 'Gather', 'Meet', 'Ride',
  'Drive', 'Stop', 'Stay', 'Conclude', 'Spend', 'Shop', 'Relive', 'Proceed',
  'Take', 'Participate', 'Engage', 'Reach', 'Check-in', 'Explore:', 'Gathering',
  'Report', 'Boarding'
];

function convertParagraphToBullets(text) {
  if (!text) return "";
  
  // Normalize whitespace and remove common tags/emojis
  let cleanText = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/<br\s*\/?>/gi, '. ')
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, ''); // remove emojis

  // Split into sentences / items
  const lines = cleanText.split(/[.!?\n\r•\-\*]/g);
  const bullets = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Skip meta lines
    const lowerLine = line.toLowerCase();
    if (lowerLine.startsWith('stay:') || lowerLine.startsWith('meals:') || lowerLine.startsWith('food:') || lowerLine.startsWith('distance:')) {
      continue;
    }
    
    // Normalize logistics
    if (lowerLine.startsWith('reporting time:')) {
      const match = line.match(/\d+:\d+\s*(?:AM|PM|am|pm)?/);
      bullets.push(`Report at the designated assembly point at ${match ? match[0] : 'the scheduled time'}.`);
      continue;
    }
    if (lowerLine.startsWith('pickup point:') || lowerLine.startsWith('pick-up point:')) {
      const loc = line.split(':')[1]?.trim() || '';
      bullets.push(`Gather at the ${loc || 'designated'} pickup location.`);
      continue;
    }
    if (lowerLine.startsWith('departure:')) {
      bullets.push(`Depart for the journey as per the scheduled departure time.`);
      continue;
    }

    // Capitalize first letter
    let sentence = line.charAt(0).toUpperCase() + line.slice(1);
    
    // Check if it starts with an action verb
    const firstWord = sentence.split(/\s+/)[0].replace(/[^a-zA-Z]/g, '');
    const startsWithAction = ACTION_VERBS.some(verb => firstWord.toLowerCase() === verb.toLowerCase());
    
    if (!startsWithAction && firstWord) {
      const lower = sentence.toLowerCase();
      if (lower.includes('trek') || lower.includes('climb') || lower.includes('ascend')) {
        sentence = `Trek ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('drive') || lower.includes('ride') || lower.includes('travel')) {
        sentence = `Drive ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('visit') || lower.includes('temple') || lower.includes('monastery') || lower.includes('lake') || lower.includes('falls')) {
        sentence = `Visit ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('explore') || lower.includes('market') || lower.includes('street') || lower.includes('cafe')) {
        sentence = `Explore ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('enjoy') || lower.includes('dinner') || lower.includes('breakfast') || lower.includes('meal')) {
        sentence = `Enjoy ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('check')) {
        sentence = `Check ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else if (lower.includes('arrive') || lower.includes('reach')) {
        sentence = `Arrive ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      } else {
        sentence = `Explore and ${sentence.charAt(0).toLowerCase() + sentence.slice(1)}`;
      }
    }
    
    // Strip trailing punctuation
    sentence = sentence.replace(/[.,;:\s]+$/, '').trim() + '.';

    // Enforce word counts (8-20 words)
    const words = sentence.split(/\s+/);
    if (words.length < 8) {
      sentence = sentence.replace(/\.$/, ' for a memorable travel experience.');
    } else if (words.length > 20) {
      sentence = words.slice(0, 19).join(' ') + '.';
    }
    
    bullets.push(sentence);
  }
  
  if (bullets.length === 0) return "";
  return bullets.map(b => `• ${b}`).join('\n');
}

async function main() {
  console.log("=== Processing Database Trips ===");
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    let updated = false;
    const newItinerary = trip.itinerary.map(day => {
      // Only convert if it doesn't already look like a clean list of bullet points
      if (day.description && !day.description.startsWith('•')) {
        const bullets = convertParagraphToBullets(day.description);
        if (bullets) {
          updated = true;
          return {
            ...day,
            description: bullets
          };
        }
      }
      return day;
    });

    if (updated) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { itinerary: newItinerary }
      });
      console.log(`Updated Trip database row: "${trip.title}"`);
    }
  }

  console.log("\n=== Processing Seed Data JSON File ===");
  const jsonPath = path.join(__dirname, 'trips-data.json');
  if (fs.existsSync(jsonPath)) {
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const tripsJson = JSON.parse(rawData);
    let jsonUpdated = false;

    tripsJson.forEach(trip => {
      let tripUpdated = false;
      trip.itinerary = trip.itinerary.map(day => {
        if (day.description && !day.description.startsWith('•')) {
          const bullets = convertParagraphToBullets(day.description);
          if (bullets) {
            tripUpdated = true;
            return {
              ...day,
              description: bullets
            };
          }
        }
        return day;
      });

      if (tripUpdated) {
        jsonUpdated = true;
        console.log(`Updated Seed JSON Trip: "${trip.title}"`);
      }
    });

    if (jsonUpdated) {
      fs.writeFileSync(jsonPath, JSON.stringify(tripsJson, null, 2), 'utf8');
      console.log("Successfully wrote updated seed JSON to trips-data.json!");
    }
  } else {
    console.warn("trips-data.json not found in this folder");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
