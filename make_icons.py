"""Generate PWA icons for the Flashcards app."""
from PIL import Image, ImageDraw
import os

OUT = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(OUT, exist_ok=True)

BG = (79, 70, 229)      # indigo
BG2 = (99, 102, 241)
CARD = (255, 255, 255)
ACCENT = (241, 245, 249)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_icon(size, maskable=False):
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)

    # Vertical gradient background
    for y in range(size):
        draw.line([(0, y), (size, y)], fill=lerp(BG, BG2, y / size))

    # For maskable, keep content within safe area (~80%)
    inset = size * (0.20 if maskable else 0.14)
    x0, y0 = inset, inset
    x1, y1 = size - inset, size - inset
    r = size * 0.06

    # Back card (offset, translucent-looking)
    off = size * 0.045
    back = ACCENT
    draw.rounded_rectangle(
        [x0 + off, y0 + off, x1 + off, y1 + off], radius=r,
        fill=lerp(BG2, CARD, 0.55))

    # Front card
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=CARD)

    # "Q" and "A" text lines to suggest a flashcard
    line_h = size * 0.05
    lx0 = x0 + size * 0.12
    lx1 = x1 - size * 0.12
    ys = y0 + (y1 - y0) * 0.30
    for i, w in enumerate([1.0, 0.75, 0.55]):
        yy = ys + i * line_h * 2.2
        draw.rounded_rectangle(
            [lx0, yy, lx0 + (lx1 - lx0) * w, yy + line_h],
            radius=line_h / 2,
            fill=lerp(CARD, BG, 0.18 if i == 0 else 0.10))

    # Divider + accent dot
    dv = y0 + (y1 - y0) * 0.62
    draw.line([(lx0, dv), (lx1, dv)], fill=lerp(CARD, BG, 0.12), width=max(2, size // 128))
    dot_r = size * 0.055
    cx, cy = x1 - size * 0.16, y1 - size * 0.16
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=BG)

    return img


for size in (180, 192, 512):
    make_icon(size).save(os.path.join(OUT, f"icon-{size}.png"))

make_icon(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))

print("Icons written to", OUT)
print(os.listdir(OUT))
