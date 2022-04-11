#!/bin/bash
# This is the publish script to sign and and publish the page via IPFS.
# Should be setup via cron to run periodically.

set -e

EXPORT_DIR="/home/tfelix/ipfs/export/w3shop/website/dist/w3shop"
STAGING_DIR="/home/tfelix/ipfs/export/staging"

if [ -d "$EXPORT_DIR" ]; then
  echo "Found new page to publish via IPFS"
  mv $EXPORT_DIR $STAGING_DIR
  HASH=$(docker exec -it ipfs ipfs add -Q -r "export/staging")
  echo "Publishing page with hash $HASH"
  # Find the last added hash from the response and prepare to publish this
  docker exec -it ipfs ipfs name publish --key=w3shop "$HASH"
  rm -rf $STAGING_DIR

else
  # Directory not found.
  exit 1
fi
