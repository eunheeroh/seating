// 자리배치 결과 → 엑셀(.xlsx) 파일 (자리배치도 시트 + 명단 시트)

export function todayText() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadBlob(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// 엑셀 색상 (ARGB)
const XL = {
  maleFill: 'FFE5F1FF', maleLine: 'FF6AAEF0', maleText: 'FF24578F',
  femaleFill: 'FFFFE9F2', femaleLine: 'FFF59AC0', femaleText: 'FFA33A6C',
  deskLine: 'FF6FD3B5', gray: 'FFA9B6C2', disabledLine: 'FFD5DEE6',
  board: 'FF3E7D64', teacher: 'FFFFD96A', door: 'FFCFE9FF', head: 'FFE3F7F0'
};

const center = { horizontal: 'center', vertical: 'middle', wrapText: true };
const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const box = color => {
  const s = { style: 'thin', color: { argb: color } };
  return { top: s, left: s, bottom: s, right: s };
};

function setCell(cell, props) {
  Object.assign(cell, props);
}

export async function exportSeatingExcel({ t, cols, rows, deskActive, assignment, statusText }) {
  const mod = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const today = todayText();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(t.sheetSeats, {
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
  });

  // 열 구성: A = 선생님 책상, B~ = 학생 책상, 마지막 = 앞문/뒷문
  const lastCol = cols + 2;
  const deskTop = 6;
  for (let c = 1; c <= cols + 1; c++) ws.getColumn(c).width = 14;
  ws.getColumn(lastCol).width = 10;

  // 제목 / 날짜·현황
  ws.mergeCells(1, 1, 1, lastCol);
  setCell(ws.getCell(1, 1), {
    value: `${t.title} (${today})`, font: { bold: true, size: 16 }, alignment: center
  });
  ws.getRow(1).height = 30;
  ws.mergeCells(2, 1, 2, lastCol);
  setCell(ws.getCell(2, 1), {
    value: statusText, font: { size: 10, color: { argb: 'FF7D8DA1' } }, alignment: center
  });

  // 칠판
  if (cols > 1) ws.mergeCells(4, 2, 4, cols + 1);
  setCell(ws.getCell(4, 2), {
    value: t.board,
    font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
    fill: fill(XL.board), alignment: center, border: box('FFD9A86C')
  });
  ws.getRow(4).height = 32;

  // 학생 책상
  for (let r = 0; r < rows; r++) {
    ws.getRow(deskTop + r).height = 42;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cell = ws.getCell(deskTop + r, c + 2);
      cell.alignment = center;
      const num = { text: `${idx + 1}\n`, font: { size: 8, color: { argb: XL.gray } } };

      if (!deskActive[idx]) {
        setCell(cell, { value: t.emptySeat, font: { size: 9, color: { argb: XL.gray } }, border: box(XL.disabledLine) });
        continue;
      }
      const a = assignment[idx];
      if (!a) {
        setCell(cell, {
          value: { richText: [num, { text: t.emptyDesk, font: { size: 9, color: { argb: XL.gray } } }] },
          border: box(XL.deskLine)
        });
        continue;
      }
      const isMale = a.gender === 'male', isFemale = a.gender === 'female';
      const textColor = isMale ? XL.maleText : isFemale ? XL.femaleText : 'FF34495E';
      cell.value = { richText: [num, { text: a.name, font: { bold: true, size: 12, color: { argb: textColor } } }] };
      if (isMale || isFemale) cell.fill = fill(isMale ? XL.maleFill : XL.femaleFill);
      cell.border = box(isMale ? XL.maleLine : isFemale ? XL.femaleLine : XL.deskLine);
    }
  }

  // 선생님 책상 · 앞문 · 뒷문
  setCell(ws.getCell(deskTop, 1), {
    value: t.teacherPlain, font: { bold: true }, fill: fill(XL.teacher), alignment: center, border: box('FFE8BD45')
  });
  setCell(ws.getCell(deskTop, lastCol), {
    value: t.frontDoor, fill: fill(XL.door), alignment: center, border: box('FF86BFE8')
  });
  setCell(ws.getCell(deskTop + Math.max(rows - 1, 1), lastCol), {
    value: t.backDoor, fill: fill(XL.door), alignment: center, border: box('FF86BFE8')
  });

  // 두 번째 시트: 명단 (자리 번호 순)
  const list = wb.addWorksheet(t.sheetList);
  list.columns = [
    { header: t.colNum, key: 'num', width: 10 },
    { header: t.colName, key: 'name', width: 18 },
    { header: t.colGender, key: 'gender', width: 8 },
    { header: t.colCol, key: 'col', width: 10 },
    { header: t.colRow, key: 'row', width: 8 }
  ];
  Object.keys(assignment).map(Number).sort((a, b) => a - b).forEach(idx => {
    const s = assignment[idx];
    list.addRow({
      num: idx + 1,
      name: s.name,
      gender: s.gender === 'male' ? t.male : s.gender === 'female' ? t.female : '',
      col: t.colUnit((idx % cols) + 1),
      row: t.rowUnit(Math.floor(idx / cols) + 1)
    });
  });
  list.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = fill(XL.head);
  });
  list.eachRow(row => row.eachCell(cell => {
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = box('FFD6E2EA');
  }));

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${t.fileName}_${today}.xlsx`
  );
}
