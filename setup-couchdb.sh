#!/bin/bash

# CouchDB Setup Script for AgroPlus
# This script initializes CouchDB databases and configurations

COUCHDB_URL="http://localhost:5984"
COUCHDB_USER="admin"
COUCHDB_PASSWORD="agroplus_secure_2024"

echo "🚀 Setting up CouchDB for AgroPlus..."

# Wait for CouchDB to be ready
echo "⏳ Waiting for CouchDB to be ready..."
until curl -s "$COUCHDB_URL" > /dev/null; do
    echo "Waiting for CouchDB..."
    sleep 2
done
echo "✅ CouchDB is ready!"

# Function to create database
create_database() {
    local db_name=$1
    echo "📁 Creating database: $db_name"
    
    curl -X PUT "$COUCHDB_URL/$db_name" \
         -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
         -H "Content-Type: application/json"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database $db_name created successfully"
    else
        echo "⚠️  Database $db_name might already exist"
    fi
    echo ""
}

# Function to create design document with indexes
create_design_doc() {
    local db_name=$1
    local design_doc=$2
    
    echo "📝 Creating design document for $db_name..."
    
    curl -X PUT "$COUCHDB_URL/$db_name/_design/indexes" \
         -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
         -H "Content-Type: application/json" \
         -d "$design_doc"
    
    echo "✅ Design document created for $db_name"
    echo ""
}

# Create all databases
echo "📚 Creating databases..."
create_database "agroplus_products"
create_database "agroplus_sales"
create_database "agroplus_categories"
create_database "agroplus_users"
create_database "agroplus_inventory"
create_database "agroplus_settings"

# Create indexes for products
products_design='{
  "language": "javascript",
  "views": {
    "by_name": {
      "map": "function(doc) { if (doc.type === \"product\" && doc.name) { emit(doc.name, doc); } }"
    },
    "by_category": {
      "map": "function(doc) { if (doc.type === \"product\" && doc.category_id) { emit(doc.category_id, doc); } }"
    },
    "by_sku": {
      "map": "function(doc) { if (doc.type === \"product\" && doc.sku) { emit(doc.sku, doc); } }"
    },
    "low_stock": {
      "map": "function(doc) { if (doc.type === \"product\" && doc.stock_quantity <= 10) { emit(doc.stock_quantity, doc); } }"
    }
  }
}'

# Create indexes for sales
sales_design='{
  "language": "javascript",
  "views": {
    "by_date": {
      "map": "function(doc) { if (doc.type === \"sale\" && doc.created_at) { emit(doc.created_at, doc); } }"
    },
    "by_cashier": {
      "map": "function(doc) { if (doc.type === \"sale\" && doc.cashier_id) { emit(doc.cashier_id, doc); } }"
    },
    "daily_totals": {
      "map": "function(doc) { if (doc.type === \"sale\" && doc.created_at && doc.total_amount) { var date = doc.created_at.split(\"T\")[0]; emit(date, doc.total_amount); } }",
      "reduce": "function(keys, values) { return sum(values); }"
    },
    "pending_sync": {
      "map": "function(doc) { if (doc.type === \"sale\" && doc.sync_status === \"pending\") { emit(doc.created_at, doc); } }"
    }
  }
}'

# Create indexes for categories
categories_design='{
  "language": "javascript",
  "views": {
    "by_name": {
      "map": "function(doc) { if (doc.type === \"category\" && doc.name) { emit(doc.name, doc); } }"
    },
    "all_categories": {
      "map": "function(doc) { if (doc.type === \"category\") { emit(doc.created_at, doc); } }"
    }
  }
}'

# Create indexes for users
users_design='{
  "language": "javascript",
  "views": {
    "by_email": {
      "map": "function(doc) { if (doc.type === \"user\" && doc.email) { emit(doc.email, doc); } }"
    },
    "by_role": {
      "map": "function(doc) { if (doc.type === \"user\" && doc.role) { emit(doc.role, doc); } }"
    }
  }
}'

# Apply design documents
create_design_doc "agroplus_products" "$products_design"
create_design_doc "agroplus_sales" "$sales_design"
create_design_doc "agroplus_categories" "$categories_design"
create_design_doc "agroplus_users" "$users_design"

# Configure CORS for web access
echo "🔧 Configuring CORS..."
curl -X PUT "$COUCHDB_URL/_node/_local/_config/httpd/enable_cors" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '"true"'

curl -X PUT "$COUCHDB_URL/_node/_local/_config/cors/origins" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '"*"'

curl -X PUT "$COUCHDB_URL/_node/_local/_config/cors/credentials" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '"true"'

curl -X PUT "$COUCHDB_URL/_node/_local/_config/cors/methods" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '"GET, PUT, POST, HEAD, DELETE"'

curl -X PUT "$COUCHDB_URL/_node/_local/_config/cors/headers" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'

echo "✅ CORS configured"

# Create a sample product for testing
echo "📦 Creating sample data..."
sample_product='{
  "_id": "product_sample_001",
  "type": "product",
  "name": "Sample Coffee",
  "sku": "COFFEE001",
  "category_id": "category_beverages",
  "price": 2.50,
  "buying_price": 1.20,
  "selling_price": 2.50,
  "stock_quantity": 100,
  "description": "Sample coffee product for testing",
  "is_active": true,
  "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
}'

curl -X PUT "$COUCHDB_URL/agroplus_products/product_sample_001" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d "$sample_product"

echo "✅ Sample product created"

# Create a sample category
sample_category='{
  "_id": "category_beverages",
  "type": "category",
  "name": "Beverages",
  "description": "Hot and cold beverages",
  "is_active": true,
  "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
  "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
}'

curl -X PUT "$COUCHDB_URL/agroplus_categories/category_beverages" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD" \
     -H "Content-Type: application/json" \
     -d "$sample_category"

echo "✅ Sample category created"

echo ""
echo "🎉 CouchDB setup completed successfully!"
echo ""
echo "📋 Setup Summary:"
echo "   • CouchDB URL: $COUCHDB_URL"
echo "   • Admin Username: $COUCHDB_USER"
echo "   • Admin Password: $COUCHDB_PASSWORD"
echo "   • Databases created: 6"
echo "   • Indexes created: Yes"
echo "   • CORS configured: Yes"
echo "   • Sample data: Yes"
echo ""
echo "🌐 Access CouchDB Admin Panel:"
echo "   http://localhost:5984/_utils"
echo ""
echo "⚡ Your offline-first POS system is ready!"
echo "   Start your Next.js app and test offline functionality"
echo ""
