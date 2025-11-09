#!/usr/bin/env bash
set -euo pipefail

# heic2jpg.sh — Convert HEIC/HEIF images to JPEG
# Default target directory is ./photo. Override with -d DIR.
# Tries tools in this order: heif-convert, heif-dec, magick, convert, ffmpeg, sips, vips.
# If decoding fails, optionally falls back to extracting embedded PreviewImage via exiftool.

usage() {
  cat <<'USAGE'
Usage: heic2jpg.sh [-d DIR] [-q QUALITY] [-f] [-r] [--prefer exiftool]

Options:
  -d DIR      Directory to scan (default: ./photo)
  -q QUALITY  JPEG quality 1-100 (default: 92)
  -f          Overwrite existing .jpg files
  -r          Recurse into subdirectories
  --prefer exiftool  Prefer exiftool preview extraction if present

Notes:
  - Preserves orientation with tools that support it (ImageMagick, magick).
  - Attempts multiple converters; first available is used per file.
  - Timestamps are preserved on the output file.
USAGE
}

dir="./photo"
quality=92
overwrite=false
recurse=false
prefer_exiftool=false

PARSED=()
while (("$#")); do
  case "$1" in
    -d) dir="$2"; PARSED+=("$1" "$2"); shift 2 ;;
    -q) quality="$2"; PARSED+=("$1" "$2"); shift 2 ;;
    -f) overwrite=true; PARSED+=("$1"); shift ;;
    -r) recurse=true; PARSED+=("$1"); shift ;;
    --prefer)
      if [ "${2:-}" = "exiftool" ]; then prefer_exiftool=true; PARSED+=("$1" "$2"); shift 2; else echo "Unknown --prefer option: ${2:-}" >&2; exit 2; fi ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) echo "Unknown option: $1" >&2; usage; exit 2 ;;
    *) break ;;
  esac
done

if ! [ -d "$dir" ]; then
  echo "Directory not found: $dir" >&2
  exit 1
fi

# Determine available converter (checked per-file too, but probe now for messaging)
has() { command -v "$1" >/dev/null 2>&1; }

choose_tool() {
  if has heif-convert; then echo heif-convert; return; fi
  if has heif-dec; then echo heif-dec; return; fi
  if has magick; then echo magick; return; fi
  if has convert; then echo convert; return; fi
  if has ffmpeg; then echo ffmpeg; return; fi
  if has sips; then echo sips; return; fi
  if has vips; then echo vips; return; fi
  echo none
}

tool_global=$(choose_tool)
if [ "$tool_global" = "none" ]; then
  echo "No supported converter found: install one of heif-convert, ImageMagick (magick/convert), ffmpeg, sips, or vips." >&2
  exit 1
fi

echo "Using converter(s): will attempt heif-convert, heif-dec, magick, convert, ffmpeg, sips, vips (first available per file)."

# Build find command
maxdepth=(-maxdepth 1)
if $recurse; then maxdepth=(); fi

mapfile -d '' files < <(find "$dir" "${maxdepth[@]}" -type f \
  \( -iname '*.heic' -o -iname '*.heif' \) -print0 | sort -z)

if [ "${#files[@]}" -eq 0 ]; then
  echo "No HEIC/HEIF files found in $dir" >&2
  exit 0
fi

converted=0
skipped=0
failed=0

convert_one() {
  local in="$1" out="$2" q="$3"

  # Try tools in priority order for this file
  if has heif-convert; then
    # heif-convert quality: 1..100 (higher is better)
    heif-convert -q "$q" "$in" "$out" >/dev/null 2>&1 && return 0
  fi
  if has heif-dec; then
    # heif-dec selects format by output extension; use --quiet to suppress progress
    heif-dec --quiet -q "$q" -o "$out" "$in" >/dev/null 2>&1 && return 0
  fi
  if has magick; then
    magick "$in" -auto-orient -quality "$q" "$out" >/dev/null 2>&1 && return 0
  fi
  if has convert; then
    convert "$in" -auto-orient -quality "$q" "$out" >/dev/null 2>&1 && return 0
  fi
  if has ffmpeg; then
    # -q:v 2 is high quality; map roughly to JPEG quality
    ffmpeg -hide_banner -loglevel error -y -i "$in" -q:v 2 "$out" >/dev/null 2>&1 && return 0
  fi
  if has sips; then
    sips -s format jpeg "$in" --out "$out" >/dev/null 2>&1 && return 0
  fi
  if has vips; then
    vips copy "$in" "$out[Q=$q]" >/dev/null 2>&1 && return 0
  fi
  return 1
}

# Fallback: extract embedded preview with exiftool when decoding fails
extract_preview() {
  local in="$1" out="$2"
  if has exiftool; then
    # Write to temp then move if non-empty
    local tmp
    tmp="${out}.part"
    if exiftool -b -PreviewImage "$in" > "$tmp" 2>/dev/null && [ -s "$tmp" ]; then
      mv -f "$tmp" "$out"
      return 0
    fi
    rm -f -- "$tmp" 2>/dev/null || true
  fi
  return 1
}

for inpath in "${files[@]}"; do
  # Bash mapfile trims the trailing NUL but keeps exact path; ensure not empty
  [ -n "$inpath" ] || continue
  # Derive output .jpg alongside input
  outpath="${inpath%.*}.jpg"

  if [ -e "$outpath" ] && ! $overwrite; then
    echo "Skip (exists): $outpath"
    skipped=$((skipped+1))
    continue
  fi

  # If exiftool is preferred, try extracting preview first
  if $prefer_exiftool && extract_preview "$inpath" "$outpath"; then
    touch -r "$inpath" "$outpath" || true
    echo "Preview extracted: $inpath -> $outpath"
    converted=$((converted+1))
    continue
  fi

  if convert_one "$inpath" "$outpath" "$quality"; then
    # Preserve timestamp from source
    touch -r "$inpath" "$outpath" || true
    echo "Converted: $inpath -> $outpath"
    converted=$((converted+1))
  else
    # As a last resort, try to extract preview even if not preferred
    if extract_preview "$inpath" "$outpath"; then
      touch -r "$inpath" "$outpath" || true
      echo "Preview extracted: $inpath -> $outpath"
      converted=$((converted+1))
    else
      echo "Failed: $inpath" >&2
      # Clean up partial file if any
      [ -f "$outpath" ] && rm -f -- "$outpath" || true
      failed=$((failed+1))
    fi
  fi
done

echo
echo "Done. Converted: $converted, Skipped: $skipped, Failed: $failed"
