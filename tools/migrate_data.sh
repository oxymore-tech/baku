#!/bin/bash
set -e

function usage {
  echo "usage:"
  echo "  $0 data_dir"
}

if [[ -z "$1" ]]; then
  usage
  exit 1
fi
if [[ ! -d "$1/images" ]]; then
  echo "image directory not found: $1/images"
  exit 1
fi
cd $1

for PROJECT_ID in $(ls ./stacks | cut -d. -f1);
do
  echo "migrating $PROJECT_ID ..."
  sudo mkdir -p $PROJECT_ID
  sudo mv stacks/$PROJECT_ID.stack $PROJECT_ID/stack.json
  sudo mv -p images/$PROJECT_ID $PROJECT_ID/images 2> /dev/null || true
done

sudo rm -rf stacks/ images/
