const fs = require('fs');
const readline = require('readline');
const path = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\c3c03ba6-3a78-4f4b-b1db-d6f5da2f987a\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        console.log(`=== Step ${obj.step_index} (${obj.created_at}) ===`);
        console.log(obj.content);
        console.log('\n' + '='.repeat(40) + '\n');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

run();
