const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/trainTicketController.js');
let code = fs.readFileSync(file, 'utf8');

const target = `    const { tripId, departureDate } = req.query;
    if (!tripId || !departureDate) {
      return res.status(400).json({ success: false, message: 'tripId and departureDate are required' });
    }

    const templates = await prisma.trainTemplate.findMany({`;

const replacement = `    const { tripId, departureDate } = req.query;
    if (!tripId || !departureDate) {
      return res.status(400).json({ success: false, message: 'tripId and departureDate are required' });
    }

    let parsedDate = null;
    if (departureDate && departureDate !== 'undefined' && departureDate !== 'null') {
      parsedDate = new Date(departureDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = null;
      }
    }

    const templates = await prisma.trainTemplate.findMany({
      where: {
        tenantId: req.user.tenantId,
        tripId,
        isActive: true,
        ...(parsedDate ? { departureDate: { in: [null, parsedDate] } } : { departureDate: null })
      }
    });
    
    // To avoid changing the original query logic structure completely, let's just replace the where block.
`;

// Actually, I can just use multi_replace_file_content!
