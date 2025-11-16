const express = require('express');
const router = express.Router();

// Placeholder routes for documents
router.get('/', (req, res) => {
  res.json({ message: 'Get all documents', documents: [] });
});

router.get('/:id/download', (req, res) => {
  res.json({ message: 'Download document', documentId: req.params.id });
});

module.exports = router;
