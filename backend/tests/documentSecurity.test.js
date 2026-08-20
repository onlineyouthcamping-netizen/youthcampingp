jest.mock('../src/lib/prisma', () => ({
  prisma: {
    companyDocument: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('cloudinary', () => ({
  v2: {
    utils: {
      private_download_url: jest.fn().mockReturnValue('https://cloudinary.com/signed-url')
    }
  }
}));

jest.mock('../src/utils/eventBus', () => ({
  publishEvent: jest.fn().mockResolvedValue(true)
}));

const { prisma } = require('../src/lib/prisma');
const { getDocumentAccessUrl } = require('../src/controllers/erpController');

describe('Document Security - Cloudinary Delivery', () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: { id: 'doc1' }, user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should grant temporary access to legal document for authorized user', async () => {
    req.user = { id: 'u1', role: 'sales', permissions: ['company_documents.view_legal'] };
    
    prisma.companyDocument.findUnique.mockResolvedValue({
      id: 'doc1',
      title: 'Contract',
      category: 'legal',
      isArchived: false,
      versions: [{ versionNumber: 1, storageKey: 'test_public_id', originalFilename: 'doc.pdf' }]
    });

    await getDocumentAccessUrl(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, url: 'https://cloudinary.com/signed-url' });
  });

  it('should return 403 for unauthorized user accessing legal document', async () => {
    req.user = { id: 'u2', role: 'hr', permissions: ['company_documents.view_hr'] };
    
    prisma.companyDocument.findUnique.mockResolvedValue({
      id: 'doc1',
      title: 'Contract',
      category: 'legal',
      isArchived: false,
      versions: [{ versionNumber: 1, storageKey: 'test_public_id', originalFilename: 'doc.pdf' }]
    });

    await getDocumentAccessUrl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
  });

  it('should return 404 for archived documents', async () => {
    req.user = { id: 'admin', role: 'admin' };
    prisma.companyDocument.findUnique.mockResolvedValue({
      id: 'doc2',
      isArchived: true
    });

    await getDocumentAccessUrl(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
