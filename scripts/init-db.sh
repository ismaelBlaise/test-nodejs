#!/bin/bash

# Start MongoDB replica set
docker-compose up -d mongodb
sleep 10

# Initialize MongoDB
docker exec doc-gen-mongodb mongosh --eval "
  db = db.getSiblingDB('document-generation');
  db.createCollection('batches');
  db.createCollection('documents');
"

echo "MongoDB initialized"
