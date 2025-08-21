#!/usr/bin/env bash

# React app API URL
export REACT_APP_API_URL=""

# Database connection string
export DATABASE="mongodb://127.0.0.1:27017/ecommerce"

# Server port
export PORT=8000

# Disable TLS certificate check (for development only!)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# JWT secret
export JWT_SECRET="SecretKey"

# Braintree configuration (leave empty if not set in the environment already)
export BRAINTREE_MERCHANT_ID=n74dc2kw9g3ws389
export BRAINTREE_PUBLIC_KEY=bgytmgzhz5f6t2tg
export BRAINTREE_PRIVATE_KEY=e6f226166da99d874f00008f0bba14fe

# Redis URL
export REDIS_URL="redis://127.0.0.1:6379"

echo "Environment variables set."