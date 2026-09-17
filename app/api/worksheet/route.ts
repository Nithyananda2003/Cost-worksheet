import 'server-only';

import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import { NextResponse } from 'next/server';

import { hasValidSession } from '@/lib/auth';
import { loadWorksheetFonts } from '@/lib/worksheet-fonts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type WorksheetRow = {
  label: string;
  amount: number | null;
  comment: string;
};

type WorksheetRequest = {
  orderNumber: string;
  searchDate: string;
  stateCode: string;
  county: string;
  productType: string;
  fulfillment: 'Online' | 'Ground';
  note: string;
  rows: WorksheetRow[];
};

const BLACK = rgb(0, 0, 0);
const BLUE = rgb(0.212, 0.373, 0.569);
const LIGHT_BLUE = rgb(0.839, 0.914, 0.949);
const GRAY = rgb(0.85, 0.85, 0.85);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string'
    ? value
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength)
    : '';
}

function cleanAmount(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? Math.round(parsed * 100) / 100
    : 0;
}

function parseRequest(body: unknown): WorksheetRequest | null {
  if (!body || typeof body !== 'object') return null;
  const source = body as Record<string, unknown>;
  const rawRows = Array.isArray(source.rows) ? source.rows : [];

  if (rawRows.length !== 6) return null;

  const rows = rawRows.map((row) => {
    const item =
      row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    return {
      label: cleanText(item.label, 45),
      amount: cleanAmount(item.amount),
      comment: cleanText(item.comment, 60),
    };
  });

  const orderNumber = cleanText(source.orderNumber, 40);
  const searchDate = cleanText(source.searchDate, 40);
  const stateCode = cleanText(source.stateCode, 4);
  const county = cleanText(source.county, 80);
  const productType = cleanText(source.productType, 80);
  const fulfillment = source.fulfillment === 'Ground' ? 'Ground' : 'Online';

  if (!orderNumber || !searchDate || !stateCode || !county || !productType) {
    return null;
  }

  return {
    orderNumber,
    searchDate,
    stateCode,
    county,
    productType,
    fulfillment,
    note: cleanText(source.note, 80),
    rows,
  };
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const suffix = '...';
  let fitted = text;
  while (
    fitted.length > 0 &&
    font.widthOfTextAtSize(`${fitted}${suffix}`, size) > maxWidth
  ) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted}${suffix}`;
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont,
  size: number,
) {
  const fitted = fitText(text, font, size, width - 8);
  const textWidth = font.widthOfTextAtSize(fitted, size);
  page.drawText(fitted, {
    x: x + Math.max(4, (width - textWidth) / 2),
    y: y + (height - size) / 2 + 2,
    size,
    font,
    color: BLACK,
  });
}

function drawLeftText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont,
  size: number,
  padding = 5,
) {
  const fitted = fitText(text, font, size, width - padding * 2);
  page.drawText(fitted, {
    x: x + padding,
    y: y + (height - size) / 2 + 2,
    size,
    font,
    color: BLACK,
  });
}

function drawGrid(
  page: PDFPage,
  x: number,
  y: number,
  columnWidths: number[],
  rowHeights: number[],
) {
  const width = columnWidths.reduce((sum, value) => sum + value, 0);
  const height = rowHeights.reduce((sum, value) => sum + value, 0);

  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: BLACK,
    borderWidth: 0.5,
  });

  let currentX = x;
  for (const columnWidth of columnWidths.slice(0, -1)) {
    currentX += columnWidth;
    page.drawLine({
      start: { x: currentX, y },
      end: { x: currentX, y: y + height },
      thickness: 0.5,
      color: BLACK,
    });
  }

  let currentY = y + height;
  for (const rowHeight of rowHeights.slice(0, -1)) {
    currentY -= rowHeight;
    page.drawLine({
      start: { x, y: currentY },
      end: { x: x + width, y: currentY },
      thickness: 0.5,
      color: BLACK,
    });
  }
}

function currency(value: number) {
  return `$${value.toFixed(2)}`;
}

async function createWorksheetPdf(data: WorksheetRequest) {
  const document = await PDFDocument.create();
  document.setTitle(`${data.orderNumber} Cost Worksheet`);
  document.setSubject('DTNP Cost Worksheet');
  document.setCreator('ADS Pricing Desk');

  const page = document.addPage([612, 792]);
  const {
    regular,
    bold: contentBold,
    family,
  } = await loadWorksheetFonts(document);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const boldOblique = await document.embedFont(
    StandardFonts.HelveticaBoldOblique,
  );

  const title = 'DTNP - COST WORKSHEET';
  const titleSize = 20;
  const titleWidth = bold.widthOfTextAtSize(title, titleSize);
  const titleX = (612 - titleWidth) / 2;
  page.drawText(title, { x: titleX, y: 689, size: titleSize, font: bold });
  page.drawLine({
    start: { x: titleX, y: 686.5 },
    end: { x: titleX + titleWidth, y: 686.5 },
    thickness: 1.2,
    color: BLACK,
  });

  page.drawText('Order Details', {
    x: 72,
    y: 655.7,
    size: 16,
    font: bold,
    color: BLUE,
  });
  page.drawLine({
    start: { x: 72, y: 653 },
    end: { x: 160.5, y: 653 },
    thickness: 0.9,
    color: BLUE,
  });

  const orderX = 79.7;
  const orderY = 541.7;
  const orderColumns = [93.2, 312.1];
  const orderRows = [21.1, 21.1, 21.1, 26.2, 21.1];
  const orderLabels = [
    'Order Number',
    'Date of Search',
    'State',
    'County',
    'Product Type',
  ];
  const orderValues = [
    data.orderNumber,
    data.searchDate,
    data.stateCode,
    data.county,
    data.productType,
  ];
  const orderHeight = orderRows.reduce((sum, value) => sum + value, 0);
  let orderTop = orderY + orderHeight;

  orderRows.forEach((height, index) => {
    const rowY = orderTop - height;
    page.drawRectangle({
      x: orderX,
      y: rowY,
      width: orderColumns[0],
      height,
      color: index === 0 ? LIGHT_BLUE : GRAY,
    });
    drawCenteredText(
      page,
      orderLabels[index],
      orderX,
      rowY,
      orderColumns[0],
      height,
      regular,
      12,
    );
    drawLeftText(
      page,
      orderValues[index],
      orderX + orderColumns[0],
      rowY,
      orderColumns[1],
      height,
      regular,
      12,
    );
    orderTop = rowY;
  });
  drawGrid(page, orderX, orderY, orderColumns, orderRows);

  page.drawText('Search Cost Details', {
    x: 72,
    y: 477.6,
    size: 16,
    font: bold,
    color: BLUE,
  });
  page.drawLine({
    start: { x: 72, y: 475 },
    end: { x: 198.6, y: 475 },
    thickness: 0.9,
    color: BLUE,
  });
  page.drawText('Must complete the following:', {
    x: 85.5,
    y: 460,
    size: 10,
    font: boldOblique,
    color: BLACK,
  });

  const detailX = 79.9;
  const detailColumns = [143.8, 121.5, 140.3];
  const detailWidth = detailColumns.reduce((sum, value) => sum + value, 0);
  const routeY = 428.3;
  const routeHeight = 24.6;
  page.drawRectangle({
    x: detailX,
    y: routeY,
    width: detailWidth,
    height: routeHeight,
    color: GRAY,
  });
  drawGrid(page, detailX, routeY, detailColumns, [routeHeight]);
  drawCenteredText(
    page,
    'Online/Ground',
    detailX,
    routeY,
    detailColumns[0],
    routeHeight,
    contentBold,
    12,
  );
  drawCenteredText(
    page,
    data.fulfillment,
    detailX + detailColumns[0],
    routeY,
    detailColumns[1],
    routeHeight,
    contentBold,
    12,
  );
  const noteX = detailX + detailColumns[0] + detailColumns[1];
  drawLeftText(
    page,
    'Note:',
    noteX,
    routeY,
    detailColumns[2],
    routeHeight,
    contentBold,
    12,
  );
  if (data.note) {
    const prefixWidth = contentBold.widthOfTextAtSize('Note:', 12) + 4.3;
    page.drawText(
      fitText(data.note, regular, 12, detailColumns[2] - prefixWidth - 10),
      {
        x: noteX + 5 + prefixWidth,
        y: routeY + (routeHeight - 12) / 2 + 2,
        font: regular,
        size: 12,
        color: BLACK,
      },
    );
  }

  const costY = 253;
  const costRows = [24.2, 22.3, 18, 18, 17.5, 18.5, 18.5, 22.6];
  const costHeight = costRows.reduce((sum, value) => sum + value, 0);
  page.drawRectangle({
    x: detailX,
    y: costY + costHeight - costRows[0],
    width: detailWidth,
    height: costRows[0],
    color: GRAY,
  });
  page.drawRectangle({
    x: detailX,
    y: costY,
    width: detailWidth,
    height: costRows[costRows.length - 1],
    color: GRAY,
  });
  drawGrid(page, detailX, costY, detailColumns, costRows);

  let currentTop = costY + costHeight;
  const headers = ['Cost Type', 'Cost $', 'Comments'];
  headers.forEach((header, index) => {
    drawCenteredText(
      page,
      header,
      detailX +
        detailColumns.slice(0, index).reduce((sum, value) => sum + value, 0),
      currentTop - costRows[0],
      detailColumns[index],
      costRows[0],
      contentBold,
      12,
    );
  });
  currentTop -= costRows[0];

  data.rows.forEach((row, index) => {
    const height = costRows[index + 1];
    const rowY = currentTop - height;
    drawCenteredText(
      page,
      row.label,
      detailX,
      rowY,
      detailColumns[0],
      height,
      regular,
      12,
    );
    drawCenteredText(
      page,
      row.amount !== null &&
        !(index === 0 && data.fulfillment === 'Ground' && row.amount === 0)
        ? currency(row.amount)
        : '',
      detailX + detailColumns[0],
      rowY,
      detailColumns[1],
      height,
      regular,
      12,
    );
    drawLeftText(
      page,
      row.comment,
      detailX + detailColumns[0] + detailColumns[1],
      rowY,
      detailColumns[2],
      height,
      regular,
      12,
    );
    currentTop = rowY;
  });

  const total = data.rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const totalHeight = costRows[costRows.length - 1];
  drawCenteredText(
    page,
    'Total Cost',
    detailX,
    costY,
    detailColumns[0],
    totalHeight,
    contentBold,
    12,
  );
  drawCenteredText(
    page,
    currency(total),
    detailX + detailColumns[0],
    costY,
    detailColumns[1],
    totalHeight,
    regular,
    12,
  );

  return { bytes: await document.save(), family };
}

export async function POST(request: Request) {
  if (!(await hasValidSession())) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const data = parseRequest(body);
  if (!data) {
    return NextResponse.json(
      { error: 'Complete the worksheet details before downloading.' },
      { status: 400 },
    );
  }

  try {
    const { bytes, family } = await createWorksheetPdf(data);
    const safeOrderNumber = data.orderNumber.replace(/[^a-zA-Z0-9_-]+/g, '-');
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeOrderNumber}_Cost_Worksheet.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'X-Worksheet-Font': family,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'The cost worksheet could not be created.' },
      { status: 500 },
    );
  }
}
