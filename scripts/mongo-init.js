// MongoDB initialization script for replica set
db.createCollection('batches');
db.createCollection('documents');
db.createCollection('fs.files');
db.createCollection('fs.chunks');

// Create indexes
db.batches.createIndex({ status: 1, createdAt: -1 });
db.batches.createIndex({ _id: 1, status: 1 });

db.documents.createIndex({ batchId: 1, status: 1 });
db.documents.createIndex({ userId: 1, createdAt: -1 });
db.documents.createIndex({ status: 1, createdAt: -1 });

print('MongoDB initialization completed');
