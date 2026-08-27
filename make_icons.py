"""Generate the PWA / home-screen icons for Flashcard Flipper.

The app icon is the "Flipping Cards" logo (a flashcard with amber flip
swirls). The artwork is defined as SVG in icons/src/*.html so it stays crisp
and editable; this script renders those to PNG with a headless Chromium
(Edge or Chrome) and then downsizes with Pillow.

    python make_icons.py

Outputs (into icons/): icon-180.png, icon-192.png, icon-512.png,
icon-maskable-512.png. The in-app turtle mascot lives separately as an inline
SVG sprite in index.html (#flipperMascot) and is not produced here.
"""
import os
import shutil
import subprocess
import tempfile

from PIL import Image

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "icons", "src")
OUT = os.path.join(HERE, "icons")

STANDARD = os.path.join(SRC, "c-icon.html")
MASKABLE = os.path.join(SRC, "c-icon-maskable.html")


def find_browser():
    """Locate a headless-capable Chromium binary (Edge or Chrome)."""
    candidates = [
        shutil.which("msedge"),
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    raise RuntimeError("No Edge/Chrome found to render icon SVGs.")


def render(browser, html_path, png_path, size=512):
    url = "file:///" + os.path.abspath(html_path).replace("\\", "/")
    subprocess.run([
        browser, "--headless", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", f"--window-size={size},{size}",
        f"--screenshot={png_path}", url,
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    os.makedirs(OUT, exist_ok=True)
    browser = find_browser()
    tmp = tempfile.mkdtemp(prefix="fc_icons_")

    std = os.path.join(tmp, "std.png")
    msk = os.path.join(tmp, "msk.png")
    render(browser, STANDARD, std)
    render(browser, MASKABLE, msk)

    base = Image.open(std).convert("RGB")
    base.save(os.path.join(OUT, "icon-512.png"))
    base.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "icon-192.png"))
    base.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, "icon-180.png"))
    Image.open(msk).convert("RGB").save(os.path.join(OUT, "icon-maskable-512.png"))

    shutil.rmtree(tmp, ignore_errors=True)
    print("Icons written to", OUT)
    print(sorted(os.listdir(OUT)))


if __name__ == "__main__":
    main()
