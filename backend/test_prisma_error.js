const { PrismaClient, PrismaClientValidationError } = require('@prisma/client');
async function test() {
  const safeDelete = async (fn, name) => {
    try { await fn(); } catch(e) { console.warn(`[DELETE] ${name} skip/error:`, e.name); }
  };
  await safeDelete(() => { throw new PrismaClientValidationError("Test error"); }, "test_model");
  console.log("Success! Node did not crash.");
}
test().catch(console.error);
