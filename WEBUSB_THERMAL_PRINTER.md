# WebUSB Thermal Printer Integration

## Overview
This implementation provides **direct USB thermal printer communication** from the browser without requiring any desktop applications.

## Features
✅ **Direct USB Communication** - No electron app or backend needed  
✅ **ESC/POS Commands** - Full support for thermal printer features (cut, beep, formatting)  
✅ **Auto-fallback** - Falls back to browser print dialog if WebUSB unavailable  
✅ **Permission Prompt** - User-friendly device selection  
✅ **Works with most thermal printers** - Supports common brands (EPSON, Star, Bixolon, Rongta, etc.)

## Browser Compatibility
| Browser | Support |
|---------|---------|
| Chrome  | ✅ Yes  |
| Edge    | ✅ Yes  |
| Firefox | ❌ No   |
| Safari  | ❌ No   |

**Requirements:**
- Chrome/Edge browser (v61+)
- HTTPS connection (required for WebUSB API)
- USB thermal printer connected to the computer

## How It Works

### 1. User Flow
1. User clicks **"Print"** button on order management page
2. Dialog appears with two options:
   - **Option 1**: Direct USB thermal printer (recommended)
   - **Option 2**: Browser print dialog (fallback)
3. If user chooses Option 1:
   - Browser shows USB device picker
   - User selects their thermal printer
   - Receipt prints directly with automatic cut & beep
4. If user chooses Option 2 or WebUSB fails:
   - Falls back to standard browser print dialog

### 2. Supported Thermal Printers

The system automatically detects printers from these vendors:
- **CITIZEN** (0x0416)
- **EPSON** (0x04b8)
- **STAR** (0x0519)
- **BIXOLON** (0x154f)
- **RONGTA** (0x20d1)
- **Generic thermal printers** (0x6868)

Custom vendor/product IDs can be added in the code.

### 3. ESC/POS Commands

The service supports full ESC/POS command set:
- Text alignment (left, center, right)
- Font sizes (normal, double-width, double-height, double-size)
- Bold, underline formatting
- Paper cutting
- Beeper/buzzer
- Line feeds

## Implementation Files

### Core Files
```
newtiptop/src/
├── services/
│   └── thermal-printer.service.ts    # WebUSB thermal printer service
├── types/
│   └── webusb.d.ts                   # TypeScript declarations for WebUSB API
└── pages/
    └── Orders/
        └── OrderManagement.tsx        # Print button integration
```

### Key Functions

#### `thermal-printer.service.ts`
```typescript
// Check if WebUSB is supported
thermalPrinter.isSupported(): boolean

// Request permission and connect to printer
await thermalPrinter.requestDevice(config?: PrinterConfig): Promise<boolean>

// Print a receipt
await thermalPrinter.printReceipt(receiptData: ReceiptData): Promise<void>

// Check connection status
thermalPrinter.isConnected(): boolean

// Disconnect printer
await thermalPrinter.disconnect(): Promise<void>
```

## Usage Example

```typescript
import { thermalPrinter, type ReceiptData } from '../services/thermal-printer.service';

// Check if browser supports WebUSB
if (thermalPrinter.isSupported()) {
  // Connect to printer (shows USB device picker)
  await thermalPrinter.requestDevice();
  
  // Prepare receipt data
  const receiptData: ReceiptData = {
    restaurantName: 'THE TIP TOP',
    restaurantAddress: 'NEAR ASHIANA PG, LAW GATE, MAHERU, PHAGWARA',
    billType: '*** KITCHEN BILL ***',
    orderId: 'ORDER-12345',
    date: new Date().toLocaleString('en-IN'),
    items: [
      { name: 'Pizza Margherita', quantity: 2, price: 299 },
      { name: 'Cold Drink', quantity: 1, price: 50 }
    ],
    subtotal: 648,
    deliveryFee: 40,
    total: 688,
    specialInstructions: 'Extra cheese, less spicy'
  };
  
  // Print the receipt
  await thermalPrinter.printReceipt(receiptData);
  // ✅ Receipt printed with automatic cut & beep!
}
```

## Security Considerations

### HTTPS Required
WebUSB API only works over HTTPS connections. For local development:

**Option 1: Use localhost** (automatically trusted)
```bash
npm run dev -- --host localhost
```

**Option 2: Use HTTPS in development**
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update vite.config.ts
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    }
  }
})
```

**Option 3: Use ngrok/tunneling**
```bash
ngrok http 5173
# Access via https://<random>.ngrok.io
```

### Permissions
- User must explicitly grant USB device access
- Permission is requested each browser session
- No automatic reconnection (by design for security)

## Troubleshooting

### Issue: "WebUSB is not supported"
**Solution:** Use Chrome or Edge browser (v61+)

### Issue: "No device selected"
**Solution:** 
1. Ensure thermal printer is connected via USB
2. Check printer is powered on
3. Try unplugging and reconnecting

### Issue: "Could not find printer endpoint"
**Solution:**
1. Printer may not support USB protocol
2. Try restarting the printer
3. Check if printer needs driver mode switch

### Issue: "Print failed"
**Solution:**
1. Check printer paper
2. Verify printer is not in error state
3. Disconnect and reconnect printer
4. Try browser fallback (Option 2)

### Issue: "HTTPS required"
**Solution:** 
1. Access via `https://` URL
2. For local dev, use `localhost` instead of `127.0.0.1`
3. Or set up SSL certificate (see Security section)

## Testing

### Test on Localhost
```bash
cd newtiptop
npm run dev
```
Access via: `http://localhost:5173` (HTTPS not required for localhost)

### Test Print Flow
1. Navigate to **Orders > Order Management**
2. Click **"Print"** on any active order
3. Choose **"OK"** for thermal printer option
4. Select your USB thermal printer from the list
5. Receipt should print with automatic cut & beep

## Fallback Behavior

If WebUSB fails for any reason:
- **Automatic fallback** to browser print dialog (Option 5)
- Uses the existing iframe printing with 58mm thermal CSS
- User can still print via system print dialog

## Comparison: Option 3 vs Option 5

| Feature | Option 3 (WebUSB) | Option 5 (Browser) |
|---------|-------------------|-------------------|
| Print Dialog | ❌ No dialog | ✅ Shows dialog |
| Paper Cut | ✅ Automatic | ❌ Manual |
| Beep/Buzzer | ✅ Yes | ❌ No |
| HTTPS Required | ✅ Yes | ❌ No |
| Browser Support | Chrome/Edge only | All browsers |
| Setup | Permission once | Every print |
| ESC/POS | ✅ Full support | ❌ No ESC/POS |

## Production Deployment

### Checklist
- [ ] Deploy admin panel with HTTPS enabled
- [ ] Test with physical thermal printer
- [ ] Train staff on USB permission prompts
- [ ] Keep browser print (Option 5) as backup
- [ ] Monitor browser console for WebUSB errors
- [ ] Document supported printer models

### Recommended Setup
1. **Primary**: WebUSB direct printing (Option 3)
2. **Fallback**: Browser print dialog (Option 5)
3. **Backup**: Electron thermal app (if needed in future)

## Future Enhancements

- [ ] Add printer configuration UI (paper width, beep duration)
- [ ] Save printer preferences (vendor/product ID)
- [ ] Support for logos/images (raster graphics)
- [ ] QR code printing
- [ ] Multiple receipt copies
- [ ] Print queue for batch orders
- [ ] Offline printing support

## References

- [WebUSB API Specification](https://wicg.github.io/webusb/)
- [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/index.php)
- [Chrome WebUSB Guide](https://developer.chrome.com/articles/build-for-webusb/)
