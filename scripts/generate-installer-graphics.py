"""
AQ COMPANIES - High-Definition NSIS Installer Graphics Generator
Generates 2X High-DPI uncompressed 24-bit BMP bitmaps for NSIS installer & uninstaller.
Modern Windows 11 Fluent aesthetic with luxury typography, ambient lighting, and crisp emblems.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def generate_all():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    build_dir = os.path.join(root_dir, 'build')
    os.makedirs(build_dir, exist_ok=True)
    
    # 2X Dimensions for High-DPI display crispness:
    # Standard 164x314 -> 2X 328x628
    width, height = 328, 628
    
    logo_path = os.path.join(root_dir, 'public', 'images', 'aq-companies-logo.png')
    bg_path = os.path.join(root_dir, 'public', 'images', 'photo_ocean_containership.jpg')

    # ----------------------------------------------------
    # 1. INSTALLER & UNINSTALLER SIDEBAR (328 x 628)
    # ----------------------------------------------------
    for is_uninstaller in [False, True]:
        out_name = os.path.join(build_dir, 'uninstallerSidebar.bmp' if is_uninstaller else 'installerSidebar.bmp')
        
        if os.path.exists(bg_path):
            bg = Image.open(bg_path).convert('RGB')
            ratio = max(width / bg.width, height / bg.height)
            new_w, new_h = int(bg.width * ratio), int(bg.height * ratio)
            bg = bg.resize((new_w, new_h), Image.Resampling.LANCZOS)
            left = (new_w - width) // 2
            top = (new_h - height) // 2
            base = bg.crop((left, top, left + width, top + height)).convert('RGBA')
        else:
            base = Image.new('RGBA', (width, height), (11, 19, 43, 255))
            
        overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        d_over = ImageDraw.Draw(overlay)
        for y in range(height):
            ratio = y / height
            if not is_uninstaller:
                # Deep luxury Sapphire to Midnight Navy gradient
                r = int(11 * (1 - ratio) + 15 * ratio)
                g = int(25 * (1 - ratio) + 23 * ratio)
                b = int(55 * (1 - ratio) + 42 * ratio)
            else:
                # Deep Crimson/Ruby to Charcoal gradient
                r = int(45 * (1 - ratio) + 20 * ratio)
                g = int(15 * (1 - ratio) + 10 * ratio)
                b = int(25 * (1 - ratio) + 18 * ratio)
            a = int(228 + 27 * (ratio ** 0.8))
            d_over.line([(0, y), (width, y)], fill=(r, g, b, a))
            
        sidebar = Image.alpha_composite(base, overlay)
        draw = ImageDraw.Draw(sidebar)
        
        font_badge = ImageFont.truetype('segoeuib.ttf', 13)
        font_brand_title = ImageFont.truetype('segoeuib.ttf', 24)
        font_brand_sub = ImageFont.truetype('segoeuib.ttf', 13)
        font_pill_title = ImageFont.truetype('segoeuib.ttf', 13)
        font_pill_desc = ImageFont.truetype('segoeui.ttf', 11)
        font_footer = ImageFont.truetype('segoeuib.ttf', 12)

        # Top Category Pill
        badge_text = 'ENTERPRISE LOGISTICS' if not is_uninstaller else 'SYSTEM UNINSTALLER'
        bbox_b = font_badge.getbbox(badge_text)
        bw = bbox_b[2] - bbox_b[0]
        bx0 = (width - bw) // 2 - 14
        bx1 = bx0 + bw + 28
        border_col = (59, 130, 246, 180) if not is_uninstaller else (239, 68, 68, 180)
        bg_col = (30, 58, 138, 210) if not is_uninstaller else (153, 27, 27, 210)
        draw.rounded_rectangle([bx0, 24, bx1, 52], radius=14, fill=bg_col, outline=border_col, width=2)
        draw.text(((width - bw) // 2, 29), badge_text, fill=(240, 249, 255, 255), font=font_badge)

        # Center Emblem with Ambient Glow
        if os.path.exists(logo_path):
            logo_img = Image.open(logo_path).convert('RGBA')
            mark = logo_img.crop((120, 130, 904, 760))
            target_w = 172
            aspect = mark.height / mark.width
            target_h = int(target_w * aspect)
            mark = mark.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            glow_size = target_w + 36
            glow = Image.new('RGBA', (glow_size, target_h + 36), (0, 0, 0, 0))
            g_draw = ImageDraw.Draw(glow)
            glow_col = (37, 99, 235, 90) if not is_uninstaller else (220, 38, 38, 80)
            g_draw.ellipse([8, 8, glow_size - 8, target_h + 28], fill=glow_col)
            glow = glow.filter(ImageFilter.GaussianBlur(12))
            
            lx = (width - target_w) // 2
            ly = 72
            sidebar.paste(glow, (lx - 18, ly - 18), glow)
            sidebar.paste(mark, (lx, ly), mark)

        # Brand Title
        brand_text = 'AQ COMPANIES'
        bbox_t = font_brand_title.getbbox(brand_text)
        tw = bbox_t[2] - bbox_t[0]
        draw.text(((width - tw) // 2 + 1, 239), brand_text, fill=(0, 0, 0, 190), font=font_brand_title)
        draw.text(((width - tw) // 2, 238), brand_text, fill=(255, 255, 255, 255), font=font_brand_title)

        # Subtitle
        sub_text = 'Logistics & Financial Platform' if not is_uninstaller else 'Safe Binary Uninstaller'
        bbox_s = font_brand_sub.getbbox(sub_text)
        sw = bbox_s[2] - bbox_s[0]
        sub_color = (186, 230, 253, 245) if not is_uninstaller else (254, 202, 202, 245)
        draw.text(((width - sw) // 2, 270), sub_text, fill=sub_color, font=font_brand_sub)

        # Glowing Accent Line
        line_y = 296
        for dx in range(180):
            intensity = 1.0 - abs(dx - 90) / 90.0
            alpha = int(240 * (intensity ** 1.5))
            l_col = (56, 189, 248, alpha) if not is_uninstaller else (248, 113, 113, alpha)
            draw.line([(74 + dx, line_y), (74 + dx, line_y + 1)], fill=l_col)

        # Feature Highlights Card
        card_x0, card_x1 = 18, width - 18
        card_y0, card_y1 = 312, 540
        draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=14, fill=(15, 23, 42, 200), outline=(51, 65, 85, 180), width=1)

        if not is_uninstaller:
            features = [
                ('Multi-Modal BOL Engine', 'Road, Sea & Rail Transport Dispatch'),
                ('Dual-Currency Ledgers', 'AFN & USD Invariance Audits'),
                ('Biometric Security Vault', 'Windows Hello Hardware Authentication'),
                ('Real-Time Cloud Sync', 'Multi-PC Peer Database Replication'),
            ]
        else:
            features = [
                ('Clean Binary Flush', 'Removes installed application files'),
                ('Data Safe Guarantee', 'User database & ledgers preserved'),
                ('Service Shutdown', 'Terminates background microservices'),
                ('Shortcut Cleanup', 'Removes Start & Desktop icons'),
            ]

        item_y = card_y0 + 15
        for title, desc in features:
            dot_col = (56, 189, 248, 255) if not is_uninstaller else (239, 68, 68, 255)
            dot_out = (147, 197, 253, 200) if not is_uninstaller else (252, 165, 165, 200)
            draw.ellipse([32, item_y + 4, 42, item_y + 14], fill=dot_col, outline=dot_out, width=1)
            draw.text((50, item_y), title, fill=(248, 250, 252, 255), font=font_pill_title)
            draw.text((50, item_y + 19), desc, fill=(148, 163, 184, 235), font=font_pill_desc)
            item_y += 52

        # Footer Version Badge
        foot_text = 'v5.4 PRO • ENTERPRISE SUITE'
        bbox_f = font_footer.getbbox(foot_text)
        fw = bbox_f[2] - bbox_f[0]
        fx0 = (width - fw) // 2 - 16
        fx1 = fx0 + fw + 32
        draw.rounded_rectangle([fx0, 560, fx1, 592], radius=16, fill=(15, 23, 42, 210), outline=(59, 130, 246, 140), width=1)
        draw.text(((width - fw) // 2, 568), foot_text, fill=(224, 242, 254, 255), font=font_footer)

        base_col = (37, 99, 235, 255) if not is_uninstaller else (220, 38, 38, 255)
        draw.rectangle([0, height - 6, width, height], fill=base_col)

        final_bmp = sidebar.convert('RGB')
        final_bmp.save(out_name, 'BMP')
        print(f'Generated {out_name}: {final_bmp.size}')

    # ----------------------------------------------------
    # 2. INSTALLER HEADER (300 x 114) - 2X Ultra-Sharp Modern
    # ----------------------------------------------------
    hw, hh = 300, 114
    header = Image.new('RGBA', (hw, hh), (255, 255, 255, 255))
    hdraw = ImageDraw.Draw(header)
    
    font_h_badge = ImageFont.truetype('segoeuib.ttf', 11)
    font_h_title = ImageFont.truetype('segoeuib.ttf', 18)
    font_h_tag = ImageFont.truetype('segoeui.ttf', 11)
    
    # Left Content Area (within the 300x114 bitmap)
    # Badge Pill: "LOGISTICS CORE"
    b_text = 'LOGISTICS CORE'
    bb = font_h_badge.getbbox(b_text)
    bw = bb[2] - bb[0]
    bx0 = 18
    by0 = 16
    hdraw.rounded_rectangle([bx0, by0, bx0 + bw + 18, by0 + 22], radius=11, fill=(239, 246, 255, 255), outline=(191, 219, 254, 255), width=1)
    hdraw.text((bx0 + 9, by0 + 3), b_text, fill=(29, 78, 216, 255), font=font_h_badge)
    
    # Title: "AQ COMPANIES"
    hdraw.text((18, 44), 'AQ COMPANIES', fill=(15, 23, 42, 255), font=font_h_title)
    
    # Subtitle: "Official Setup Wizard"
    hdraw.text((18, 72), 'Enterprise Platform • v5.4', fill=(100, 116, 139, 255), font=font_h_tag)
    
    # Elegant vertical separator
    for y in range(16, 98):
        alpha = int(200 * (1 - abs((y - 57) / 41)))
        hdraw.point((190, y), fill=(226, 232, 240, alpha))
        
    # High-Definition Emblem on Right Side
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path).convert('RGBA')
        logo_size = 92
        logo = logo_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Soft ambient glow
        shadow = Image.new('RGBA', (logo_size + 20, logo_size + 20), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.ellipse([6, 6, logo_size + 14, logo_size + 14], fill=(37, 99, 235, 35))
        shadow = shadow.filter(ImageFilter.GaussianBlur(6))
        
        lx = 200
        ly = (hh - logo_size) // 2
        header.paste(shadow, (lx - 10, ly - 10), shadow)
        header.paste(logo, (lx, ly), logo)
        
    final_header = header.convert('RGB')
    out_header = os.path.join(build_dir, 'installerHeader.bmp')
    final_header.save(out_header, 'BMP')
    print(f'Generated {out_header}: {final_header.size}')

if __name__ == '__main__':
    generate_all()
