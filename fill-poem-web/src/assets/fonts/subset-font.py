#!/usr/bin/env python3
# /// script
# requires-python = ">=3.14"
# dependencies = ["fonttools[woff]"]
# ///
"""Subset a TTF font down to the characters actually used by the H5 copy.

Used for src/assets/fonts (see src/assets/fonts/README.md). Given a source
.ttf and a chars.txt listing the required characters, produces a .woff2
containing only those glyphs.

chars.txt format:
  - UTF-8 text, any number of lines, grouped however is convenient to edit.
  - Lines starting with "#" are comments and are ignored entirely (not
    subsetted), since pyftsubset itself has no comment syntax.
  - A literal space (U+0020) is always added to the subset regardless of
    chars.txt content, because editors tend to silently strip trailing
    whitespace and losing the space glyph would break layout.

Usage (run from repo root or this directory):
  uv run src/assets/fonts/subset-font.py <font.ttf> <chars.txt> <output.woff2>

Example:
  uv run src/assets/fonts/subset-font.py \
    src/assets/fonts/FZY3K.ttf \
    src/assets/fonts/chars.txt \
    src/assets/fonts/FZY3K.subset.woff2
"""

import argparse
from pathlib import Path

from fontTools import subset as ft_subset


def collect_text(chars_file: Path) -> str:
    """Read chars.txt, drop comment lines, always include a literal space."""
    lines = chars_file.read_text(encoding="utf-8").splitlines()
    content_lines = [line for line in lines if not line.startswith("#")]
    return "\n".join(content_lines) + " "


def subset_font(font_path: Path, chars_path: Path, output_path: Path) -> None:
    text = collect_text(chars_path)

    options = ft_subset.Options()
    options.flavor = "woff2"
    options.layout_features = []
    options.hinting = False
    options.desubroutinize = True

    font = ft_subset.load_font(str(font_path), options)
    subsetter = ft_subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    ft_subset.save_font(font, str(output_path), options)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("font", type=Path, help="source .ttf font file")
    parser.add_argument("chars", type=Path, help="chars.txt listing required characters (# lines are comments)")
    parser.add_argument("output", type=Path, help="output .woff2 path")
    args = parser.parse_args()

    subset_font(args.font, args.chars, args.output)

    size = args.output.stat().st_size
    print(f"Wrote {args.output} ({size:,} bytes)")


if __name__ == "__main__":
    main()
