import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  getTodayOrders,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  type Order,
  type TodayOrdersResponse,
  type AllOrdersResponse
} from "../../services/order-management.service";
import { apiRequest, parseApiResponse } from "../../config/api";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { thermalPrinter, type ReceiptData } from "../../services/thermal-printer.service";

// Define order data
const OrderTable = ({ orders, title, badgeColor, onStatusUpdate }: { orders: Order[], title: string, badgeColor: string, onStatusUpdate: (orderId: string, newStatus: string) => void }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<any>(null);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    
    // If order doesn't have items (inactive order), load details
    const order = orders.find(o => o.id === orderId);
    if (order && (!order.items || order.items.length === 0)) {
      const details = await getOrderDetails(orderId);
      if (details) {
        // Update the order in the list with full details
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
          orders[index] = details;
        }
      }
    }
    
    setExpandedOrderId(orderId);
  };

  const handlePrintReceipt = async (order: any, event?: React.MouseEvent) => {
    // Prevent row expansion
    if (event) {
      event.stopPropagation();
    }
    
    // Fetch order details first if not already loaded
    let orderDetails = expandedOrderDetails;
    
    if (expandedOrderId !== order.id || !expandedOrderDetails) {
      console.log('🔍 Loading order details for printing...');
      try {
        orderDetails = await getOrderDetails(order.id);
        setExpandedOrderDetails(orderDetails);
      } catch (error: any) {
        alert(`❌ Failed to load order details:\n${error.message}\n\nPlease check your network connection and try again.`);
        return;
      }
    }
    
    if (!orderDetails) {
      alert('Failed to load order details. Please try again.');
      return;
    }
    
    // Try WebUSB thermal printing first (Option 3) - only on Chrome/Edge
    if (thermalPrinter.isSupported()) {
      try {
        const useWebUSB = window.confirm(
          '🖨️ Direct Thermal Printer Available!\n\n' +
          'Option 1 (Recommended): Print directly to USB thermal printer\n' +
          '  ✅ Automatic cut & beep\n' +
          '  ✅ No print dialog\n' +
          '  ⚠️ Requires USB printer permission\n\n' +
          'Option 2: Use browser print dialog (fallback)\n' +
          '  ℹ️ Click OK for thermal printer, Cancel for browser\n'
        );
        
        if (useWebUSB) {
          // WebUSB thermal printing
          if (!thermalPrinter.isConnected()) {
            await thermalPrinter.requestDevice();
          }
          
          const details = orderDetails as any;
          const receiptData: ReceiptData = {
            restaurantName: 'THE TIP TOP',
            restaurantAddress: 'NEAR ASHIANA PG, LAW GATE, MAHERU, PHAGWARA',
            billType: '*** KITCHEN BILL ***',
            orderId: order.orderId,
            date: new Date().toLocaleString('en-IN'),
            items: details.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal: details.subtotal || 0,
            deliveryFee: details.deliveryFee || 0,
            total: details.total || 0,
            specialInstructions: details.specialInstructions
          };
          
          await thermalPrinter.printReceipt(receiptData);
          alert('✅ Receipt printed successfully via USB thermal printer!');
          return;
        }
      } catch (error: any) {
        console.error('WebUSB printing failed:', error);
        const fallback = window.confirm(
          `❌ USB thermal printing failed:\n${error.message}\n\n` +
          'Would you like to use browser print dialog instead?'
        );
        if (!fallback) return;
      }
    } else {
      // WebUSB not supported (Firefox, Safari, etc.)
      console.log('ℹ️ WebUSB not supported in this browser. Using browser print dialog.');
    }
    
    // Fallback: Browser print dialog (Option 5)
    // Create a hidden iframe for thermal printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    const doc = printFrame.contentWindow?.document;
    if (!doc) return;
    
    // Calculate totals from order details
    const totalQty = orderDetails?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    
    // Format price helper - remove .00 decimals
    const formatPrice = (price: number) => {
      return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
    };
    
    // Get current date and time
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
            /* Print-specific styles for thermal printer */
            @media print {
              @page {
                size: 58mm auto;  /* 58mm width, auto height */
                margin: 0;
              }
              body { 
                margin: 0;
                padding: 0;
              }
              /* Hide browser print controls */
              @page { margin: 0; }
            }
            
            /* Reset and base styles */
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-weight: 700;
              width: 58mm; 
              margin: 0 auto; 
              padding: 2mm 3mm; 
              font-size: 15px; 
              line-height: 1.35;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Typography */
            .center { 
              text-align: center; 
            }
            
            .bold { 
              font-weight: 900; 
            }
            
            .restaurant-name { 
              font-size: 15px; 
              font-weight: 900; 
              letter-spacing: 1px;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            
            .address { 
              font-size: 14px; 
              line-height: 1.35;
              margin-bottom: 1px;
            }
            
            .bill-type {
              font-size: 20px;
              font-weight: 900;
              margin: 4px 0;
              padding: 3px 0;
              background: #000;
              color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Dividers */
            .divider { 
              border-top: 2px dashed #000; 
              margin: 3px 0;
            }
            
            .divider-solid { 
              border-top: 3px solid #000; 
              margin: 4px 0;
            }
            
            /* Row layouts */
            .row { 
              display: flex; 
              justify-content: space-between;
              font-size: 14px;
              margin: 1px 0;
              line-height: 1.35;
            }
            
            .label { 
              font-weight: 900; 
            }
            
            /* Items section */
            .items-header {
              font-size: 14px;
              font-weight: 900;
              display: flex;
              justify-content: space-between;
              margin: 3px 0 2px 0;
              padding-bottom: 2px;
              border-bottom: 1px solid #333;
            }
            
            .item-row {
              font-size: 15px;
              margin: 3px 0;
              padding: 3px 0;
            }
            
            .item-name {
              font-weight: 900;
              margin-bottom: 1px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            
            .item-qty {
              background: #000;
              color: #fff;
              padding: 2px 6px;
              border-radius: 2px;
              font-weight: 900;
              display: inline-block;
              min-width: 30px;
              text-align: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Totals */
            .totals-section {
              margin-top: 4px;
              padding-top: 3px;
              border-top: 3px solid #000;
            }
            
            .grand-total {
              font-size: 20px;
              font-weight: 900;
              margin: 4px 0;
              padding: 3px 0;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              font-size: 14px;
              margin-top: 6px;
              padding-top: 3px;
              border-top: 2px dashed #000;
            }
            
            .special-notes {
              margin-top: 4px;
              padding: 4px;
              background: #000;
              border: 2px solid #000;
              font-size: 14px;
              word-wrap: break-word;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="center restaurant-name">THE TIP TOP</div>
          <div class="center address">NEAR ASHIANA PG, LAW GATE</div>
          <div class="center address">MAHERU, PHAGWARA</div>
          
          <div class="center bill-type">*** KITCHEN BILL ***</div>
          
          <div class="divider-solid"></div>
          
          <!-- Order Info -->
          <div class="row">
            <span><span class="label">Bill No:</span> ${order.orderId}</span>
          </div>
          <div class="row">
            <span><span class="label">Type:</span> ${order.orderType || 'Delivery'}</span>
          </div>
          <div class="row">
            <span><span class="label">Date:</span> ${printDate}</span>
            <span>${printTime}</span>
          </div>
          
          <div class="divider"></div>
          
          <!-- Customer Info -->
          <div class="row">
            <span><span class="label">Customer:</span> ${order.customer}</span>
          </div>
          <div class="row">
            <span><span class="label">Phone:</span> ${order.phone}</span>
          </div>
          
          <div class="divider-solid"></div>
          
          <!-- Items Header -->
          <div class="items-header">
            <span style="flex: 1;">ITEM</span>
            <span style="width: 30px; text-align: center;">QTY</span>
          </div>
          
          <!-- Items List -->
          ${orderDetails?.items?.map((item: any, index: number) => `
            <div class="item-row">
              <div class="item-name">${index + 1}. ${item.name.toUpperCase()}${item.portion ? ` (${item.portion})` : ''}</div>
              <div class="item-details">
                <span>₹${formatPrice(item.price)} × ${item.quantity}</span>
                <span class="item-qty">${item.quantity}</span>
              </div>
            </div>
          `).join('') || '<div class="item-row">No items</div>'}
          
          <div class="divider-solid"></div>
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="row">
              <span class="label">TOTAL ITEMS:</span>
              <span class="bold">${totalQty}</span>
            </div>
            <div class="row">
              <span class="label">SUB TOTAL:</span>
              <span class="bold">₹${formatPrice(parseFloat(order.total))}</span>
            </div>
          </div>
          
          <div class="divider-solid"></div>
          
          <div class="row grand-total">
            <span>GRAND TOTAL</span>
            <span>₹ ${formatPrice(parseFloat(order.total))}</span>
          </div>
          
          ${orderDetails?.specialInstructions ? `
            <div class="special-notes">
              <div class="label">SPECIAL INSTRUCTIONS:</div>
              <div>${orderDetails.specialInstructions}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <div class="bold">PREPARE WITH CARE</div>
            <div>Thank You!</div>
          </div>
          
          <div style="height: 10mm;"></div>
        </body>
      </html>
    `);
    doc.close();
    
    // Auto-print with improved timing
    if (printFrame.contentWindow) {
      printFrame.contentWindow.onload = function() {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            alert('Print dialog opened. Please select your thermal printer and confirm.');
          }
          
          // Cleanup after printing
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 500);
        }, 300);
      };
    }
  };

  const getActionButton = (order: Order) => {
    console.log('🔍 [getActionButton] Order:', {
      orderId: order.orderId,
      status: order.status,
      orderType: order.orderType,
      hasDeliveryPartner: !!order.deliveryPartner
    });
    
    switch (order.status) {
      case "New":
      case "PENDING":
        return (
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, "ACCEPTED");
              // Auto-print kitchen bill using browser after accepting
              setTimeout(() => {
                handlePrintReceipt(order, e);
              }, 500);
            }}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
          >
            Accept & Print
          </button>
        );
      case "Accepted":
      case "ACCEPTED":
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // For takeaway orders, send READY_FOR_PICKUP directly
              const newStatus = order.orderType === 'TAKEAWAY' ? 'READY_FOR_PICKUP' : 'READY';
              onStatusUpdate(order.id, newStatus);
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            {order.orderType === 'TAKEAWAY' ? 'Ready for Pickup' : 'Mark Ready'}
          </button>
        );
      case "Preparing":
      case "PREPARING":
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(order.id, "READY");
            }}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 transition-colors"
          >
            Mark Ready
          </button>
        );
      case "Ready":
      case "READY":
        console.log('📦 [READY Status] Checking order type:', {
          orderId: order.orderId,
          orderType: order.orderType,
          isTakeaway: order.orderType === 'TAKEAWAY',
          deliveryPartner: order.deliveryPartner
        });
        // Check if it's a takeaway order
        if (order.orderType === 'TAKEAWAY') {
          return (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Ready for Pickup
            </span>
          );
        }
        // Delivery order - check if claimed by delivery partner
        if (order.deliveryPartner) {
          return (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Claimed
            </span>
          );
        } else {
          return (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate(order.id, "ASSIGN_DELIVERY");
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              Assign Agent
            </button>
          );
        }
      case "READY_FOR_PICKUP":
      case "Ready for Pickup":
        console.log('✅ [READY_FOR_PICKUP] Showing Mark Delivered button for:', order.orderId);
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('🎯 [Mark Delivered] Button clicked for:', order.orderId);
              onStatusUpdate(order.id, "DELIVERED");
            }}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
          >
            Mark Delivered
          </button>
        );
      case "Out for Delivery":
      case "OUT_FOR_DELIVERY":
        return (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            Out for Delivery
          </span>
        );
      case "Delivered":
      case "DELIVERED":
      case "COMPLETED":
        return (
          <span className="text-xs text-gray-500 dark:text-gray-500 font-medium">
            Completed
          </span>
        );
      case "Canceled":
      case "CANCELLED":
        return (
          <span className="text-xs text-red-500 dark:text-red-400 font-medium">
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
        <span className={`inline-flex items-center justify-center rounded-full bg-${badgeColor}-50 px-2.5 py-0.5 text-xs font-medium text-${badgeColor}-600 dark:bg-${badgeColor}-500/10 dark:text-${badgeColor}-400`}>
          {orders.length}
        </span>
      </div>
      
      {/* Info banner for Ready orders */}
      {title === "Ready for Delivery" && orders.length > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">These orders are now visible to delivery partners</p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">Delivery partners will claim these orders from their app. Orders will automatically move to "Out for Delivery" when claimed.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No orders available</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Orders will appear here when available</p>
          </div>
        ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Order ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Address
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Items
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Total
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {orders.map((order) => (
                <>
                  <TableRow 
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.orderId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {order.customer}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {order.phone}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      {order.address ? (
                        <>
                          <div className="text-gray-800 text-theme-sm dark:text-white/90">
                            {order.address.street}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.address.city}, {order.address.state} {order.address.zip}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">No address</span>
                      )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                        {order.total}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getActionButton(order)}
                        {/* Browser Print Button - Works with any printer */}
                        {order.status !== "PENDING" && order.status !== "New" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintReceipt(order, e);
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-colors flex items-center gap-1"
                            title="Print kitchen bill (browser printing)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={7} className="px-5 py-4 bg-gray-50 dark:bg-white/[0.02]">
                        <div className="space-y-4">
                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Order ID & Date */}
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                  Order Details
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Order ID:</span> {order.orderId}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Date:</span> {order.date}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Time:</span> {order.time}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Amount:</span> {order.total}</p>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                  Customer Information
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {order.customer}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {order.phone}</p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                              {/* Delivery Address */}
                              {order.address && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                    Delivery Address
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>{order.address.street}</p>
                                    <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Delivery Partner Info */}
                              {order.deliveryPartner && (
                                <div className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-transparent p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-2 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Delivery Partner
                                  </h4>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                    <p><span className="font-medium">Name:</span> {order.deliveryPartner.name}</p>
                                    <p><span className="font-medium">Phone:</span> {order.deliveryPartner.phone}</p>
                                    {order.deliveryPartner.vehicleNumber && (
                                      <p><span className="font-medium">Vehicle:</span> {order.deliveryPartner.vehicleNumber}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Items */}
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                              Order Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)} items)
                            </h4>
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                              <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-white/[0.03]">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Item
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Portion
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                      No. of Items
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {order.items.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90">
                                        {item.name}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                        {item.portion || '-'}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                        {item.quantity}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                        {item.price}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-100 dark:bg-white/[0.03]">
                                  {/* Items Subtotal */}
                                  {order.pricing && (
                                    <>
                                      <tr>
                                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                          Items Total:
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                          ₹{order.pricing.itemsTotal.toFixed(2)}
                                        </td>
                                      </tr>
                                      
                                      {/* Delivery Fee - only show if > 0 */}
                                      {order.pricing.deliveryFee > 0 && (
                                        <tr>
                                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                            Delivery Fee:
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                            ₹{order.pricing.deliveryFee.toFixed(2)}
                                          </td>
                                        </tr>
                                      )}
                                      
                                      {/* GST/Tax - only show if > 0 */}
                                      {order.pricing.gst > 0 && (
                                        <tr>
                                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                            Tax ({order.pricing.gstRate}%):
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                            ₹{order.pricing.gst.toFixed(2)}
                                          </td>
                                        </tr>
                                      )}
                                      
                                      {/* Discount - only show if > 0 */}
                                      {order.pricing.discount > 0 && (
                                        <tr>
                                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                            Discount:
                                          </td>
                                          <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400 text-right">
                                            -₹{order.pricing.discount.toFixed(2)}
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* Grand Total */}
                                  <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white/90 text-right">
                                      Total:
                                    </td>
                                    <td className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white/90 text-right">
                                      {order.total}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </div>
    </div>
  );
};

const AllOrdersTable = ({ orders }: { orders: Order[] }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setExpandedOrderDetails(null);
    } else {
      setExpandedOrderId(orderId);
      setLoadingDetails(true);
      
      // Fetch full order details
      const details = await getOrderDetails(orderId);
      
      console.log('🔍 ORDER DETAILS DEBUG:');
      console.log('Raw order details:', details);
      console.log('Order pricing object:', details?.pricing);
      console.log('Items total:', details?.pricing?.itemsTotal);
      console.log('Delivery fee:', details?.pricing?.deliveryFee);
      console.log('GST:', details?.pricing?.gst);
      console.log('GST Rate:', details?.pricing?.gstRate);
      console.log('Discount:', details?.pricing?.discount);
      console.log('Final amount:', details?.pricing?.finalAmount);
      console.log('Total field:', details?.total);
      
      setExpandedOrderDetails(details);
      setLoadingDetails(false);
    }
  };

  const handlePrintReceipt = async (order: any, event?: React.MouseEvent) => {
    // Prevent row expansion
    if (event) {
      event.stopPropagation();
    }
    
    // Fetch order details first if not already loaded
    let orderDetails = expandedOrderDetails;
    
    if (expandedOrderId !== order.id || !expandedOrderDetails) {
      console.log('🔍 Loading order details for printing...');
      try {
        orderDetails = await getOrderDetails(order.id);
        setExpandedOrderDetails(orderDetails);
      } catch (error: any) {
        alert(`❌ Failed to load order details:\n${error.message}\n\nPlease check your network connection and try again.`);
        return;
      }
    }
    
    if (!orderDetails) {
      alert('Failed to load order details. Please try again.');
      return;
    }
    
    // Try WebUSB thermal printing first (Option 3) - only on Chrome/Edge
    if (thermalPrinter.isSupported()) {
      try {
        const useWebUSB = window.confirm(
          '🖨️ Direct Thermal Printer Available!\n\n' +
          'Option 1 (Recommended): Print directly to USB thermal printer\n' +
          '  ✅ Automatic cut & beep\n' +
          '  ✅ No print dialog\n' +
          '  ⚠️ Requires USB printer permission\n\n' +
          'Option 2: Use browser print dialog (fallback)\n' +
          '  ℹ️ Click OK for thermal printer, Cancel for browser\n'
        );
        
        if (useWebUSB) {
          // WebUSB thermal printing
          if (!thermalPrinter.isConnected()) {
            await thermalPrinter.requestDevice();
          }
          
          const details = orderDetails as any;
          const receiptData: ReceiptData = {
            restaurantName: 'THE TIP TOP',
            restaurantAddress: 'NEAR ASHIANA PG, LAW GATE, MAHERU, PHAGWARA',
            billType: '*** KITCHEN BILL ***',
            orderId: order.orderId,
            date: new Date().toLocaleString('en-IN'),
            items: details.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal: details.subtotal || 0,
            deliveryFee: details.deliveryFee || 0,
            total: details.total || 0,
            specialInstructions: details.specialInstructions
          };
          
          await thermalPrinter.printReceipt(receiptData);
          alert('✅ Receipt printed successfully via USB thermal printer!');
          return;
        }
      } catch (error: any) {
        console.error('WebUSB printing failed:', error);
        const fallback = window.confirm(
          `❌ USB thermal printing failed:\n${error.message}\n\n` +
          'Would you like to use browser print dialog instead?'
        );
        if (!fallback) return;
      }
    } else {
      // WebUSB not supported (Firefox, Safari, etc.)
      console.log('ℹ️ WebUSB not supported in this browser. Using browser print dialog.');
    }
    
    // Fallback: Browser print dialog (Option 5)
    // Create a hidden iframe for thermal printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    document.body.appendChild(printFrame);
    
    const doc = printFrame.contentWindow?.document;
    if (!doc) return;
    
    // Calculate totals from order details
    const totalQty = orderDetails?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
    
    // Format price helper - remove .00 decimals
    const formatPrice = (price: number) => {
      return price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);
    };
    
    // Get current date and time
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
            /* Print-specific styles for thermal printer */
            @media print {
              @page {
                size: 58mm auto;  /* 58mm width, auto height */
                margin: 0;
              }
              body { 
                margin: 0;
                padding: 0;
              }
              /* Hide browser print controls */
              @page { margin: 0; }
            }
            
            /* Reset and base styles */
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-weight: 700;
              width: 58mm; 
              margin: 0 auto; 
              padding: 2mm 3mm; 
              font-size: 23px; 
              line-height: 1.35;
              color: #000;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Typography */
            .center { 
              text-align: center; 
            }
            
            .bold { 
              font-weight: 900; 
            }
            
            .restaurant-name { 
              font-size: 23px; 
              font-weight: 900; 
              letter-spacing: 1px;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            
            .address { 
              font-size: 14px; 
              line-height: 1.35;
              margin-bottom: 1px;
            }
            
            .bill-type {
              font-size: 20px;
              font-weight: 900;
              margin: 4px 0;
              padding: 3px 0;
              background: #000;
              color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Dividers */
            .divider { 
              border-top: 2px dashed #000; 
              margin: 3px 0;
            }
            
            .divider-solid { 
              border-top: 3px solid #000; 
              margin: 4px 0;
            }
            
            /* Row layouts */
            .row { 
              display: flex; 
              justify-content: space-between;
              font-size: 14px;
              margin: 1px 0;
              line-height: 1.35;
            }
            
            .label { 
              font-weight: 900; 
            }
            
            /* Items section */
            .items-header {
              font-size: 14px;
              font-weight: 900;
              display: flex;
              justify-content: space-between;
              margin: 3px 0 2px 0;
              padding-bottom: 2px;
              border-bottom: 1px solid #333;
            }
            
            .item-row {
              font-size: 15px;
              margin: 3px 0;
              padding: 3px 0;
            }
            
            .item-name {
              font-weight: 900;
              margin-bottom: 1px;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            
            .item-qty {
              background: #000;
              color: #fff;
              padding: 2px 6px;
              border-radius: 2px;
              font-weight: 900;
              display: inline-block;
              min-width: 30px;
              text-align: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Totals */
            .totals-section {
              margin-top: 4px;
              padding-top: 3px;
              border-top: 3px solid #000;
            }
            
            .grand-total {
              font-size: 20px;
              font-weight: 900;
              margin: 4px 0;
              padding: 3px 0;
            }
            
            /* Footer */
            .footer {
              text-align: center;
              font-size: 14px;
              margin-top: 6px;
              padding-top: 3px;
              border-top: 2px dashed #000;
            }
            
            .special-notes {
              margin-top: 4px;
              padding: 4px;
              background: #000;
              border: 2px solid #000;
              font-size: 14px;
              word-wrap: break-word;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="center restaurant-name">THE TIP TOP</div>
          <div class="center address">NEAR ASHIANA PG, LAW GATE</div>
          <div class="center address">MAHERU, PHAGWARA</div>
          
          <div class="center bill-type">*** KITCHEN BILL ***</div>
          
          <div class="divider-solid"></div>
          
          <!-- Order Info -->
          <div class="row">
            <span><span class="label">Bill No:</span> ${order.orderId}</span>
          </div>
          <div class="row">
            <span><span class="label">Type:</span> ${order.orderType || 'Delivery'}</span>
          </div>
          <div class="row">
            <span><span class="label">Date:</span> ${printDate}</span>
            <span>${printTime}</span>
          </div>
          
          <div class="divider"></div>
          
          <!-- Customer Info -->
          <div class="row">
            <span><span class="label">Customer:</span> ${order.customer}</span>
          </div>
          <div class="row">
            <span><span class="label">Phone:</span> ${order.phone}</span>
          </div>
          
          <div class="divider-solid"></div>
          
          <!-- Items Header -->
          <div class="items-header">
            <span style="flex: 1;">ITEM</span>
            <span style="width: 30px; text-align: center;">QTY</span>
          </div>
          
          <!-- Items List -->
          ${orderDetails?.items?.map((item: any, index: number) => `
            <div class="item-row">
              <div class="item-name">${index + 1}. ${item.name.toUpperCase()}${item.portion ? ` (${item.portion})` : ''}</div>
              <div class="item-details">
                <span>₹${formatPrice(item.price)} × ${item.quantity}</span>
                <span class="item-qty">${item.quantity}</span>
              </div>
            </div>
          `).join('') || '<div class="item-row">No items</div>'}
          
          <div class="divider-solid"></div>
          
          <!-- Totals -->
          <div class="totals-section">
            <div class="row">
              <span class="label">TOTAL ITEMS:</span>
              <span class="bold">${totalQty}</span>
            </div>
            <div class="row">
              <span class="label">SUB TOTAL:</span>
              <span class="bold">₹${formatPrice(parseFloat(order.total))}</span>
            </div>
          </div>
          
          <div class="divider-solid"></div>
          
          <div class="row grand-total">
            <span>GRAND TOTAL</span>
            <span>₹ ${formatPrice(parseFloat(order.total))}</span>
          </div>
          
          ${orderDetails?.specialInstructions ? `
            <div class="special-notes">
              <div class="label">SPECIAL INSTRUCTIONS:</div>
              <div>${orderDetails.specialInstructions}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <div class="bold">PREPARE WITH CARE</div>
            <div>Thank You!</div>
          </div>
          
          <div style="height: 10mm;"></div>
        </body>
      </html>
    `);
    doc.close();
    
    // Auto-print with improved timing
    if (printFrame.contentWindow) {
      printFrame.contentWindow.onload = function() {
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            alert('Print dialog opened. Please select your thermal printer and confirm.');
          }
          
          // Cleanup after printing
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 500);
        }, 300);
      };
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
      case "Accepted":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "Preparing":
        return "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400";
      case "Ready":
        return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      case "Delivered":
        return "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";
      case "Canceled":
        return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Order ID
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Customer
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Phone
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Items
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow 
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                >
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {order.orderId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      {typeof order.customer === 'string' ? order.customer : (order.customer as any)?.name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      {typeof order.phone === 'string' ? order.phone : (order.customer as any)?.phone || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      {order.itemCount || 0} items
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      {order.total}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      <div>{order.date}</div>
                      <div className="text-xs text-gray-400">{order.time}</div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintReceipt(order, e);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition-colors"
                    >
                      Print
                    </button>
                  </TableCell>
                </TableRow>
                {expandedOrderId === order.id && (
                  <tr>
                    <td colSpan={8} className="px-5 py-4 bg-gray-50 dark:bg-white/[0.02]">
                      {loadingDetails ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading order details...</span>
                        </div>
                      ) : expandedOrderDetails ? (
                        <div className="space-y-4">
                          {/* Order Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                              {/* Order ID & Date */}
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                  Order Details
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Order ID:</span> {expandedOrderDetails.orderId}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Date:</span> {expandedOrderDetails.date}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Time:</span> {expandedOrderDetails.time}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Amount:</span> {expandedOrderDetails.total}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Status:</span> <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(expandedOrderDetails.status)}`}>
                                    {expandedOrderDetails.status}
                                  </span></p>
                                </div>
                              </div>

                              {/* Customer Info */}
                              <div>
                                <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                  Customer Information
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {typeof expandedOrderDetails.customer === 'string' ? expandedOrderDetails.customer : (expandedOrderDetails.customer as any)?.name || 'N/A'}</p>
                                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {typeof expandedOrderDetails.phone === 'string' ? expandedOrderDetails.phone : (expandedOrderDetails.customer as any)?.phone || 'N/A'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div>
                              {/* Delivery Address */}
                              {expandedOrderDetails.address && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                                    Delivery Address
                                  </h4>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>{expandedOrderDetails.address.street}</p>
                                    <p>{expandedOrderDetails.address.city}, {expandedOrderDetails.address.state} {expandedOrderDetails.address.zip}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                        {/* Order Items */}
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white/90 text-sm mb-2">
                            Order Items ({expandedOrderDetails.items.reduce((sum, item) => sum + item.quantity, 0)} items)
                          </h4>
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full">
                              <thead className="bg-gray-100 dark:bg-white/[0.03]">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Item
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Portion
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                    No. of Items
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Price
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {expandedOrderDetails.items.map((item, index) => (
                                  <tr key={`${expandedOrderDetails.id}-item-${index}`}>
                                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                      {item.portion || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                      {item.price}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-100 dark:bg-white/[0.03]">
                                {/* Items Subtotal */}
                                {(() => {
                                  console.log('🎨 RENDERING PRICING SECTION:');
                                  console.log('expandedOrderDetails exists?', !!expandedOrderDetails);
                                  console.log('expandedOrderDetails.pricing exists?', !!expandedOrderDetails?.pricing);
                                  console.log('Full expandedOrderDetails:', expandedOrderDetails);
                                  console.log('Pricing object:', expandedOrderDetails?.pricing);
                                  return null;
                                })()}
                                {expandedOrderDetails.pricing && (
                                  <>
                                    <tr>
                                      <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                        Items Total:
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                        ₹{expandedOrderDetails.pricing.itemsTotal.toFixed(2)}
                                      </td>
                                    </tr>
                                    
                                    {/* Delivery Fee - only show if > 0 */}
                                    {expandedOrderDetails.pricing.deliveryFee > 0 && (
                                      <tr>
                                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                          Delivery Fee:
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                          ₹{expandedOrderDetails.pricing.deliveryFee.toFixed(2)}
                                        </td>
                                      </tr>
                                    )}
                                    
                                    {/* GST/Tax - only show if > 0 */}
                                    {expandedOrderDetails.pricing.gst > 0 && (
                                      <tr>
                                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                          Tax ({expandedOrderDetails.pricing.gstRate}%):
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-white/90 text-right">
                                          ₹{expandedOrderDetails.pricing.gst.toFixed(2)}
                                        </td>
                                      </tr>
                                    )}
                                    
                                    {/* Discount - only show if > 0 */}
                                    {expandedOrderDetails.pricing.discount > 0 && (
                                      <tr>
                                        <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                                          Discount:
                                        </td>
                                        <td className="px-4 py-2 text-sm text-green-600 dark:text-green-400 text-right">
                                          -₹{expandedOrderDetails.pricing.discount.toFixed(2)}
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                )}
                                
                                {/* Grand Total */}
                                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                  <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white/90 text-right">
                                    Total:
                                  </td>
                                  <td className="px-4 py-2 text-sm font-semibold text-gray-800 dark:text-white/90 text-right">
                                    {expandedOrderDetails.total}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                          Failed to load order details
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default function OrderManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('tab') as "today" | "all") || "today";
  const [todayOrders, setTodayOrders] = useState<TodayOrdersResponse | null>(null);
  const [allOrdersData, setAllOrdersData] = useState<AllOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { isOnline } = useNetworkStatus();
  
  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<Order | null>(null);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [assigningPartner, setAssigningPartner] = useState(false);
  const [tempSelectedPartnerId, setTempSelectedPartnerId] = useState<string | null>(null); // For two-step selection
  const [assigningPartnerId, setAssigningPartnerId] = useState<string | null>(null); // Currently assigning
  const [assignError, setAssignError] = useState<string | null>(null);
  
  // Fetch today's orders
  useEffect(() => {
    if (view === "today") {
      fetchTodayOrders();
    }
  }, [view]);
  
  // Fetch all orders
  useEffect(() => {
    if (view === "all") {
      fetchAllOrders(currentPage);
    }
  }, [view, currentPage]);
  
  const fetchTodayOrders = async () => {
    setLoading(true);
    console.log('🔄 [fetchTodayOrders] Fetching today\'s orders...');
    const data = await getTodayOrders();
    
    console.log('📊 [fetchTodayOrders] RAW DATA RECEIVED:', JSON.stringify(data, null, 2));
    console.log('📊 [fetchTodayOrders] Data structure:', {
      isNull: data === null,
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
      pending: data?.pending?.length || 0,
      accepted: data?.accepted?.length || 0,
      preparing: data?.preparing?.length || 0,
      ready: data?.ready?.length || 0,
      ready_for_pickup: data?.ready_for_pickup?.length || 0,
      out_for_delivery: data?.out_for_delivery?.length || 0,
      delivered: data?.delivered?.length || 0,
      cancelled: data?.cancelled?.length || 0
    });
    
    if (data?.pending && data.pending.length > 0) {
      console.log('🔍 [fetchTodayOrders] Sample pending order:', data.pending[0]);
    }
    
    setTodayOrders(data);
    setLoading(false);
  };
  
  const fetchAllOrders = async (page: number) => {
    setLoading(true);
    console.log(`🔄 [fetchAllOrders] Fetching all orders (page ${page})...`);
    const data = await getAllOrders(page, 10);
    
    console.log('📊 [fetchAllOrders] RAW DATA RECEIVED:', JSON.stringify(data, null, 2));
    console.log('📊 [fetchAllOrders] Data structure:', {
      isNull: data === null,
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
      hasOrders: !!data?.orders,
      ordersCount: data?.orders?.length || 0,
      hasPagination: !!data?.pagination,
      paginationKeys: data?.pagination ? Object.keys(data.pagination) : [],
      pagination: data?.pagination
    });
    
    if (data?.orders && data.orders.length > 0) {
      console.log('🔍 [fetchAllOrders] Sample order:', data.orders[0]);
      console.log('🔍 [fetchAllOrders] Customer field type:', typeof data.orders[0].customer);
      console.log('🔍 [fetchAllOrders] Customer value:', data.orders[0].customer);
      console.log('🔍 [fetchAllOrders] Phone field type:', typeof data.orders[0].phone);
      console.log('🔍 [fetchAllOrders] Phone value:', data.orders[0].phone);
    }
    
    setAllOrdersData(data);
    setLoading(false);
  };
  
  const fetchDeliveryPartners = async () => {
    try {
      const response = await apiRequest('delivery/partners');
      const data = await parseApiResponse(response);
      if (data.status === 'success' && data.data) {
        setDeliveryPartners(data.data.partners || []);
      }
    } catch (error) {
      console.error('Failed to fetch delivery partners:', error);
    }
  };
  
  const assignDeliveryPartner = async (orderId: string, partnerId: string) => {
    try {
      setAssigningPartner(true);
      setAssigningPartnerId(partnerId);
      setAssignError(null);
      
      const response = await apiRequest(`orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPartnerId: partnerId })
      });
      
      const data = await parseApiResponse(response);
      
      if (data.status === 'success') {
        showNotification('Delivery partner assigned successfully!', 'success');
        setShowAssignModal(false);
        setTempSelectedPartnerId(null);
        setAssigningPartnerId(null);
        setAssignError(null);
        // Refresh orders to show updated status
        if (view === "today") {
          fetchTodayOrders();
        } else {
          fetchAllOrders(currentPage);
        }
      } else {
        const errorMsg = data.message || 'Failed to assign delivery partner';
        setAssignError(errorMsg);
        showNotification(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Error assigning delivery partner:', error);
      const errorMsg = error.message || 'Failed to assign delivery partner';
      setAssignError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setAssigningPartner(false);
      setAssigningPartnerId(null);
    }
  };
  
  // Handler for selecting a partner (first step)
  const handleSelectPartner = (partnerId: string) => {
    setTempSelectedPartnerId(partnerId);
    setAssignError(null);
  };
  
  // Handler for confirming assignment (second step)
  const handleConfirmAssignment = () => {
    if (tempSelectedPartnerId && selectedOrderForAssign) {
      assignDeliveryPartner(selectedOrderForAssign.id, tempSelectedPartnerId);
    }
  };
  
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    console.log(`🔄 [handleStatusUpdate] Attempting to update order ${orderId} to ${newStatus}`);
    
    // Check if online
    if (!isOnline) {
      showNotification('No internet connection. Please check your network and try again.', 'error');
      return;
    }
    
    // Find the order to log its current state
    const currentOrder = todayOrders?.pending?.find(o => o.id === orderId) ||
                        todayOrders?.accepted?.find(o => o.id === orderId) ||
                        todayOrders?.preparing?.find(o => o.id === orderId) ||
                        todayOrders?.ready?.find(o => o.id === orderId) ||
                        todayOrders?.ready_for_pickup?.find(o => o.id === orderId) ||
                        todayOrders?.out_for_delivery?.find(o => o.id === orderId);
    
    if (currentOrder) {
      console.log('📋 [Current Order State]:', {
        orderId: currentOrder.orderId,
        currentStatus: currentOrder.status,
        orderType: currentOrder.orderType,
        newStatus: newStatus
      });
    }
    
    // Handle assignment action
    if (newStatus === 'ASSIGN_DELIVERY') {
      const order = todayOrders?.ready?.find(o => o.id === orderId);
      if (order) {
        setSelectedOrderForAssign(order);
        setShowAssignModal(true);
        // Fetch delivery partners when modal opens
        fetchDeliveryPartners();
      }
      return;
    }
    
    // Declare movedOrder outside the if block so it's accessible for the API call
    let movedOrder: Order | undefined;
    
    if (view === "today" && todayOrders) {
      // Find the order in current status arrays
      let fromStatus = '';
      
      // Check all status arrays
      const statusArrays = [
        { key: 'pending', array: todayOrders.pending, displayName: 'New' },
        { key: 'accepted', array: todayOrders.accepted, displayName: 'Accepted' },
        { key: 'preparing', array: todayOrders.preparing, displayName: 'Preparing' },
        { key: 'ready', array: todayOrders.ready, displayName: 'Ready' },
        { key: 'ready_for_pickup', array: todayOrders.ready_for_pickup, displayName: 'Ready for Pickup' },
        { key: 'out_for_delivery', array: todayOrders.out_for_delivery, displayName: 'Out for Delivery' },
        { key: 'delivered', array: todayOrders.delivered, displayName: 'Delivered' },
        { key: 'cancelled', array: todayOrders.cancelled, displayName: 'Cancelled' }
      ];
      
      for (const statusObj of statusArrays) {
        const order = statusObj.array?.find(o => o.id === orderId);
        if (order) {
          movedOrder = { ...order };
          fromStatus = statusObj.displayName;
          break;
        }
      }
      
      if (movedOrder) {
        // Map new status to display status and array key
        const statusMap: Record<string, { display: string, key: keyof TodayOrdersResponse }> = {
          'ACCEPTED': { display: 'Accepted', key: 'accepted' },
          'READY': { display: 'Ready', key: 'ready' },
          'READY_FOR_PICKUP': { display: 'Ready for Pickup', key: 'ready_for_pickup' },
          'OUT_FOR_DELIVERY': { display: 'Out for Delivery', key: 'out_for_delivery' },
          'DELIVERED': { display: 'Delivered', key: 'delivered' },
          'CANCELLED': { display: 'Canceled', key: 'cancelled' }
        };
        
        const toStatusInfo = statusMap[newStatus];
        
        if (toStatusInfo) {
          // Optimistically update the UI
          const newTodayOrders = { ...todayOrders };
          
          // Remove from current status array
          for (const statusObj of statusArrays) {
            if (newTodayOrders[statusObj.key as keyof TodayOrdersResponse]) {
              newTodayOrders[statusObj.key as keyof TodayOrdersResponse] = 
                (newTodayOrders[statusObj.key as keyof TodayOrdersResponse] as Order[]).filter(o => o.id !== orderId);
            }
          }
          
          // Update order status
          movedOrder.status = toStatusInfo.display;
          
          // Add to new status array
          const targetArray = newTodayOrders[toStatusInfo.key] as Order[];
          newTodayOrders[toStatusInfo.key] = [...(targetArray || []), movedOrder] as any;
          
          // Update state immediately (optimistic update)
          setTodayOrders(newTodayOrders);
          
          // Show notification
          showNotification(`Order moved from ${fromStatus} to ${toStatusInfo.display}!`, 'success');
        }
      }
    }
    
    // Make API call in background - pass orderType from currentOrder
    const orderType = currentOrder?.orderType || 'DELIVERY';
    console.log('🔄 [Sending to API] OrderType:', orderType, 'Status:', newStatus);
    const success = await updateOrderStatus(orderId, newStatus, orderType as 'DELIVERY' | 'TAKEAWAY');
    
    if (success) {
      console.log('✅ Status update confirmed by server - UI already updated optimistically');
    } else {
      console.error('❌ Status update failed - reverting optimistic update');
      showNotification('Failed to update order status. Refreshing...', 'error');
      
      // Only refresh on failure to revert optimistic update
      if (view === "today") {
        fetchTodayOrders();
      } else {
        fetchAllOrders(currentPage);
      }
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-hide after 3 seconds
  };
  
  const ordersByStatus = {
    New: todayOrders?.pending || [],
    Accepted: todayOrders?.accepted || [],
    Preparing: todayOrders?.preparing || [],
    Ready: todayOrders?.ready || [],
    "Ready for Pickup": todayOrders?.ready_for_pickup || [],
    "Out for Delivery": todayOrders?.out_for_delivery || [],
    Delivered: todayOrders?.delivered || [],
    Canceled: todayOrders?.cancelled || [],
  };

  return (
    <>
      <PageMeta
        title="Order Management | Admin Dashboard"
        description="Manage and view all orders"
      />
      <PageBreadcrumb pageTitle="Order Management" />
      
      {/* View Toggle Buttons */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setSearchParams({ tab: 'today' })}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            view === "today"
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'all' })}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            view === "all"
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          All
        </button>
        
        {/* Refresh Button */}
        <button
          onClick={() => {
            if (view === "today") {
              fetchTodayOrders();
            } else {
              fetchAllOrders(currentPage);
            }
          }}
          disabled={loading}
          className="ml-auto rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh orders"
        >
          <svg 
            className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : view === "today" ? (
        <div className="space-y-6">
          {/* Check if there are no orders at all */}
          {!todayOrders || (
            ordersByStatus.New.length === 0 && 
            ordersByStatus.Accepted.length === 0 && 
            ordersByStatus.Preparing.length === 0 && 
            ordersByStatus.Ready.length === 0 &&
            ordersByStatus["Ready for Pickup"].length === 0 && 
            ordersByStatus.Delivered.length === 0 && 
            ordersByStatus.Canceled.length === 0
          ) ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">No Orders Today</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No orders have been placed today yet.
              </p>
            </div>
          ) : (
            <>
              {/* New Orders Table */}
              <OrderTable orders={ordersByStatus.New} title="New Orders" badgeColor="indigo" onStatusUpdate={handleStatusUpdate} />
              
              {/* Accepted Orders Table */}
              <OrderTable orders={ordersByStatus.Accepted} title="Accepted" badgeColor="blue" onStatusUpdate={handleStatusUpdate} />
              
              {/* Ready Orders Table */}
              <OrderTable orders={ordersByStatus.Ready} title="Ready for Delivery" badgeColor="purple" onStatusUpdate={handleStatusUpdate} />
              
              {/* Ready for Pickup Orders Table (Takeaway) */}
              <OrderTable orders={ordersByStatus["Ready for Pickup"]} title="Ready for Pickup" badgeColor="green" onStatusUpdate={handleStatusUpdate} />
              
              {/* Out for Delivery Orders Table */}
              <OrderTable orders={ordersByStatus["Out for Delivery"]} title="Out for Delivery" badgeColor="indigo" onStatusUpdate={handleStatusUpdate} />
              
              {/* Delivered Orders Table */}
              <OrderTable orders={ordersByStatus.Delivered} title="Delivered" badgeColor="green" onStatusUpdate={handleStatusUpdate} />
              
              {/* Canceled Orders Table */}
              <OrderTable orders={ordersByStatus.Canceled} title="Canceled" badgeColor="red" onStatusUpdate={handleStatusUpdate} />
            </>
          )}
        </div>
      ) : (
        <div>
          {!allOrdersData || !allOrdersData.orders || allOrdersData.orders.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-white/[0.05] dark:bg-white/[0.03]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">No Orders Found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                There are no orders in the system yet.
              </p>
            </div>
          ) : (
            <>
              <AllOrdersTable orders={allOrdersData.orders} />
              {allOrdersData.pagination && allOrdersData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {allOrdersData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(allOrdersData.pagination.totalPages, p + 1))}
                    disabled={currentPage === allOrdersData.pagination.totalPages}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-[100001] animate-slide-up">
          <div className={`rounded-lg px-6 py-4 shadow-lg backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-green-500/90 text-white' 
              : 'bg-red-500/90 text-white'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className="font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 hover:opacity-80"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign Delivery Partner Modal */}
      {showAssignModal && selectedOrderForAssign && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-800 m-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Delivery Partner</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignError(null);
                  setTempSelectedPartnerId(null);
                  setAssigningPartnerId(null);
                }}
                disabled={assigningPartner}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Order: <span className="font-semibold text-gray-900 dark:text-white">#{selectedOrderForAssign.orderId}</span>
              </p>
              
              {/* Inline Error Message */}
              {assignError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800 dark:text-red-200">{assignError}</p>
                  </div>
                </div>
              )}
              
              {/* Loading Overlay */}
              {assigningPartner && (
                <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Assigning delivery partner...</p>
                  </div>
                </div>
              )}
              
              {deliveryPartners.length === 0 ? (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">No delivery partners available</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {deliveryPartners.filter(partner => partner.status === 'Active').map((partner) => {
                      const isSelected = tempSelectedPartnerId === partner._id;
                      const isAssigning = assigningPartnerId === partner._id;
                      return (
                        <button
                          key={partner._id}
                          onClick={() => handleSelectPartner(partner._id)}
                          disabled={assigningPartner}
                          className={`w-full rounded-lg border-2 p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/40'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{partner.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{partner.phone || 'N/A'}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-1 text-xs ${
                                  partner.status === 'Active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                  {partner.status === 'Active' ? 'Available' : 'Busy'}
                                </span>
                                {partner.rating && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    ⭐ {partner.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                              {isAssigning && assigningPartner && (
                                <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">Assigning...</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-600">
                                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {isAssigning && assigningPartner ? (
                                <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : !isSelected && (
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Confirm Assignment Button */}
                  <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleConfirmAssignment}
                      disabled={!tempSelectedPartnerId || assigningPartner}
                      className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center justify-center gap-2"
                    >
                      {assigningPartner ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Assigning...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Confirm Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}