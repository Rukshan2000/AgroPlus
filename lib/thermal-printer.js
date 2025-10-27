/**
 * Thermal Printer Integration for POS
 * 
 * This module provides different methods for printing to thermal printers:
 * 1. ESC/POS via WebUSB (Chrome/Edge only)
 * 2. Network printer via raw socket
 * 3. Electron IPC for desktop apps
 */

// ESC/POS Commands
const ESC = '\x1B'
const GS = '\x1D'

const ESCPOS = {
  INIT: ESC + '@',
  ALIGN_CENTER: ESC + 'a' + '1',
  ALIGN_LEFT: ESC + 'a' + '0',
  ALIGN_RIGHT: ESC + 'a' + '2',
  BOLD_ON: ESC + 'E' + '1',
  BOLD_OFF: ESC + 'E' + '0',
  FONT_SMALL: ESC + 'M' + '1',
  FONT_NORMAL: ESC + 'M' + '0',
  FONT_LARGE: GS + '!' + '\x11', // Double height and width
  LINE_FEED: '\n',
  CUT_PAPER: GS + 'V' + '\x41' + '\x00',
  DRAWER_KICK: ESC + 'p' + '\x00' + '\x19' + '\xFA'
}

/**
 * Generate ESC/POS commands for receipt
 */
export function generateESCPOSReceipt(receiptData) {
  const { 
    storeName = 'AgroPlus',
    address = '',
    phone = '',
    saleId,
    date,
    items,
    subtotal,
    tax,
    total,
    payment,
    customer,
    loyaltyInfo
  } = receiptData

  let commands = ESCPOS.INIT

  // Header - Store Name
  commands += ESCPOS.ALIGN_CENTER
  commands += ESCPOS.FONT_LARGE
  commands += ESCPOS.BOLD_ON
  commands += storeName + ESCPOS.LINE_FEED
  commands += ESCPOS.BOLD_OFF
  commands += ESCPOS.FONT_NORMAL

  // Address and phone
  if (address) {
    commands += address + ESCPOS.LINE_FEED
  }
  if (phone) {
    commands += phone + ESCPOS.LINE_FEED
  }
  commands += ESCPOS.LINE_FEED

  // Receipt info
  commands += ESCPOS.ALIGN_LEFT
  commands += ESCPOS.FONT_SMALL
  commands += `Receipt: #${saleId}` + ESCPOS.LINE_FEED
  commands += `Date: ${date}` + ESCPOS.LINE_FEED
  commands += '--------------------------------' + ESCPOS.LINE_FEED

  // Customer info
  if (customer) {
    commands += ESCPOS.BOLD_ON
    commands += `Customer: ${customer.name}` + ESCPOS.LINE_FEED
    if (customer.phone) {
      commands += `Phone: ${customer.phone}` + ESCPOS.LINE_FEED
    }
    if (customer.loyalty_card_number) {
      commands += `Card: ${customer.loyalty_card_number}` + ESCPOS.LINE_FEED
    }
    commands += ESCPOS.BOLD_OFF
    commands += '--------------------------------' + ESCPOS.LINE_FEED
  }

  // Items
  commands += ESCPOS.FONT_NORMAL
  items.forEach(item => {
    const name = item.name.substring(0, 20).padEnd(20)
    const qty = `${item.quantity}x`.padStart(4)
    const price = `LKR ${item.total.toFixed(2)}`.padStart(10)
    commands += `${name}${qty}${price}` + ESCPOS.LINE_FEED
  })

  commands += '--------------------------------' + ESCPOS.LINE_FEED

  // Totals
  commands += `Subtotal:`.padEnd(24) + `LKR ${subtotal.toFixed(2)}`.padStart(10) + ESCPOS.LINE_FEED
  commands += `Tax:`.padEnd(24) + `LKR ${tax.toFixed(2)}`.padStart(10) + ESCPOS.LINE_FEED
  commands += ESCPOS.BOLD_ON
  commands += `TOTAL:`.padEnd(24) + `LKR ${total.toFixed(2)}`.padStart(10) + ESCPOS.LINE_FEED
  commands += ESCPOS.BOLD_OFF

  // Payment
  if (payment) {
    commands += '--------------------------------' + ESCPOS.LINE_FEED
    commands += `Paid:`.padEnd(24) + `LKR ${payment.paid.toFixed(2)}`.padStart(10) + ESCPOS.LINE_FEED
    commands += `Change:`.padEnd(24) + `LKR ${payment.change.toFixed(2)}`.padStart(10) + ESCPOS.LINE_FEED
  }

  // Loyalty info
  if (loyaltyInfo) {
    commands += '--------------------------------' + ESCPOS.LINE_FEED
    commands += ESCPOS.ALIGN_CENTER
    commands += ESCPOS.BOLD_ON
    commands += 'LOYALTY POINTS' + ESCPOS.LINE_FEED
    commands += ESCPOS.BOLD_OFF
    commands += ESCPOS.ALIGN_LEFT
    if (loyaltyInfo.pointsRedeemed > 0) {
      commands += `Points Used: -${loyaltyInfo.pointsRedeemed}` + ESCPOS.LINE_FEED
    }
    if (loyaltyInfo.pointsEarned > 0) {
      commands += `Points Earned: +${loyaltyInfo.pointsEarned}` + ESCPOS.LINE_FEED
    }
    commands += `New Balance: ${loyaltyInfo.newBalance} pts` + ESCPOS.LINE_FEED
  }

  // Footer
  commands += '--------------------------------' + ESCPOS.LINE_FEED
  commands += ESCPOS.ALIGN_CENTER
  commands += 'Thank you for shopping!' + ESCPOS.LINE_FEED
  commands += 'Please come again' + ESCPOS.LINE_FEED
  commands += ESCPOS.LINE_FEED
  commands += ESCPOS.LINE_FEED

  // Cut paper
  commands += ESCPOS.CUT_PAPER

  return commands
}

/**
 * Print via WebUSB (Chrome/Edge only)
 * Requires user permission and compatible USB printer
 */
export async function printViaWebUSB(receiptData) {
  try {
    // Check if WebUSB is supported
    if (!navigator.usb) {
      throw new Error('WebUSB is not supported in this browser')
    }

    // Request USB device (user must select printer)
    const device = await navigator.usb.requestDevice({
      filters: [
        { vendorId: 0x0483 }, // Common thermal printer vendor IDs
        { vendorId: 0x04b8 }, // Epson
        { vendorId: 0x0519 }, // Star Micronics
      ]
    })

    await device.open()
    await device.selectConfiguration(1)
    await device.claimInterface(0)

    // Generate ESC/POS commands
    const commands = generateESCPOSReceipt(receiptData)
    const encoder = new TextEncoder()
    const data = encoder.encode(commands)

    // Send to printer
    await device.transferOut(1, data)

    // Close device
    await device.close()

    return { success: true, method: 'WebUSB' }
  } catch (error) {
    console.error('WebUSB print error:', error)
    throw error
  }
}

/**
 * Print via Network Printer (requires backend proxy)
 * Send ESC/POS commands to network printer via server
 */
export async function printViaNetwork(receiptData, printerIP, printerPort = 9100) {
  try {
    const commands = generateESCPOSReceipt(receiptData)

    const response = await fetch('/api/print', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerIP,
        printerPort,
        commands
      })
    })

    if (!response.ok) {
      throw new Error('Network print failed')
    }

    return { success: true, method: 'Network' }
  } catch (error) {
    console.error('Network print error:', error)
    throw error
  }
}

/**
 * Print via Electron IPC (for desktop app)
 */
export async function printViaElectron(receiptData) {
  try {
    if (!window.electron) {
      throw new Error('Electron IPC not available')
    }

    const commands = generateESCPOSReceipt(receiptData)
    
    await window.electron.print({
      type: 'thermal',
      data: commands
    })

    return { success: true, method: 'Electron' }
  } catch (error) {
    console.error('Electron print error:', error)
    throw error
  }
}

/**
 * Auto-detect and print using best available method
 */
export async function printReceipt(receiptData, options = {}) {
  const {
    preferredMethod = 'auto',
    printerIP,
    printerPort = 9100,
    fallbackToBrowser = true
  } = options

  try {
    // Try preferred method first
    if (preferredMethod === 'webusb' && navigator.usb) {
      return await printViaWebUSB(receiptData)
    }
    
    if (preferredMethod === 'network' && printerIP) {
      return await printViaNetwork(receiptData, printerIP, printerPort)
    }
    
    if (preferredMethod === 'electron' && window.electron) {
      return await printViaElectron(receiptData)
    }

    // Auto-detect best method
    if (preferredMethod === 'auto') {
      // Try Electron first (best for desktop apps)
      if (window.electron) {
        return await printViaElectron(receiptData)
      }
      
      // Try network printer if IP is configured
      if (printerIP) {
        return await printViaNetwork(receiptData, printerIP, printerPort)
      }
      
      // Try WebUSB (requires user interaction)
      if (navigator.usb) {
        return await printViaWebUSB(receiptData)
      }
    }

    // Fallback to browser print
    if (fallbackToBrowser) {
      return { success: false, method: 'browser', message: 'Using browser print dialog' }
    }

    throw new Error('No printing method available')
  } catch (error) {
    console.error('Print error:', error)
    throw error
  }
}
