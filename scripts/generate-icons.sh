#!/usr/bin/env bash
set -euo pipefail

SRC="/home/frenda/.gemini/antigravity-cli/brain/095cf2d9-56bd-41da-9ab2-0077a9c32c56/.user_uploaded/uploaded_media_1790090180472.png"
ROOT_DIR="$(pwd)"
PUB_DIR="${ROOT_DIR}/public"
RES_DIR="${ROOT_DIR}/android/app/src/main/res"

echo "Generating Web Icons in ${PUB_DIR}..."
mkdir -p "${PUB_DIR}"

# 1. 512x512 rounded (squircle)
magick -size 512x512 xc:none -fill white -draw "roundrectangle 0,0,511,511,112,112" /tmp/mask512.png
magick "${SRC}" -resize 512x512 /tmp/mask512.png -compose DstIn -composite "${PUB_DIR}/logo.png"

# 2. 512x512 circular
magick -size 512x512 xc:none -fill white -draw "circle 255.5,255.5 255.5,0" /tmp/mask_circle512.png
magick "${SRC}" -resize 512x512 /tmp/mask_circle512.png -compose DstIn -composite "${PUB_DIR}/logo-circle.png"

# 3. Apple Touch Icon (180x180)
magick -size 180x180 xc:none -fill white -draw "roundrectangle 0,0,179,179,40,40" /tmp/mask180.png
magick "${SRC}" -resize 180x180 /tmp/mask180.png -compose DstIn -composite "${PUB_DIR}/apple-touch-icon.png"

# 4. Favicon PNG (32x32) and ICO (16, 32, 48)
magick "${PUB_DIR}/logo-circle.png" -resize 32x32 "${PUB_DIR}/favicon-32x32.png"
magick "${PUB_DIR}/logo-circle.png" -define icon:auto-resize=48,32,16 "${PUB_DIR}/favicon.ico"

echo "Generating Android Mipmap Icons in ${RES_DIR}..."

DENSITIES=("mdpi:48:108" "hdpi:72:162" "xhdpi:96:216" "xxhdpi:144:324" "xxxhdpi:192:432")

for entry in "${DENSITIES[@]}"; do
  IFS=':' read -r name size fg_size <<< "${entry}"
  dir="${RES_DIR}/mipmap-${name}"
  mkdir -p "${dir}"

  # Rounded launcher icon (radius ~22%)
  r=$(( size * 22 / 100 ))
  s_minus_one=$(( size - 1 ))
  magick -size "${size}x${size}" xc:none -fill white -draw "roundrectangle 0,0,${s_minus_one},${s_minus_one},${r},${r}" "/tmp/mask_${size}.png"
  magick "${SRC}" -resize "${size}x${size}" "/tmp/mask_${size}.png" -compose DstIn -composite "${dir}/ic_launcher.png"

  # Round launcher icon (circle)
  half=$(( size / 2 ))
  magick -size "${size}x${size}" xc:none -fill white -draw "circle ${half},${half} ${half},0" "/tmp/mask_round_${size}.png"
  magick "${SRC}" -resize "${size}x${size}" "/tmp/mask_round_${size}.png" -compose DstIn -composite "${dir}/ic_launcher_round.png"

  # Foreground icon (safe zone ~72% of fg_size, centered on transparent canvas)
  inner=$(( fg_size * 72 / 100 ))
  magick "${PUB_DIR}/logo-circle.png" -resize "${inner}x${inner}" /tmp/inner_fg.png
  magick -size "${fg_size}x${fg_size}" xc:none /tmp/inner_fg.png -gravity center -composite "${dir}/ic_launcher_foreground.png"

  echo "  - Generated mipmap-${name} (launcher: ${size}x${size}, fg: ${fg_size}x${fg_size})"
done

# Update Android launcher background color to match off-white paper #FAF9F6
cat << 'EOF' > "${RES_DIR}/values/ic_launcher_background.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FAF9F6</color>
</resources>
EOF

echo "Icon generation complete!"
