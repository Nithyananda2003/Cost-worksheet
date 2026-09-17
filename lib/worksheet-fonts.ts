import 'server-only';

import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PDFDocument } from 'pdf-lib';

export async function loadWorksheetFonts(document: PDFDocument) {
  // The same OFL-licensed files are used in the browser and server PDFs.
  // No system fonts or external font service are needed after deployment.
  const fontDirectory = path.join(process.cwd(), 'public/fonts/carlito');
  const bytes = await Promise.all([
    readFile(path.join(fontDirectory, 'Carlito-Regular.ttf')),
    readFile(path.join(fontDirectory, 'Carlito-Bold.ttf')),
  ]);
  document.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all(
    // Full embedding and individual letters avoid Carlito glyph/ligature
    // spacing issues in pdf-lib while preserving selectable worksheet text.
    bytes.map((fontBytes) =>
      document.embedFont(fontBytes, {
        subset: false,
        features: { liga: false, clig: false },
      }),
    ),
  );
  return { regular, bold, family: 'Carlito' as const };
}
