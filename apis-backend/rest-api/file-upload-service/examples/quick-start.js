/**
 * Quick Start Example for File Upload Service
 *
 * This example demonstrates how to use the file upload service API
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3000/api';

// Example 1: Upload a single file
async function uploadSingleFile() {
  console.log('\n=== Example 1: Upload Single File ===');

  const formData = new FormData();
  formData.append('file', fs.createReadStream('./test-image.jpg'));
  formData.append('folder', 'images');
  formData.append('prefix', 'profile');

  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: formData.getHeaders()
    });

    console.log('Upload successful!');
    console.log('File Key:', response.data.data.fileKey);
    console.log('File URL:', response.data.data.url);

    return response.data.data.fileKey;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

// Example 2: Upload multiple files
async function uploadMultipleFiles() {
  console.log('\n=== Example 2: Upload Multiple Files ===');

  const formData = new FormData();
  formData.append('files', fs.createReadStream('./file1.jpg'));
  formData.append('files', fs.createReadStream('./file2.pdf'));
  formData.append('files', fs.createReadStream('./file3.png'));
  formData.append('folder', 'documents');

  try {
    const response = await axios.post(`${API_BASE_URL}/upload/multiple`, formData, {
      headers: formData.getHeaders()
    });

    console.log('Multiple upload successful!');
    console.log(`Uploaded ${response.data.results.length} files`);

    response.data.results.forEach((result, index) => {
      if (result.success) {
        console.log(`File ${index + 1}: ${result.data.fileKey}`);
      } else {
        console.log(`File ${index + 1}: Failed - ${result.error}`);
      }
    });

    return response.data.results.map(r => r.data?.fileKey).filter(Boolean);
  } catch (error) {
    console.error('Multiple upload failed:', error.response?.data || error.message);
  }
}

// Example 3: List all files
async function listFiles(prefix = '') {
  console.log('\n=== Example 3: List Files ===');

  try {
    const response = await axios.get(`${API_BASE_URL}/files`, {
      params: { prefix }
    });

    console.log(`Found ${response.data.data.total} files`);
    response.data.data.files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.key} (${file.size} bytes)`);
    });

    return response.data.data.files;
  } catch (error) {
    console.error('List failed:', error.response?.data || error.message);
  }
}

// Example 4: Get file metadata
async function getFileMetadata(fileKey) {
  console.log('\n=== Example 4: Get File Metadata ===');

  try {
    const response = await axios.get(`${API_BASE_URL}/metadata/${fileKey}`);

    console.log('File Metadata:');
    console.log('Size:', response.data.data.size, 'bytes');
    console.log('Content Type:', response.data.data.contentType);
    console.log('Last Modified:', response.data.data.lastModified);

    return response.data.data;
  } catch (error) {
    console.error('Get metadata failed:', error.response?.data || error.message);
  }
}

// Example 5: Download a file
async function downloadFile(fileKey, outputPath) {
  console.log('\n=== Example 5: Download File ===');

  try {
    const response = await axios.get(`${API_BASE_URL}/files/${fileKey}`, {
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('File downloaded successfully to:', outputPath);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Download failed:', error.response?.data || error.message);
  }
}

// Example 6: Delete a file
async function deleteFile(fileKey) {
  console.log('\n=== Example 6: Delete File ===');

  try {
    const response = await axios.delete(`${API_BASE_URL}/files/${fileKey}`);

    console.log('File deleted successfully:', fileKey);
    return response.data;
  } catch (error) {
    console.error('Delete failed:', error.response?.data || error.message);
  }
}

// Example 7: Health check
async function healthCheck() {
  console.log('\n=== Example 7: Health Check ===');

  try {
    const response = await axios.get(`${API_BASE_URL}/health`);

    console.log('Service Status:', response.data.status);
    console.log('Service Name:', response.data.service);

    return response.data;
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Example 8: Upload with validation
async function uploadWithValidation() {
  console.log('\n=== Example 8: Upload with Validation ===');

  const formData = new FormData();
  formData.append('file', fs.createReadStream('./document.pdf'));
  formData.append('allowedExtensions', 'pdf,doc,docx');

  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: formData.getHeaders()
    });

    console.log('Upload with validation successful!');
    console.log('File Key:', response.data.data.fileKey);

    return response.data.data.fileKey;
  } catch (error) {
    console.error('Validation failed:', error.response?.data || error.message);
  }
}

// Example 9: Complete workflow
async function completeWorkflow() {
  console.log('\n=== Example 9: Complete Workflow ===');

  try {
    // 1. Health check
    await healthCheck();

    // 2. Upload file
    const fileKey = await uploadSingleFile();
    if (!fileKey) return;

    // 3. Get metadata
    await getFileMetadata(fileKey);

    // 4. List files
    await listFiles('images/');

    // 5. Download file
    await downloadFile(fileKey, './downloaded-file.jpg');

    // 6. Delete file
    await deleteFile(fileKey);

    console.log('\n✅ Complete workflow finished successfully!');
  } catch (error) {
    console.error('Workflow error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 File Upload Service - Quick Start Examples\n');
  console.log('Make sure the service is running on http://localhost:3000\n');

  // Run individual examples or complete workflow
  const args = process.argv.slice(2);

  if (args.includes('--all')) {
    await completeWorkflow();
  } else {
    console.log('Run with --all flag to execute complete workflow');
    console.log('Or modify this file to run specific examples\n');

    // Example: Run health check
    await healthCheck();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  listFiles,
  getFileMetadata,
  downloadFile,
  deleteFile,
  healthCheck,
  uploadWithValidation,
  completeWorkflow
};
