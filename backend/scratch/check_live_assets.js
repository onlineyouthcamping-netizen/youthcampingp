const axios = require('axios');

async function main() {
  try {
    const res = await axios.get('https://admin.youthcamping.online/', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = res.data;
    const matches = html.match(/src="[^"]+index-[^"]+\.js"/g) || html.match(/href="[^"]+index-[^"]+\.css"/g);
    console.log("HOMEPAGE ASSET MATCHES:", matches);
  } catch (err) {
    console.error("ERROR FETCHING HOMEPAGE:", err.message);
  }
}

main();
