// ファイル処理・D&D・CSV解析・ダウンロード

(function () {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const previewSection = document.getElementById('preview-section');
  const previewTable = document.getElementById('preview-table');
  const previewTableConverted = document.getElementById('preview-table-converted');
  const convertBtn = document.getElementById('convert-btn');
  const directionSelect = document.getElementById('direction');
  const formatSelect = document.getElementById('output-format');
  const statusMsg = document.getElementById('status-msg');

  let currentData = null; // { headers: [], rows: [[]], delimiter: ',', fileName: '' }
  let dateColumns = [];   // 検出された日付列のインデックス
  let dateType = '';      // 'wareki' or 'seireki'

  // D&Dイベント
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // クリックでファイル選択
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  async function handleFile(file) {
    statusMsg.textContent = '';
    const text = await readFileWithEncoding(file);
    const delimiter = detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      statusMsg.textContent = t('error.insufficientData');
      return;
    }

    const headers = splitLine(lines[0], delimiter);
    const rows = lines.slice(1).map(l => splitLine(l, delimiter));

    currentData = { headers, rows, delimiter, fileName: file.name };
    detectDateColumns(headers, rows);
    renderPreview();
    fileInfo.textContent = t('status.fileInfo', { name: file.name, count: rows.length });
    previewSection.style.display = 'block';
  }

  // エンコーディング検出付きファイル読み込み
  function readFileWithEncoding(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result;
        // 文字化けチェック（U+FFFDがあればShift_JISとして再読み込み）
        if (text.includes('\uFFFD')) {
          const reader2 = new FileReader();
          reader2.onload = () => {
            const decoder = new TextDecoder('shift_jis');
            resolve(decoder.decode(reader2.result));
          };
          reader2.readAsArrayBuffer(file);
        } else {
          resolve(text);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  // 区切り文字検出
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0];
    const tabs = (firstLine.match(/\t/g) || []).length;
    const commas = (firstLine.match(/,/g) || []).length;
    return tabs > commas ? '\t' : ',';
  }

  function splitLine(line, delimiter) {
    return line.split(delimiter);
  }

  // 日付列の自動検出
  function detectDateColumns(headers, rows) {
    dateColumns = [];
    dateType = '';
    const sampleRows = [0, 1, Math.min(9, rows.length - 1), Math.min(99, rows.length - 1)]
      .filter((v, i, a) => a.indexOf(v) === i && v < rows.length);

    for (let col = 0; col < headers.length; col++) {
      let warekiCount = 0;
      let seirekiCount = 0;
      for (const ri of sampleRows) {
        const val = rows[ri][col];
        if (!val) continue;
        if (parseWareki(val)) warekiCount++;
        if (parseSeireki(val)) seirekiCount++;
      }
      if (warekiCount >= sampleRows.length * 0.5) {
        dateColumns.push(col);
        dateType = 'wareki';
      } else if (seirekiCount >= sampleRows.length * 0.5) {
        dateColumns.push(col);
        dateType = 'seireki';
      }
    }

    // 変換方向のUIを更新
    if (dateType === 'wareki') {
      directionSelect.value = 'wareki-to-seireki';
    } else if (dateType === 'seireki') {
      directionSelect.value = 'seireki-to-wareki';
    }
  }

  // テーブルHTML生成
  function buildTableHtml(headers, rows) {
    let html = '<thead><tr>';
    headers.forEach((h, i) => {
      const cls = dateColumns.includes(i) ? ' class="date-col"' : '';
      html += `<th${cls}>${escapeHtml(h)}</th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach((cell, i) => {
        const cls = dateColumns.includes(i) ? ' class="date-col"' : '';
        html += `<td${cls}>${escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';
    return html;
  }

  // プレビュー行を変換
  function convertRows(rows) {
    const direction = directionSelect.value;
    const format = formatSelect.value;
    return rows.map(row => {
      const newRow = [...row];
      for (const col of dateColumns) {
        const val = row[col];
        if (!val) continue;
        if (direction === 'wareki-to-seireki') {
          const parsed = parseWareki(val);
          if (parsed) {
            const seireki = warekiToSeireki(parsed);
            newRow[col] = seirekiToString(seireki, '/');
          }
        } else {
          const parsed = parseSeireki(val);
          if (parsed) {
            const wareki = seirekiToWareki([parsed.year, parsed.month, parsed.day], format);
            if (wareki) newRow[col] = wareki;
          }
        }
      }
      return newRow;
    });
  }

  // プレビュー表示（最大10行、変換前＋変換後）
  function renderPreview() {
    if (!currentData) return;
    const { headers, rows } = currentData;
    const previewRows = rows.slice(0, 10);

    // 変換前
    previewTable.innerHTML = buildTableHtml(headers, previewRows);

    // 変換後
    if (dateColumns.length > 0) {
      const convertedPreview = convertRows(previewRows);
      previewTableConverted.innerHTML = buildTableHtml(headers, convertedPreview);
      statusMsg.textContent = t('status.dateDetected', {
        columns: dateColumns.map(i => currentData.headers[i]).join(', '),
        type: dateType === 'wareki' ? t('dateType.wareki') : t('dateType.seireki')
      });
      convertBtn.disabled = false;
    } else {
      previewTableConverted.innerHTML = '';
      statusMsg.textContent = t('status.noDateColumn');
      convertBtn.disabled = true;
    }
  }

  // 変換方向・フォーマット変更時にプレビューを再描画
  directionSelect.addEventListener('change', renderPreview);
  formatSelect.addEventListener('change', renderPreview);

  // 変換＆ダウンロード
  convertBtn.addEventListener('click', () => {
    if (!currentData) return;
    const direction = directionSelect.value;
    const format = formatSelect.value;
    const { headers, rows, delimiter, fileName } = currentData;

    const convertedRows = rows.map(row => {
      const newRow = [...row];
      for (const col of dateColumns) {
        const val = row[col];
        if (!val) continue;

        if (direction === 'wareki-to-seireki') {
          const parsed = parseWareki(val);
          if (parsed) {
            const seireki = warekiToSeireki(parsed);
            newRow[col] = seirekiToString(seireki, '/');
          }
        } else {
          const parsed = parseSeireki(val);
          if (parsed) {
            const wareki = seirekiToWareki([parsed.year, parsed.month, parsed.day], format);
            if (wareki) newRow[col] = wareki;
          }
        }
      }
      return newRow;
    });

    // CSV構築
    const headerLine = headers.join(delimiter);
    const bodyLines = convertedRows.map(r => r.join(delimiter));
    const csvText = '\uFEFF' + [headerLine, ...bodyLines].join('\n');

    // ダウンロード
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = fileName.replace(/\.[^.]+$/, '');
    a.href = url;
    a.download = `${baseName}_converted.csv`;
    a.click();
    URL.revokeObjectURL(url);
    statusMsg.textContent = t('status.downloadDone');
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
