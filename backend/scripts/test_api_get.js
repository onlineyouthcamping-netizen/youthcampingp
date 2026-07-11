require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { getBookingLinks } = require('./src/controllers/bookingLinkController');

async function main() {
  console.log('Testing getBookingLinks controller function...');
  
  // Mock request object mimicking an Admin request
  const req = {
    user: {
      id: 'cmpqvltiz0003z8j3nohxdugg', // dummy admin id
      role: 'admin',
      tenantId: 'default'
    },
    query: {}
  };

  // Mock response object
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log('SUCCESS JSON RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
    }
  };

  // Mock next function
  const next = (err) => {
    console.error('NEXT CALLED WITH ERROR:', err);
  };

  await getBookingLinks(req, res, next);
}

main().catch(console.error);
