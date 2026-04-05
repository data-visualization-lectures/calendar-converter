// 多言語対応（日本語・英語）

const translations = {
  ja: {
    'title': '和暦⇔西暦 変換ツール',
    'subtitle': '昭和・平成・令和に対応',
    'heading.fileBatch': 'ファイル一括変換',
    'dropzone.text': 'CSVファイルをここにドロップ<br>またはクリックして選択',
    'label.direction': '変換方向',
    'label.format': '和暦フォーマット',
    'option.wareToSei': '和暦 → 西暦',
    'option.seiToWare': '西暦 → 和暦',
    'option.alpha': 'アルファベット（R6.3.22）',
    'option.kanji': '漢字（令和6年3月22日）',
    'btn.convert': '変換してダウンロード',
    'preview.before': '変換前',
    'preview.after': '変換後',
    'help.summary': '対応フォーマット一覧',
    'help.th.era': '元号',
    'help.th.abbrev': '略称',
    'help.th.period': '期間',
    'help.meiji': '明治',
    'help.taisho': '大正',
    'help.showa': '昭和',
    'help.heisei': '平成',
    'help.reiwa': '令和',
    'help.footnote': '区切り文字: ドット(.) ハイフン(-) スラッシュ(/) 年月日 に対応<br>「元年」表記にも対応（例: 令和元年5月1日）',
    'error.insufficientData': 'データが不足しています。',
    'status.fileInfo': '{name}（{count}行）',
    'status.dateDetected': '日付列を検出: {columns}（{type}）',
    'status.noDateColumn': '日付列が検出されませんでした。',
    'status.downloadDone': 'ダウンロード完了！',
    'dateType.wareki': '和暦',
    'dateType.seireki': '西暦',
  },
  en: {
    'title': 'Japanese Era ⇔ Western Calendar Converter',
    'subtitle': 'Supports Showa, Heisei, and Reiwa eras',
    'heading.fileBatch': 'Batch File Conversion',
    'dropzone.text': 'Drop a CSV file here<br>or click to select',
    'label.direction': 'Conversion Direction',
    'label.format': 'Japanese Era Format',
    'option.wareToSei': 'Japanese Era → Western',
    'option.seiToWare': 'Western → Japanese Era',
    'option.alpha': 'Alphabet (R6.3.22)',
    'option.kanji': 'Kanji (令和6年3月22日)',
    'btn.convert': 'Convert & Download',
    'preview.before': 'Before',
    'preview.after': 'After',
    'help.summary': 'Supported Formats',
    'help.th.era': 'Era',
    'help.th.abbrev': 'Abbreviation',
    'help.th.period': 'Period',
    'help.meiji': 'Meiji',
    'help.taisho': 'Taisho',
    'help.showa': 'Showa',
    'help.heisei': 'Heisei',
    'help.reiwa': 'Reiwa',
    'help.footnote': 'Supported delimiters: dot (.) hyphen (-) slash (/) and 年月日<br>First-year notation (元年) is also supported (e.g., R1.5.1)',
    'error.insufficientData': 'Insufficient data.',
    'status.fileInfo': '{name} ({count} rows)',
    'status.dateDetected': 'Date columns detected: {columns} ({type})',
    'status.noDateColumn': 'No date columns detected.',
    'status.downloadDone': 'Download complete!',
    'dateType.wareki': 'Japanese Era',
    'dateType.seireki': 'Western',
  },
};

const currentLang = navigator.language.startsWith('ja') ? 'ja' : 'en';

function t(key, params) {
  let str = translations[currentLang][key] || translations['ja'][key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
    }
  }
  return str;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('title');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key);
  });
}

applyI18n();
