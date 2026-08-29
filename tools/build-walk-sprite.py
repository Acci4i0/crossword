#!/usr/bin/env python3
"""Genera assets/walk-sprite.png dal GIF sorgente della camminata.

One-off, si lancia a mano; NON fa parte del deploy (il sito resta statico,
quello che viene committato e' il solo PNG prodotto).

    python3 tools/build-walk-sprite.py

Sorgente (fuori dal repo, fornito dall'utente):
    ~/Desktop/al./FD8A1682-687E-44AF-9F7D-913E8259A029.GIF

Il GIF e' 600x600, 7 frame a 120ms (loop da 0.84s): una figura BIANCA su fondo
BLU pieno. I 255 colori dichiarati sono quasi tutti dithering del fondo -
l'istogramma di luminanza e' nettamente bimodale (81% dei pixel fra 80 e 95,
12% sopra 224, quasi niente in mezzo). Qui viene ricostruito a due toni puliti,
sostituendo il blu originale (~#1564CF) con l'azzurro del profilo.

Il risultato e' OPACO: il riquadro azzurro fa parte del disegno, non e' uno
sfondo da rendere trasparente. Niente canale alpha = file piu' piccolo.
"""

import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.expanduser("~/Desktop/al./FD8A1682-687E-44AF-9F7D-913E8259A029.GIF")
DST = os.path.join(HERE, os.pardir, "assets", "walk-sprite.png")

INK = (73, 164, 246)        # #49A4F6, l'azzurro del profilo: prende il posto del blu
PAPER = (255, 255, 255)     # la figura

# Estremi di luminanza misurati sul sorgente: fondo ~88.6, figura ~242.5.
# Fra i due si interpola, cosi' i bordi antialiasati restano morbidi.
LUM_INK, LUM_PAPER = 88.6, 242.5
LEVELS = 12                 # gradini di antialiasing: oltre non si distingue

CELL = 88                   # 2x della resa (44px), per gli schermi densi


def luminance(px):
    return 0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2]


def recolor(frame):
    """Due toni puliti: mappa la luminanza su una rampa INK -> PAPER."""
    out = Image.new("RGB", frame.size)
    src, dst = frame.load(), out.load()
    span = LUM_PAPER - LUM_INK
    step = 1.0 / (LEVELS - 1)
    for y in range(frame.size[1]):
        for x in range(frame.size[0]):
            t = (luminance(src[x, y]) - LUM_INK) / span
            t = 0.0 if t < 0 else 1.0 if t > 1 else t
            t = round(t / step) * step
            dst[x, y] = tuple(round(INK[i] + t * (PAPER[i] - INK[i])) for i in range(3))
    return out


def main():
    gif = Image.open(SRC)
    frames = [gif.seek(i) or gif.convert("RGB").copy() for i in range(gif.n_frames)]
    durations = {gif.seek(i) or gif.info.get("duration") for i in range(gif.n_frames)}

    sheet = Image.new("RGB", (CELL * len(frames), CELL))
    for n, frame in enumerate(frames):
        sheet.paste(recolor(frame).resize((CELL, CELL), Image.LANCZOS), (n * CELL, 0))

    sheet.quantize(colors=LEVELS + 4, method=Image.FASTOCTREE).save(DST, optimize=True)

    print("frame:      %d" % len(frames))
    print("durata:     %d ms l'uno -> ciclo da %.2f s"
          % (max(durations), len(frames) * max(durations) / 1000))
    print("cella:      %dx%d  |  foglio: %dx%d" % (CELL, CELL, sheet.width, sheet.height))
    print("scritto:    %s (%.1f KB)"
          % (os.path.relpath(DST, os.path.join(HERE, os.pardir)),
             os.path.getsize(DST) / 1024))
    print()
    print("per style.css:")
    print("  --walk-frames: %d" % len(frames))
    print("  animation-duration: %.2fs   steps(%d)" % (len(frames) * max(durations) / 1000, len(frames)))


if __name__ == "__main__":
    main()
