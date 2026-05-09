/**
 * WebUSB Thermal Printer Service
 * Direct USB communication with ESC/POS thermal printers
 * Requires Chrome/Edge with HTTPS
 */

export interface PrinterConfig {
  vendorId?: number;
  productId?: number;
  paperWidth?: 58 | 80; // mm
}

export interface ReceiptData {
  restaurantName: string;
  restaurantAddress: string;
  billType: string;
  orderId: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee?: number;
  total: number;
  specialInstructions?: string;
}

class ThermalPrinterService {
  private device: USBDevice | null = null;
  private endpoint: USBEndpoint | null = null;

  // ESC/POS Commands
  private readonly ESC = 0x1b;
  private readonly GS = 0x1d;
  
  private readonly CMD = {
    // Initialization
    INIT: [this.ESC, 0x40],
    
    // Text formatting
    ALIGN_LEFT: [this.ESC, 0x61, 0x00],
    ALIGN_CENTER: [this.ESC, 0x61, 0x01],
    ALIGN_RIGHT: [this.ESC, 0x61, 0x02],
    
    // Font size
    NORMAL: [this.ESC, 0x21, 0x00],
    DOUBLE_HEIGHT: [this.ESC, 0x21, 0x10],
    DOUBLE_WIDTH: [this.ESC, 0x21, 0x20],
    DOUBLE_SIZE: [this.ESC, 0x21, 0x30],
    
    // Font style
    BOLD_ON: [this.ESC, 0x45, 0x01],
    BOLD_OFF: [this.ESC, 0x45, 0x00],
    UNDERLINE_ON: [this.ESC, 0x2d, 0x01],
    UNDERLINE_OFF: [this.ESC, 0x2d, 0x00],
    
    // Paper
    LINE_FEED: [0x0a],
    CUT_PAPER: [this.GS, 0x56, 0x00],
    
    // Beep
    BEEP: [this.ESC, 0x42, 0x05, 0x09],
  };

  /**
   * Check if WebUSB is supported
   */
  isSupported(): boolean {
    return 'usb' in navigator;
  }

  /**
   * Request USB device access
   */
  async requestDevice(config: PrinterConfig = {}): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('WebUSB is not supported in this browser. Please use Chrome or Edge with HTTPS.');
    }

    try {
      // Filter for thermal printers (common vendor IDs)
      const filters: USBDeviceFilter[] = [];
      
      if (config.vendorId && config.productId) {
        filters.push({
          vendorId: config.vendorId,
          productId: config.productId,
        });
      } else {
        // Common thermal printer vendor IDs
        const commonVendors = [
          0x0416, // CITIZEN
          0x04b8, // EPSON
          0x0519, // STAR
          0x154f, // BIXOLON
          0x20d1, // RONGTA
          0x6868, // Generic thermal
        ];
        commonVendors.forEach(vendorId => {
          filters.push({ vendorId });
        });
      }

      this.device = await navigator.usb.requestDevice({ filters });
      
      if (!this.device) {
        throw new Error('No device selected');
      }

      await this.device.open();
      
      // Select configuration
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      // Claim interface (usually interface 0 for printers)
      await this.device.claimInterface(0);

      // Find OUT endpoint
      const iface = this.device.configuration?.interfaces[0];
      const alternate = iface?.alternates[0];
      this.endpoint = alternate?.endpoints.find(
        ep => ep.direction === 'out'
      ) || null;

      if (!this.endpoint) {
        throw new Error('Could not find printer endpoint');
      }

      return true;
    } catch (error: any) {
      console.error('❌ Failed to connect to printer:', error);
      throw new Error(`Printer connection failed: ${error.message}`);
    }
  }

  /**
   * Send raw bytes to printer
   */
  private async send(data: number[]): Promise<void> {
    if (!this.device || !this.endpoint) {
      throw new Error('Printer not connected. Please connect first.');
    }

    try {
      await this.device.transferOut(
        this.endpoint.endpointNumber,
        new Uint8Array(data)
      );
    } catch (error: any) {
      console.error('❌ Failed to send data to printer:', error);
      throw new Error(`Print failed: ${error.message}`);
    }
  }

  /**
   * Convert string to bytes (assumes Latin-1 encoding)
   */
  private textToBytes(text: string): number[] {
    return Array.from(text).map(char => char.charCodeAt(0));
  }

  /**
   * Print text with formatting
   */
  private async printLine(
    text: string,
    options: {
      align?: 'left' | 'center' | 'right';
      bold?: boolean;
      size?: 'normal' | 'double-height' | 'double-width' | 'double';
    } = {}
  ): Promise<void> {
    const commands: number[] = [];

    // Alignment
    if (options.align === 'center') {
      commands.push(...this.CMD.ALIGN_CENTER);
    } else if (options.align === 'right') {
      commands.push(...this.CMD.ALIGN_RIGHT);
    } else {
      commands.push(...this.CMD.ALIGN_LEFT);
    }

    // Size
    if (options.size === 'double') {
      commands.push(...this.CMD.DOUBLE_SIZE);
    } else if (options.size === 'double-height') {
      commands.push(...this.CMD.DOUBLE_HEIGHT);
    } else if (options.size === 'double-width') {
      commands.push(...this.CMD.DOUBLE_WIDTH);
    } else {
      commands.push(...this.CMD.NORMAL);
    }

    // Bold
    if (options.bold) {
      commands.push(...this.CMD.BOLD_ON);
    }

    // Text
    commands.push(...this.textToBytes(text));
    commands.push(...this.CMD.LINE_FEED);

    // Reset formatting
    if (options.bold) {
      commands.push(...this.CMD.BOLD_OFF);
    }
    commands.push(...this.CMD.NORMAL);
    commands.push(...this.CMD.ALIGN_LEFT);

    await this.send(commands);
  }

  /**
   * Print horizontal line
   */
  private async printDivider(): Promise<void> {
    await this.printLine('================================');
  }

  /**
   * Format currency
   */
  private formatPrice(amount: number): string {
    return `€${amount.toFixed(2)}`;
  }

  /**
   * Print receipt
   */
  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.device) {
      throw new Error('Printer not connected. Please connect first.');
    }

    try {
      // Initialize printer
      await this.send(this.CMD.INIT);

      // Header
      await this.printLine(data.restaurantName, {
        align: 'center',
        size: 'double-width',
        bold: true,
      });
      await this.printLine(data.restaurantAddress, { align: 'center' });
      await this.send(this.CMD.LINE_FEED);

      // Bill type
      await this.printLine(data.billType, {
        align: 'center',
        size: 'double-height',
        bold: true,
      });
      await this.printDivider();

      // Order info
      await this.printLine(`Order #: ${data.orderId}`, { bold: true });
      await this.printLine(`Date: ${data.date}`);
      await this.printDivider();

      // Items
      for (const item of data.items) {
        await this.printLine(item.name, { bold: true });
        const line = `  ${item.quantity} x ${this.formatPrice(item.price)} = ${this.formatPrice(
          item.quantity * item.price
        )}`;
        await this.printLine(line);
      }

      await this.printDivider();

      // Totals
      await this.printLine(
        `Subtotal:${' '.repeat(20 - data.subtotal.toString().length)}${this.formatPrice(data.subtotal)}`,
        { align: 'right' }
      );

      if (data.deliveryFee && data.deliveryFee > 0) {
        await this.printLine(
          `Delivery:${' '.repeat(20 - data.deliveryFee.toString().length)}${this.formatPrice(data.deliveryFee)}`,
          { align: 'right' }
        );
      }

      await this.printLine(
        `TOTAL:${' '.repeat(23 - data.total.toString().length)}${this.formatPrice(data.total)}`,
        { align: 'right', bold: true, size: 'double-height' }
      );

      await this.printDivider();

      // Special instructions
      if (data.specialInstructions) {
        await this.printLine('Special Instructions:', { bold: true });
        await this.printLine(data.specialInstructions);
        await this.printDivider();
      }

      // Footer
      await this.send(this.CMD.LINE_FEED);
      await this.printLine('Thank you!', { align: 'center', bold: true });
      await this.send(this.CMD.LINE_FEED);
      await this.send(this.CMD.LINE_FEED);
      await this.send(this.CMD.LINE_FEED);

      // Cut paper
      await this.send(this.CMD.CUT_PAPER);

      // Beep
      await this.send(this.CMD.BEEP);

    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        await this.device.close();
        this.device = null;
        this.endpoint = null;
      } catch (error) {
        console.error('❌ Error disconnecting:', error);
      }
    }
  }

  /**
   * Get connected device info
   */
  getDeviceInfo(): string | null {
    if (!this.device) return null;
    return `${this.device.manufacturerName || 'Unknown'} ${this.device.productName || 'Thermal Printer'}`;
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.device !== null;
  }
}

// Export singleton instance
export const thermalPrinter = new ThermalPrinterService();
