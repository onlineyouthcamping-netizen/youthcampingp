require('./src/utils/testSafety').assertMutatingTestSafety();
const { prisma } = require('./src/lib/prisma');
const { sendOTP, verifyOTP } = require('./src/controllers/userController');

// Helper to create mock request and response
function createMockReq(body, headers = {}) {
  return {
    body,
    headers
  };
}

function createMockRes() {
  const res = {
    statusVal: 200,
    jsonVal: null,
    status(code) {
      this.statusVal = code;
      return this;
    },
    json(data) {
      this.jsonVal = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('🧪 Starting WhatsApp OTP backend architecture validation...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (err) {
    console.warn('⚠️ Prisma db connection failed, but proceeding to test logic anyway.', err.message);
  }

  const phoneNum = '+919999999999';

  // Test 1: Send OTP
  console.log('\n--- Test 1: Generate OTP and Simulate WhatsApp send ---');
  const reqSend = createMockReq({ phone: phoneNum });
  const resSend = createMockRes();
  
  await sendOTP(reqSend, resSend, (err) => console.error('Error in sendOTP:', err));
  
  console.log('Send OTP Response Status:', resSend.statusVal);
  console.log('Send OTP Response Body:', JSON.stringify(resSend.jsonVal, null, 2));

  if (!resSend.jsonVal || !resSend.jsonVal.success) {
    console.error('❌ Test 1 Failed');
    process.exit(1);
  }

  const generatedOTP = resSend.jsonVal.otp;
  console.log(`Generated OTP is: ${generatedOTP}`);

  // Test 2: Verify with incorrect OTP
  console.log('\n--- Test 2: Verify OTP with invalid code ---');
  const reqVerifyBad = createMockReq({ phone: phoneNum, otp: '000000' });
  const resVerifyBad = createMockRes();

  await verifyOTP(reqVerifyBad, resVerifyBad, (err) => console.error('Error in verifyOTP:', err));
  console.log('Verify (Bad OTP) Response Status:', resVerifyBad.statusVal);
  console.log('Verify (Bad OTP) Response Body:', JSON.stringify(resVerifyBad.jsonVal, null, 2));

  if (resVerifyBad.statusVal !== 400 || resVerifyBad.jsonVal.success) {
    console.error('❌ Test 2 Failed: Did not reject invalid OTP');
    process.exit(1);
  } else {
    console.log('✅ Correctly rejected invalid OTP');
  }

  // Test 3: Verify with correct OTP
  console.log('\n--- Test 3: Verify OTP with correct code and login ---');
  const reqVerifyGood = createMockReq({ phone: phoneNum, otp: generatedOTP });
  const resVerifyGood = createMockRes();

  await verifyOTP(reqVerifyGood, resVerifyGood, (err) => console.error('Error in verifyOTP:', err));
  console.log('Verify (Correct OTP) Response Status:', resVerifyGood.statusVal);
  
  // Hide jwt token details from screen logs for safety
  const secureResponse = {
    ...resVerifyGood.jsonVal,
    data: resVerifyGood.jsonVal.data ? {
      ...resVerifyGood.jsonVal.data,
      token: '[JWT TOKEN REDACTED]'
    } : null
  };
  console.log('Verify (Correct OTP) Response Body:', JSON.stringify(secureResponse, null, 2));

  if (resVerifyGood.statusVal !== 200 || !resVerifyGood.jsonVal.success) {
    console.error('❌ Test 3 Failed: Did not log in successfully');
    process.exit(1);
  }

  console.log('\n🎉 ALL BACKEND OTP TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

runTests();
