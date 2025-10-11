# utils.py
import os
import re
import sys
from decimal import Decimal, ROUND_HALF_UP

def resource_path(relative_path):
    """Возвращает корректный путь к файлу даже после сборки в EXE."""
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

def normalize_comment(comment: str) -> str:
    return re.sub(r'\b(ч|мин|км|кг|м|млн|млрд|трлн)\.', r'\1', comment).strip()

def parse_price_lines(text: str) -> dict:
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    result = {}
    i = 0
    while i < len(lines):
        key = lines[i]
        if i + 1 < len(lines):
            val_line = lines[i + 1]
            m = re.match(r"(\d+\.?\d*\s*₽)(?:\s*\((.+)\))?", val_line)
            if m:
                val = m.group(1).strip()
                comment = m.group(2).strip() if m.group(2) else ""
                result[key] = (val, normalize_comment(comment))
                i += 2
                continue
        m = re.match(r"(.+?)\s+(\d+\.?\d*\s*₽)(?:\s*\((.+)\))?", key)
        if m:
            field = m.group(1).strip()
            val = m.group(2).strip()
            comment = m.group(3).strip() if m.lastindex >= 3 and m.group(3) else ""
            result[field] = (val, normalize_comment(comment))
        i += 1
    return result

def format_line(name: str, val: str, comment: str) -> str:
    return f"— {name}: {val} ({comment})" if comment else f"— {name}: {val}"

def sum_ruble_digits(result_text: str) -> str:
    matches = re.findall(r"\u2014 .*?: (\d[\d\s\.]*)\s*₽", result_text)
    total = sum(float(d.replace(" ", "").replace(",", ".")) for d in matches)
    rounded = Decimal(total).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    return f"{rounded} ₽"