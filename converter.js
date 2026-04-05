// 元号テーブル（新しい順）
const ERAS = [
  { kanji: '令和', alpha: 'R', startYear: 2019, start: [2019, 5, 1],  end: null },
  { kanji: '平成', alpha: 'H', startYear: 1989, start: [1989, 1, 8],  end: [2019, 4, 30] },
  { kanji: '昭和', alpha: 'S', startYear: 1926, start: [1926, 12, 25], end: [1989, 1, 7] },
];

// 日付比較用ユーティリティ（[y,m,d]配列同士）
function compareDates(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

// 和暦文字列をパース
// 対応形式: S49.9.24, H1-1-8, R1/5/1, 昭和49年9月24日, 令和元年5月1日 等
function parseWareki(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();

  const re = /^(S|H|R|昭和|平成|令和)\s*(元|\d{1,2})\s*[.\-\/年]\s*(\d{1,2})\s*[.\-\/月]\s*(\d{1,2})\s*日?\s*$/i;
  const m = str.match(re);
  if (!m) return null;

  let eraInput = m[1].toUpperCase();
  // 漢字→アルファベット正規化
  const kanjiMap = { '昭和': 'S', '平成': 'H', '令和': 'R' };
  const eraAlpha = kanjiMap[m[1]] || eraInput;

  const era = ERAS.find(e => e.alpha === eraAlpha);
  if (!era) return null;

  const year = m[2] === '元' ? 1 : parseInt(m[2], 10);
  const month = parseInt(m[3], 10);
  const day = parseInt(m[4], 10);

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { era, year, month, day, original: str };
}

// 西暦文字列をパース
// 対応形式: 2019-05-01, 2019/5/1, 2019.5.1 等
function parseSeireki(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();

  const re = /^(\d{4})\s*[.\-\/年]\s*(\d{1,2})\s*[.\-\/月]\s*(\d{1,2})\s*日?\s*$/;
  const m = str.match(re);
  if (!m) return null;

  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

// 和暦→西暦 [year, month, day] を返す
function warekiToSeireki(parsed) {
  if (!parsed) return null;
  const westernYear = parsed.era.startYear + (parsed.year - 1);
  return [westernYear, parsed.month, parsed.day];
}

// 和暦が元号の有効期間内かチェック
function isValidWareki(parsed) {
  if (!parsed) return false;
  const seireki = warekiToSeireki(parsed);
  if (!seireki) return false;

  const era = parsed.era;
  if (compareDates(seireki, era.start) < 0) return false;
  if (era.end && compareDates(seireki, era.end) > 0) return false;
  return true;
}

// 西暦[y,m,d]→和暦オブジェクト
function seirekiToWarekiObj(ymd) {
  for (const era of ERAS) {
    if (compareDates(ymd, era.start) >= 0) {
      if (!era.end || compareDates(ymd, era.end) <= 0) {
        return {
          era,
          year: ymd[0] - era.startYear + 1,
          month: ymd[1],
          day: ymd[2],
        };
      }
    }
  }
  return null;
}

// 西暦[y,m,d]→和暦文字列
// format: 'alpha' → "R1.5.1", 'kanji' → "令和1年5月1日"
function seirekiToWareki(ymd, format = 'alpha') {
  const obj = seirekiToWarekiObj(ymd);
  if (!obj) return null;

  if (format === 'kanji') {
    return `${obj.era.kanji}${obj.year}年${obj.month}月${obj.day}日`;
  }
  return `${obj.era.alpha}${obj.year}.${obj.month}.${obj.day}`;
}

// 西暦[y,m,d]→文字列
function seirekiToString(ymd, delimiter = '/') {
  if (!ymd) return '';
  const y = ymd[0];
  const m = String(ymd[1]).padStart(2, '0');
  const d = String(ymd[2]).padStart(2, '0');
  return `${y}${delimiter}${m}${delimiter}${d}`;
}
