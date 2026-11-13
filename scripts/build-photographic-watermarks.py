import os
import io
import base64
from PIL import Image, ImageEnhance, ImageFilter

rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
publicImagesDir = os.path.join(rootDir, 'public', 'images')
watermarkPhotosDir = os.path.join(publicImagesDir, 'watermark-photos')
targetSvgDir = os.path.join(publicImagesDir, 'document-backgrounds')
os.makedirs(watermarkPhotosDir, exist_ok=True)
os.makedirs(targetSvgDir, exist_ok=True)

def fit_portrait(im, tw=900, th=1400, focus='center'):
    w, h = im.size
    tr = tw / th
    cr = w / h
    if cr > tr:
        nw = int(h * tr)
        if focus == 'left':
            box = (0, 0, nw, h)
        elif focus == 'right':
            box = (w - nw, 0, w, h)
        else:
            left = (w - nw) // 2
            box = (left, 0, left + nw, h)
        im = im.crop(box)
    else:
        nh = int(w / tr)
        if focus == 'top':
            box = (0, 0, w, nh)
        elif focus == 'bottom':
            box = (0, h - nh, w, nh)
        else:
            top = (h - nh) // 2
            box = (0, top, w, top + nh)
        im = im.crop(box)
    return im.resize((tw, th), Image.Resampling.LANCZOS)

def create_optimized_photo(src_name, out_name, tw=900, th=1400, focus='center', brightness=1.0, contrast=1.05, custom_fn=None):
    src_p = os.path.join(publicImagesDir, src_name)
    im = Image.open(src_p).convert('RGB')
    im = fit_portrait(im, tw, th, focus)
    if custom_fn:
        im = custom_fn(im)
    if brightness != 1.0:
        im = ImageEnhance.Brightness(im).enhance(brightness)
    if contrast != 1.0:
        im = ImageEnhance.Contrast(im).enhance(contrast)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=3))
    out_p = os.path.join(watermarkPhotosDir, out_name)
    im.save(out_p, format='JPEG', quality=82, optimize=True)
    return out_p

# Styling customizers for distinct maritime & overland atmospheres
def style_lighthouse(im):
    enh = ImageEnhance.Color(im).enhance(0.9)
    overlay = Image.new('RGB', im.size, (15, 23, 42))
    return Image.blend(enh, overlay, 0.22)

def style_channel(im):
    return ImageEnhance.Color(im).enhance(1.15)

def style_deep_blue(im):
    enh = ImageEnhance.Color(im).enhance(1.25)
    overlay = Image.new('RGB', im.size, (2, 44, 95))
    return Image.blend(enh, overlay, 0.18)

def style_sunset(im):
    enh = ImageEnhance.Color(im).enhance(1.22)
    overlay = Image.new('RGB', im.size, (120, 45, 10))
    return Image.blend(enh, overlay, 0.15)

# 12 Definitions (4 Overland, 8 Maritime)
WATERMARKS = [
    {
        'name': 'cargo-convoy',
        'title': 'Cargo Convoy',
        'sec_title': 'CARGO CONVOY · HIGH-DEFINITION LOGISTICS FLEET',
        'src': 'photo_overland_truck_convoy.jpg',
        'focus': 'center',
        'color': '#1e3a8a',
        'accent': '#0284c7',
        'fn': None,
    },
    {
        'name': 'rail-corridor',
        'title': 'Rail Corridor',
        'sec_title': 'RAIL CORRIDOR · INTERMODAL TRANSIT MAINLINE',
        'src': 'photo_intermodal_freight_train.jpg',
        'focus': 'center',
        'color': '#0f172a',
        'accent': '#38bdf8',
        'fn': None,
    },
    {
        'name': 'winding-pass',
        'title': 'Winding Pass',
        'sec_title': 'WINDING PASS · HIGH-ALTITUDE MOUNTAIN ROUTE',
        'src': 'mountain_transit_highway_bg.jpg',
        'focus': 'center',
        'color': '#78350f',
        'accent': '#d97706',
        'fn': None,
    },
    {
        'name': 'horizon-route',
        'title': 'Horizon Route',
        'sec_title': 'HORIZON ROUTE · LONG-HAUL FREIGHT CORRIDOR',
        'src': 'photo_overland_truck_heavy.jpg',
        'focus': 'center',
        'color': '#1e1b4b',
        'accent': '#4338ca',
        'fn': None,
    },
    {
        'name': 'ocean-passage',
        'title': 'Ocean Passage',
        'sec_title': 'OCEAN PASSAGE · INTERNATIONAL CONTAINER SEA LANE',
        'src': 'photo_ocean_containership.jpg',
        'focus': 'center',
        'color': '#0369a1',
        'accent': '#0284c7',
        'fn': None,
    },
    {
        'name': 'harbor-morning',
        'title': 'Harbor Morning',
        'sec_title': 'HARBOR MORNING · QUAYSIDE GANTRY CRANES & DOCK',
        'src': 'photo_harbor_cranes_port.jpg',
        'focus': 'center',
        'color': '#c2410c',
        'accent': '#0284c7',
        'fn': None,
    },
    {
        'name': 'coastal-freight',
        'title': 'Coastal Freight',
        'sec_title': 'COASTAL FREIGHT · COMMERCIAL MARITIME VESSEL',
        'src': 'photo_coastal_cargo_harbor.jpg',
        'focus': 'left',
        'color': '#0e7490',
        'accent': '#0891b2',
        'fn': None,
    },
    {
        'name': 'container-port',
        'title': 'Container Port',
        'sec_title': 'CONTAINER PORT · INTERMODAL LOGISTICS TERMINAL',
        'src': 'container_terminal_sunset.jpg',
        'focus': 'center',
        'color': '#9a3412',
        'accent': '#1e3a8a',
        'fn': None,
    },
    {
        'name': 'lighthouse-bay',
        'title': 'Lighthouse Bay',
        'sec_title': 'LIGHTHOUSE BAY · MARITIME NAVIGATION BEACON',
        'src': 'maritime_port_cargo_ship.jpg',
        'focus': 'center',
        'color': '#1e293b',
        'accent': '#eab308',
        'fn': style_lighthouse,
    },
    {
        'name': 'island-channel',
        'title': 'Island Channel',
        'sec_title': 'ISLAND CHANNEL · MARITIME SHIPPING PASSAGE',
        'src': 'photo_coastal_cargo_harbor.jpg',
        'focus': 'right',
        'color': '#0f766e',
        'accent': '#14b8a6',
        'fn': style_channel,
    },
    {
        'name': 'deep-blue',
        'title': 'Deep Blue',
        'sec_title': 'DEEP BLUE · HIGH-SEAS CARGO ROUTE',
        'src': 'photo_ocean_containership.jpg',
        'focus': 'bottom',
        'color': '#1e3a8a',
        'accent': '#3b82f6',
        'fn': style_deep_blue,
    },
    {
        'name': 'sunset-anchorage',
        'title': 'Sunset Anchorage',
        'sec_title': 'SUNSET ANCHORAGE · CARGO FLEET ANCHORAGE AT DUSK',
        'src': 'container_terminal_sunset.jpg',
        'focus': 'right',
        'color': '#9f1239',
        'accent': '#f59e0b',
        'fn': style_sunset,
    },
]

def generate_svg(item, b64_data):
    color = item['color']
    accent = item['accent']
    title = item['title']
    sec_title = item['sec_title']

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 900 1400" width="100%" height="100%">
  <title>{title} — Sky Ariana Logistics Security Watermark</title>
  <defs>
    <!-- Soft Center Vignette for Document Readability -->
    <radialGradient id="doc-vignette" cx="50%" cy="50%" r="62%">
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="75%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6" />
    </radialGradient>
    <filter id="soft-drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2" />
    </filter>
  </defs>

  <!-- High-Definition Photographic Imagery -->
  <image href="data:image/jpeg;base64,{b64_data}" x="0" y="0" width="900" height="1400" preserveAspectRatio="xMidYMid slice" opacity="0.95" />

  <!-- Calibrated Document Legibility Vignette -->
  <rect width="900" height="1400" fill="url(#doc-vignette)" />

  <!-- Precision Document Security Frame -->
  <g fill="none" stroke="{color}">
    <rect x="22" y="22" width="856" height="1356" rx="6" stroke-width="2.4" opacity="0.85" />
    <rect x="30" y="30" width="840" height="1340" rx="3" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.7" />
    <rect x="40" y="40" width="820" height="1320" stroke-width="0.8" opacity="0.5" />

    <!-- Corner Alignment Crosshairs -->
    <path d="M14,44 L14,14 L44,14" stroke-width="3" opacity="0.9" />
    <path d="M886,44 L886,14 L856,14" stroke-width="3" opacity="0.9" />
    <path d="M14,1356 L14,1386 L44,1386" stroke-width="3" opacity="0.9" />
    <path d="M886,1356 L886,1386 L856,1386" stroke-width="3" opacity="0.9" />

    <!-- Corner Security Rosettes -->
    <g transform="translate(75,75)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.8" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.8" />
      <circle cx="0" cy="0" r="5" fill="{color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(825,75)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.8" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.8" />
      <circle cx="0" cy="0" r="5" fill="{color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(75,1325)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.8" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.8" />
      <circle cx="0" cy="0" r="5" fill="{color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
    <g transform="translate(825,1325)">
      <circle cx="0" cy="0" r="34" stroke-width="1.8" opacity="0.8" />
      <circle cx="0" cy="0" r="28" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.7" />
      <circle cx="0" cy="0" r="16" stroke-width="1.4" opacity="0.8" />
      <circle cx="0" cy="0" r="5" fill="{color}" opacity="0.9" />
      <path d="M-40,0 L40,0 M0,-40 L0,40" stroke-width="1" opacity="0.6" />
      <path d="M-28,-28 L28,28 M-28,28 L28,-28" stroke-width="1" opacity="0.6" />
    </g>
  </g>

  <!-- Top Security Header Ribbon -->
  <g transform="translate(450, 20)" filter="url(#soft-drop)">
    <rect x="-260" y="-12" width="520" height="22" rx="4" fill="#ffffff" fill-opacity="0.92" stroke="{color}" stroke-width="1.2" />
    <text x="0" y="3" font-family="Arial, sans-serif" font-size="7.5" font-weight="bold" letter-spacing="3" text-anchor="middle" fill="{color}" stroke="none">
      ★ SKY ARIANA LOGISTICS · {sec_title} ★
    </text>
  </g>

  <!-- Bottom Verification Footer Ribbon -->
  <g transform="translate(450, 1380)" filter="url(#soft-drop)">
    <rect x="-270" y="-12" width="540" height="22" rx="4" fill="#ffffff" fill-opacity="0.92" stroke="{color}" stroke-width="1.2" />
    <text x="0" y="3" font-family="Arial, sans-serif" font-size="7" font-weight="bold" letter-spacing="2.5" text-anchor="middle" fill="{color}" stroke="none">
      INTERNATIONAL BILL OF LADING · DOCUMENT WATERMARK VERIFIED
    </text>
  </g>
</svg>'''

def main():
    print(f"Building {len(WATERMARKS)} High-Definition Photographic Logistics Watermarks...")
    for item in WATERMARKS:
        photo_filename = f"{item['name']}.jpg"
        jpg_path = create_optimized_photo(
            item['src'],
            photo_filename,
            tw=900,
            th=1400,
            focus=item['focus'],
            custom_fn=item['fn']
        )
        with open(jpg_path, 'rb') as f:
            b64_data = base64.b64encode(f.read()).decode('ascii')
        
        svg_content = generate_svg(item, b64_data)
        out_svg = os.path.join(targetSvgDir, f"{item['name']}.svg")
        with open(out_svg, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        # Check size
        sz_kb = os.path.getsize(out_svg) / 1024
        print(f"[OK] Created {item['name']}.svg ({item['title']}) -- {sz_kb:.1f} KB")

if __name__ == '__main__':
    main()
