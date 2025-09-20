# CouchDB Setup Guide for AgroPlus POS System

This guide will help you set up CouchDB for offline-first synchronization with your AgroPlus POS system.

## Prerequisites

- Docker (recommended) or CouchDB installed locally
- Basic understanding of database administration

## Option 1: Docker Setup (Recommended)

### 1. Create Docker Compose File

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  couchdb:
    image: couchdb:3.3
    container_name: agroplus-couchdb
    restart: unless-stopped
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=your_secure_password_here
    volumes:
      - couchdb_data:/opt/couchdb/data
      - couchdb_config:/opt/couchdb/etc/local.d
    networks:
      - agroplus-network

volumes:
  couchdb_data:
  couchdb_config:

networks:
  agroplus-network:
    driver: bridge
```

### 2. Start CouchDB

```bash
docker-compose up -d
```

### 3. Access CouchDB Admin Panel

Open your browser and go to: `http://localhost:5984/_utils`

- Username: `admin`
- Password: `your_secure_password_here`

## Option 2: Local Installation

### Ubuntu/Debian

```bash
curl -L https://couchdb.apache.org/repo/keys.asc | sudo apt-key add -
echo "deb https://apache.jfrog.io/artifactory/couchdb-deb/ focal main" | sudo tee /etc/apt/sources.list.d/couchdb.list
sudo apt update
sudo apt install couchdb
```

### macOS

```bash
brew install couchdb
brew services start couchdb
```

### Windows

Download and install from: https://couchdb.apache.org/

## Database Setup

### 1. Create Required Databases

After CouchDB is running, create the following databases via the admin panel or curl:

```bash
# Using curl (replace admin:password with your credentials)
curl -X PUT http://admin:password@localhost:5984/agroplus_products
curl -X PUT http://admin:password@localhost:5984/agroplus_sales
curl -X PUT http://admin:password@localhost:5984/agroplus_categories
curl -X PUT http://admin:password@localhost:5984/agroplus_users
curl -X PUT http://admin:password@localhost:5984/agroplus_inventory
curl -X PUT http://admin:password@localhost:5984/agroplus_settings
```

### 2. Set Up CORS (Required for Browser Access)

```bash
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@localhost:5984/_node/_local/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
```

### 3. Create Database Indexes

For each database, create indexes for better query performance:

```javascript
// Products Database Indexes
{
  "index": {
    "fields": ["name"]
  },
  "name": "name-index",
  "type": "json"
}

{
  "index": {
    "fields": ["category_id"]
  },
  "name": "category-index",
  "type": "json"
}

{
  "index": {
    "fields": ["sku"]
  },
  "name": "sku-index",
  "type": "json"
}

{
  "index": {
    "fields": ["created_at"]
  },
  "name": "created-at-index",
  "type": "json"
}
```

```javascript
// Sales Database Indexes
{
  "index": {
    "fields": ["created_at"]
  },
  "name": "sales-date-index",
  "type": "json"
}

{
  "index": {
    "fields": ["cashier_id"]
  },
  "name": "cashier-index",
  "type": "json"
}

{
  "index": {
    "fields": ["total_amount"]
  },
  "name": "total-amount-index",
  "type": "json"
}
```

## Environment Configuration

### 1. Update Your .env.local File

```env
# CouchDB Configuration
NEXT_PUBLIC_COUCHDB_URL=http://localhost:5984
NEXT_PUBLIC_COUCHDB_USERNAME=admin
NEXT_PUBLIC_COUCHDB_PASSWORD=your_secure_password_here
```

### 2. Production Environment Variables

For production, use environment-specific values:

```env
# Production CouchDB Configuration
NEXT_PUBLIC_COUCHDB_URL=https://your-couchdb-server.com
NEXT_PUBLIC_COUCHDB_USERNAME=prod_user
NEXT_PUBLIC_COUCHDB_PASSWORD=very_secure_production_password
```

## Security Considerations

### 1. Change Default Credentials

Never use default credentials in production:

```bash
# Update admin password
curl -X PUT http://admin:old_password@localhost:5984/_node/_local/_config/admins/admin -d '"new_secure_password"'
```

### 2. Create Application-Specific Users

```bash
# Create a user for the POS application
curl -X PUT http://admin:password@localhost:5984/_users/org.couchdb.user:pos_user \
  -H "Content-Type: application/json" \
  -d '{
    "_id": "org.couchdb.user:pos_user",
    "name": "pos_user",
    "password": "pos_secure_password",
    "type": "user",
    "roles": ["pos_access"]
  }'
```

### 3. Database Security

```bash
# Set database security for products database
curl -X PUT http://admin:password@localhost:5984/agroplus_products/_security \
  -H "Content-Type: application/json" \
  -d '{
    "admins": {
      "names": ["admin"],
      "roles": ["admin"]
    },
    "members": {
      "names": ["pos_user"],
      "roles": ["pos_access"]
    }
  }'
```

## Testing the Setup

### 1. Test Database Connection

```bash
# Test if CouchDB is running
curl http://localhost:5984/

# Test database access
curl http://admin:password@localhost:5984/agroplus_products
```

### 2. Test from Your Application

Add this test function to your application:

```javascript
// Test CouchDB connection
async function testCouchDBConnection() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_COUCHDB_URL}/agroplus_products`, {
      headers: {
        'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_COUCHDB_USERNAME}:${process.env.NEXT_PUBLIC_COUCHDB_PASSWORD}`)}`
      }
    });
    
    if (response.ok) {
      console.log('✅ CouchDB connection successful');
      return true;
    } else {
      console.error('❌ CouchDB connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ CouchDB connection error:', error);
    return false;
  }
}
```

## Monitoring and Maintenance

### 1. Monitor Database Size

```bash
# Check database sizes
curl http://admin:password@localhost:5984/agroplus_products | jq '.disk_size'
curl http://admin:password@localhost:5984/agroplus_sales | jq '.disk_size'
```

### 2. Compact Databases

```bash
# Compact databases to reclaim space
curl -X POST http://admin:password@localhost:5984/agroplus_products/_compact
curl -X POST http://admin:password@localhost:5984/agroplus_sales/_compact
```

### 3. Backup Databases

```bash
# Backup databases
curl http://admin:password@localhost:5984/agroplus_products/_all_docs?include_docs=true > products_backup.json
curl http://admin:password@localhost:5984/agroplus_sales/_all_docs?include_docs=true > sales_backup.json
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is properly configured
2. **Authentication Failures**: Check username/password in environment variables
3. **Database Not Found**: Ensure all databases are created
4. **Connection Refused**: Check if CouchDB service is running

### Debug Commands

```bash
# Check CouchDB logs
docker logs agroplus-couchdb

# Check active tasks
curl http://admin:password@localhost:5984/_active_tasks

# Check replication status
curl http://admin:password@localhost:5984/_replicator/_all_docs
```

## Production Deployment

### 1. Use SSL/TLS

Always use HTTPS in production:

```env
NEXT_PUBLIC_COUCHDB_URL=https://your-secure-couchdb.com
```

### 2. Firewall Configuration

Restrict access to CouchDB port (5984) to only your application servers.

### 3. Regular Backups

Set up automated backups of your CouchDB databases.

### 4. Monitoring

Implement monitoring for:
- Database availability
- Replication lag
- Disk usage
- Performance metrics

## Getting Started

1. Follow the installation steps above
2. Update your environment variables
3. Start your Next.js application
4. The PouchDB integration will automatically connect and start syncing
5. Test offline functionality by disconnecting your internet

Your POS system is now ready for offline-first operation with automatic synchronization! 🎉
