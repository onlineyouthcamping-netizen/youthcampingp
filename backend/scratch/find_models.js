const fs = require('fs');
const schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const modelRegex = /model\s+(\w+)\s+\{[\s\S]*?\}/g;
let match;
while ((match = modelRegex.exec(schema)) !== null) {
  const modelContent = match[0];
  const modelName = match[1];
  if (modelContent.includes('fields: [tripId]') && modelContent.includes('onDelete: Restrict')) {
    console.log(modelName);
  }
}
