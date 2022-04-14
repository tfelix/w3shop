#!/bin/bash

set -e

EXPORT_DIR="/home/tfelix/ipfs/export/w3shop/website/dist/w3shop"
STAGING_DIR="/home/tfelix/ipfs/export/staging"

if [ -d "$EXPORT_DIR" ]; then
  echo "Found new page to publish via IPFS"
  mv $EXPORT_DIR $STAGING_DIR
  HASH=$(docker exec -it ipfs ipfs add -Q -r "export/staging")
  # Somehow docker appends a \r to the variable and the next line chokes on this.
  # So we need to remove it.
  HASH_CLEANED=$(echo "$HASH" | sed 's/\\r//g')
  echo "Publishing page with hash $HASH"
  # Find the last added hash from the response and prepare to publish this
  docker exec -it ipfs ipfs name publish --key=w3shop "$HASH_CLEANED"
  rm -rf $STAGING_DIR

else
  #echo "No files for export found"
  # Directory not found.
  exit 1
fi
