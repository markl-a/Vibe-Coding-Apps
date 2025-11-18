const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Document = require('../models/Document');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, and TXT are allowed.'));
    }
  }
});

// Middleware to verify customer authentication
const authenticateCustomer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
};

// Get all documents for the authenticated customer
router.get('/', authenticateCustomer, async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      tags,
      includeArchived = 'false',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { customer: req.user._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    if (includeArchived !== 'true') {
      query.isArchived = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch documents
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-fileUrl'); // Don't expose direct file URLs in list

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/:id', authenticateCustomer, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if document is accessible
    if (!document.isAccessible()) {
      return res.status(403).json({
        error: 'Document is not accessible',
        reason: document.isArchived ? 'archived' : 'expired'
      });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Download document
router.get('/:id/download', authenticateCustomer, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if document is accessible
    if (!document.isAccessible()) {
      return res.status(403).json({
        error: 'Document is not accessible',
        reason: document.isArchived ? 'archived' : 'expired'
      });
    }

    // Record download
    await document.recordDownload();

    // Send file
    const filePath = path.join(__dirname, '..', document.fileUrl);

    res.download(filePath, document.originalName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Upload document
router.post('/upload', authenticateCustomer, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      title,
      description,
      type,
      category,
      tags,
      isPublic,
      expiresAt,
      metadata
    } = req.body;

    // Create document record
    const document = new Document({
      title,
      description,
      customer: req.user._id,
      type,
      category,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      downloadUrl: `/api/documents/${req.file.filename}/download`,
      isPublic: isPublic === 'true',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tags: tags ? tags.split(',') : [],
      metadata: metadata ? JSON.parse(metadata) : {},
      uploadedBy: {
        name: req.user.name,
        email: req.user.email
      }
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Archive document
router.patch('/:id/archive', authenticateCustomer, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.isArchived = true;
    await document.save();

    res.json({
      message: 'Document archived successfully',
      document
    });
  } catch (error) {
    console.error('Error archiving document:', error);
    res.status(500).json({ error: 'Failed to archive document' });
  }
});

// Get document statistics
router.get('/stats/summary', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user._id;

    // Total documents
    const totalDocuments = await Document.countDocuments({
      customer: customerId,
      isArchived: false
    });

    // Count by type
    const typeCounts = await Document.aggregate([
      {
        $match: {
          customer: customerId,
          isArchived: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total storage used
    const storageStats = await Document.aggregate([
      { $match: { customer: customerId } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    // Recent documents
    const recentDocuments = await Document.find({
      customer: customerId,
      isArchived: false
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type createdAt downloadCount');

    res.json({
      totalDocuments,
      typeBreakdown: typeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      totalStorageUsed: storageStats[0]?.totalSize || 0,
      totalDownloads: storageStats[0]?.totalDownloads || 0,
      recentDocuments
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
});

module.exports = router;
