// Best-effort text extraction for uploaded hospital protocol documents.
// PDFs go through pdf-parse; anything else is treated as plain text/markdown.

export async function extractTextFromFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const isPdf = mimetype === 'application/pdf' || /\.pdf$/i.test(filename);
  if (isPdf) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      // pdf-parse appends a "-- N of M --" page-break marker between pages;
      // it's noise for our purposes, not content.
      return result.text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '\n').trim();
    } finally {
      await parser.destroy();
    }
  }
  return buffer.toString('utf8').trim();
}
