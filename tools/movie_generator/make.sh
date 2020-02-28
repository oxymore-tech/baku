#!/bin/bash
set -e

if [[ -z $1 ]]; then
  echo "USAGE: $0 images_path"
  exit 1
fi

rm -rf ./output/

stack_path="./output/stacks/premier.stack"
mkdir -p ./output/stacks
echo '[{"action":4,"user":"Lovely Anole","value":{"name":"Nouveau plan","shotId":"shot-000"}}' > $stack_path

original_path="./output/images/premier/original"
lightweight_path="./output/images/premier/lightweight"
thumbnail_path="./output/images/premier/thumbnail"
mkdir -p $original_path $lightweight_path $thumbnail_path

idx=0
images=$(find $1 -type f | sort)
for image in $images;
do
  echo "processing $image ..."

  image_file=$(uuidgen).jpg

  cp $image $original_path/$image_file
  convert -strip -interlace Plane -gaussian-blur 0.05 -quality 30% $image $lightweight_path/$image_file
  convert $lightweight_path/$image_file -resize 355x200 $thumbnail_path/$image_file

  echo ',{"action":3,"user":"Lovely Anole","value":{"image":"'$image_file'","imageIndex":'$idx',"shotId":"shot-000"}}' >> $stack_path
  idx=$(( idx + 1 ))
done

echo ']' >> $stack_path
