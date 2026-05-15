import { logger } from '../../../utils/logger';

/**
 * Generates and triggers a browser print dialog for a kitchen receipt.
 * Optimized for 58mm thermal printers.
 */
export async function printOrderReceipt(order: any, orderDetails: any) {
  try {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    const doc = printFrame.contentWindow?.document;
    if (!doc) return;
        
    const formatPrice = (price: number) => {
      return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
    };
    
    const now = new Date();
    const printDate = now.toLocaleDateString('en-IN');
    const printTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Kitchen Bill - ${order.orderId}</title>
          <style>
            @media print {
              @page { size: 58mm auto; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-weight: 700;
              width: 58mm; 
              margin: 0 auto; 
              padding: 2mm; 
              font-size: 14px; 
              line-height: 1.2;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: 900; }
            .restaurant-name { font-size: 16px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
            .divider { border-top: 2px dashed #000; margin: 4px 0; }
            .divider-solid { border-top: 2px solid #000; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
            .items-table th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
            .items-table td { padding: 4px 0; vertical-align: top; }
            .grand-total { font-size: 16px; font-weight: 900; margin: 6px 0; }
            .footer { text-align: center; margin-top: 8px; border-top: 2px dashed #000; padding-top: 4px; }
          </style>
        </head>
        <body>
          <div class="center restaurant-name">THE TIP TOP</div>
          <div class="center" style="font-size: 12px">NEAR ASHIANA PG, LAW GATE</div>
          <div class="divider-solid"></div>
          <div class="row"><span>Bill: ${order.orderId}</span></div>
          <div class="row"><span>Date: ${printDate}</span><span>${printTime}</span></div>
          <div class="divider"></div>
          ${order.address && (order.address.addressLine || order.address.area) ? `
            <div style="font-size: 13px; margin-bottom: 4px;">
              <span class="bold">Address:</span> ${order.address.area ? `${order.address.area}, ` : ''}${order.address.addressLine}${order.address.landmark ? ` (${order.address.landmark})` : ''}
            </div>
          ` : ''}
          <div class="row"><span>Customer: ${order.customer}</span></div>
          <div class="row"><span>Phone: ${order.phone}</span></div>
          <div class="divider-solid"></div>
          <table class="items-table">
            <thead><tr><th>ITEM</th><th style="text-align:center">QTY</th><th style="text-align:right">PRICE</th></tr></thead>
            <tbody>
              ${orderDetails?.items?.map((item: any) => `
                <tr>
                  <td>${item.name.toUpperCase()}${item.portion ? ` (${item.portion})` : ''}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td style="text-align:right">₹${formatPrice(item.price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider-solid"></div>
          <div class="row"><span class="bold">TOTAL:</span><span class="bold">₹${formatPrice(orderDetails?.pricing?.finalAmount || parseFloat(order.total))}</span></div>
          ${orderDetails?.specialInstructions ? `<div class="divider"></div><div style="font-size: 12px">Note: ${orderDetails.specialInstructions}</div>` : ''}
          <div class="footer"><div class="bold">THANK YOU!</div></div>
        </body>
      </html>
    `);
    doc.close();
    
    if (printFrame.contentWindow) {
      printFrame.contentWindow.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          setTimeout(() => document.body.removeChild(printFrame), 500);
        }, 300);
      };
    }
  } catch (error) {
    logger.error('PRINT_RECEIPT_FAILED', 'Failed to generate print dialog', { error });
  }
}
