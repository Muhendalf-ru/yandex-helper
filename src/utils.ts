// utils.ts - точная копия логики из Python utils.py

export interface PriceData {
  [key: string]: [string, string];
}

export function normalizeComment(comment: string): string {
  // Точная копия Python функции normalize_comment + дополнительно убираем точки после "сек."
  let result = comment;

  // Убираем точки после сокращений: ч., мин., км., кг., м., млн., млрд., трлн., сек.
  // Note: keep trailing dot for 'сек.' because seconds are often sentence-ending inside parentheses
  result = result.replace(/(ч|мин|км|кг|м|млн|млрд|трлн)\./g, '$1');

  return result.trim();
}

export function parsePriceLines(text: string): PriceData {
  // Точная копия Python функции parse_price_lines
  const lines = text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line);
  const result: PriceData = {};
  let i = 0;

  while (i < lines.length) {
    const key = lines[i];

    // Проверяем следующую строку на наличие цены
    if (i + 1 < lines.length) {
      const valLine = lines[i + 1];
      // Обрабатываем как одинарные, так и двойные скобки
      const match = valLine.match(/^(\d+\.?\d*\s*₽)(?:\s*\(\((.+)\)\)|\s*\((.+)\))?$/);

      if (match) {
        const val = match[1].trim();
        // Берем комментарий из двойных скобок или одинарных
        const comment = match[2] ? match[2].trim() : match[3] ? match[3].trim() : '';
        result[key] = [val, normalizeComment(comment)];
        i += 2;
        continue;
      }
    }

    // Проверяем текущую строку на наличие цены в конце
    const match = key.match(/^(.+?)\s+(\d+\.?\d*\s*₽)(?:\s*\(\((.+)\)\)|\s*\((.+)\))?$/);
    if (match) {
      const field = match[1].trim();
      const val = match[2].trim();
      // Берем комментарий из двойных скобок или одинарных
      const comment = match[3] ? match[3].trim() : match[4] ? match[4].trim() : '';
      result[field] = [val, normalizeComment(comment)];
    }

    i += 1;
  }

  return result;
}

export function formatLine(name: string, val: string, comment: string): string {
  // Точная копия Python функции format_line
  return comment ? `— ${name}: ${val} (${comment})` : `— ${name}: ${val}`;
}

export function sumRubleDigits(resultText: string): string {
  // Точная копия Python функции sum_ruble_digits
  const matches = resultText.match(/— .*?: (\d[\d\s\.]*)\s*₽/g);
  if (!matches) return '0 ₽';

  let total = 0;
  for (const match of matches) {
    const amountMatch = match.match(/— .*?: (\d[\d\s\.]*)\s*₽/);
    if (amountMatch) {
      const amount = amountMatch[1].replace(/\s/g, '').replace(/,/g, '.');
      total += parseFloat(amount);
    }
  }

  // Округление как в Python с ROUND_HALF_UP
  const rounded = Math.round(total);
  return `${rounded} ₽`;
}

export function parseTimeToMinutes(text: string): string {
  const hMatch = text.match(/(\d+)\s*ч/);
  const mMatch = text.match(/(\d+)\s*мин/);
  const sMatch = text.match(/(\d+)\s*сек/);

  // Build a human-friendly time string, including seconds when present.
  if (hMatch && mMatch && sMatch) {
    return `${hMatch[1]} ч ${mMatch[1]} мин ${sMatch[1]} сек.`;
  } else if (hMatch && mMatch) {
    return `${hMatch[1]} ч ${mMatch[1]} мин`;
  } else if (mMatch && sMatch) {
    return `${mMatch[1]} мин ${sMatch[1]} сек.`;
  } else if (mMatch) {
    return `${mMatch[1]} мин`;
  } else if (hMatch) {
    return `${hMatch[1]} ч`;
  } else if (sMatch) {
    return `${sMatch[1]} сек.`;
  } else {
    return text;
  }
}

export function pluralWord(n: number): string {
  if (11 <= n % 100 && n % 100 <= 19) {
    return 'вручений';
  }
  if (n % 10 === 1) {
    return 'вручение';
  }
  if ([2, 3, 4].includes(n % 10)) {
    return 'вручения';
  }
  return 'вручений';
}

export function parsePaymentBlock(text: string): { formattedDate: string; amount: string } {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  if (lines.length < 2) {
    throw new Error('Нужно две строки: дата/сумма');
  }

  const dateStr = lines[0];
  const amount = lines[1];

  // Парсим дату в формате DD.MM.YYYY, HH:MM:SS
  const [datePart, timePart] = dateStr.split(', ');
  const [day, month] = datePart.split('.');
  const [hour, minute] = timePart.split(':');

  const monthNames: { [key: number]: string } = {
    1: 'января',
    2: 'февраля',
    3: 'марта',
    4: 'апреля',
    5: 'мая',
    6: 'июня',
    7: 'июля',
    8: 'августа',
    9: 'сентября',
    10: 'октября',
    11: 'ноября',
    12: 'декабря',
  };

  const formattedDate = `${day} ${monthNames[parseInt(month)]} в ${hour.padStart(
    2,
    '0',
  )}:${minute.padStart(2, '0')}`;

  return { formattedDate, amount };
}
