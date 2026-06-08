import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: 'svg', margin: 1 });
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
