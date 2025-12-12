import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

interface BarcodeItem {
  code: string;
  name: string;
  description?: string;
}

export async function generateBarcodePDF(
  items: BarcodeItem[],
  type: 'barcode' | 'qrcode' = 'barcode'
) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 15;
  const itemHeight = type === 'qrcode' ? 80 : 50;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Add new page if needed
    if (yPosition + itemHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = 20;
    }

    // Add title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.name, margin, yPosition);
    yPosition += 6;

    // Add description if exists
    if (item.description) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.description, margin, yPosition);
      yPosition += 5;
    }

    try {
      if (type === 'qrcode') {
        // Generate QR Code
        const qrDataUrl = await QRCode.toDataURL(item.code, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        // Add QR code to PDF
        const qrSize = 50;
        pdf.addImage(qrDataUrl, 'PNG', margin, yPosition, qrSize, qrSize);

        // Add code text below QR
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.code, margin + qrSize / 2, yPosition + qrSize + 6, {
          align: 'center',
        });

        yPosition += qrSize + 15;
      } else {
        // Generate Barcode
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, item.code, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });

        // Convert canvas to data URL
        const barcodeDataUrl = canvas.toDataURL('image/png');

        // Add barcode to PDF
        const barcodeWidth = 80;
        const barcodeHeight = 25;
        pdf.addImage(
          barcodeDataUrl,
          'PNG',
          margin,
          yPosition,
          barcodeWidth,
          barcodeHeight
        );

        yPosition += barcodeHeight + 10;
      }
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      pdf.setFontSize(9);
      pdf.setTextColor(255, 0, 0);
      pdf.text('Erro ao gerar código', margin, yPosition);
      yPosition += 10;
      pdf.setTextColor(0, 0, 0);
    }

    // Add separator line
    if (i < items.length - 1) {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  }

  return pdf;
}

export async function printBarcodePDF(
  items: BarcodeItem[],
  type: 'barcode' | 'qrcode' = 'barcode',
  filename: string = 'codigos.pdf'
) {
  const pdf = await generateBarcodePDF(items, type);
  pdf.save(filename);
}

export async function generateBarcodeImage(
  code: string,
  type: 'barcode' | 'qrcode' = 'barcode'
): Promise<string> {
  if (type === 'qrcode') {
    return await QRCode.toDataURL(code, {
      width: 300,
      margin: 2,
    });
  } else {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, code, {
      format: 'CODE128',
      width: 2,
      height: 80,
      displayValue: true,
    });
    return canvas.toDataURL('image/png');
  }
}
