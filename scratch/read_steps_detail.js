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
      if (obj.step_index >= 240 && obj.step_index <= 250) {
        console.log(`=== Step ${obj.step_index} (${obj.source} - ${obj.type}) ===`);
        console.log("CONTENT:", obj.content);
        if (obj.tool_calls) console.log("TOOL CALLS:", JSON.stringify(obj.tool_calls));
        console.log('\n' + '='.repeat(40) + '\n');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

run();
