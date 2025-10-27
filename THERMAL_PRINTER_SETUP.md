# Thermal Printer Setup Guide

This guide explains how to set up silent printing (without browser dialog) for your POS system.

## Overview

The system supports **3 printing methods**:

1. **Browser Print** (Default) - Uses system print dialog
2. **Network Printer** (Recommended) - Direct TCP/IP printing, **no dialog**
3. **USB Printer (WebUSB)** - Direct USB printing, requires one-time permission

---

## Method 1: Browser Print (Default)

✅ **Works:** Everywhere  
❌ **Limitation:** Shows print dialog every time  

### To Minimize Dialog Clicks:

**Windows:**
1. Set your thermal printer as default in Windows Settings
2. In printer preferences, enable "Quick Print" or "Bypass print dialog"

**Chrome Settings:**
1. Go to `chrome://settings/printing`
2. Set your thermal printer as default
3. Disable "Show system dialog"

---

## Method 2: Network Printer (BEST for Production)

✅ **Works:** Any network-enabled thermal printer  
✅ **Silent:** NO print dialog  
✅ **Fast:** Direct ESC/POS commands  

### Setup Steps:

#### 1. Find Your Printer's IP Address

**Option A: From Printer Display Menu**
- Navigate to: Settings → Network → IP Address
- Note down the IP (e.g., `192.168.1.100`)

**Option B: Print Network Configuration**
- Most thermal printers have a test button
- Hold button while powering on to print config page
- IP address will be printed

**Option C: Router Admin Panel**
- Log into your router (usually `192.168.1.1`)
- Check connected devices list
- Find your printer (usually shows manufacturer name)

#### 2. Configure Printer Settings

Go to your POS settings page and configure:

```
Print Method: Network Printer
Printer IP: 192.168.1.100  (your printer's IP)
Printer Port: 9100          (default RAW port)
```

#### 3. Test Print

Click "Test Print" button to verify connection.

### Supported Printers:
- Epson TM series (TM-T20, TM-T82, TM-T88)
- Star Micronics TSP series
- Citizen CT-S series
- GOOJPRT, MUNBYN, HOIN (80mm thermal)
- Any ESC/POS compatible thermal printer

### Troubleshooting:

**Problem:** "Connection timeout"
- ✓ Check printer is ON
- ✓ Verify IP address is correct
- ✓ Ensure printer and computer are on same network
- ✓ Check firewall isn't blocking port 9100

**Problem:** "Print failed"
- ✓ Printer may not support ESC/POS (check manual)
- ✓ Try different port (9100, 515, or check printer manual)

---

## Method 3: USB Printer (WebUSB)

✅ **Works:** Chrome/Edge browsers only  
✅ **Silent:** After first permission grant  
⚠️ **Limitation:** Requires one-time user permission  

### Setup Steps:

#### 1. Check Browser Support
- Only Chrome/Edge 61+ support WebUSB
- Not supported: Firefox, Safari

#### 2. Connect USB Printer
- Connect thermal printer via USB
- Ensure drivers are installed (Windows/macOS)

#### 3. Configure Settings
```
Print Method: USB Printer (WebUSB)
```

#### 4. First Print
- Click print button
- Browser will show device selection popup
- Select your printer
- Click "Connect"
- Permission is remembered for this website

### Supported Printers:
- Most USB thermal printers with ESC/POS support
- Check compatibility at: https://github.com/NielsLeenheer/WebUSBReceiptPrinter

---

## Production Deployment Options

### Option A: Network Printer (Recommended)
**Best for:** Retail stores, restaurants, warehouses

**Pros:**
- ✅ True silent printing
- ✅ No browser limitations
- ✅ Multiple computers can share one printer
- ✅ Can place printer anywhere in network range

**Setup:**
1. Connect printer to WiFi or Ethernet
2. Note IP address
3. Configure in POS settings
4. Done!

### Option B: Electron Desktop App
**Best for:** Dedicated POS terminals

Convert your web app to desktop app for best printing experience:

```bash
npm install electron electron-builder
```

**Pros:**
- ✅ Full control over printing
- ✅ No browser restrictions
- ✅ Can print to USB/Serial/Network
- ✅ Professional POS experience

### Option C: Chrome Kiosk Mode
**Best for:** Budget solution

Run Chrome in kiosk mode with auto-print enabled:

```bash
chrome --kiosk --auto-open-devtools-for-tabs "http://localhost:3000/pos"
```

**Windows Registry Tweak for Silent Print:**
```reg
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Zones\3]
"1406"=dword:00000000
```

---

## Recommended Hardware

### Budget Setup ($50-100)
- **GOOJPRT PT-210** - 58mm thermal printer
- Network: WiFi or USB
- ESC/POS compatible

### Professional Setup ($150-300)
- **Epson TM-T20III** - 80mm thermal printer
- Network: Ethernet + USB
- Auto-cutter, reliable

### Premium Setup ($300-500)
- **Epson TM-T88VI** - 80mm thermal printer
- Network: Ethernet + WiFi + USB
- Fast printing, auto-cutter, cash drawer port

---

## Testing Checklist

- [ ] Printer is powered on
- [ ] Network cable/WiFi is connected
- [ ] IP address is correct
- [ ] Firewall allows port 9100
- [ ] Test print button works
- [ ] Actual sale prints correctly
- [ ] Receipt format looks good
- [ ] Loyalty points show correctly
- [ ] Auto-cutter works (if equipped)

---

## Common Issues & Solutions

### Issue: Print dialog still appears
**Solution:** You're using browser print method. Switch to network or WebUSB method.

### Issue: Printer not found on network
**Solutions:**
1. Check printer's network settings
2. Ensure static IP (or use DHCP reservation)
3. Try printer's hostname instead of IP
4. Check network subnet matches

### Issue: Garbled text / wrong characters
**Solutions:**
1. Verify printer supports ESC/POS
2. Check character encoding settings
3. Update printer firmware

### Issue: Paper doesn't cut
**Solution:** Enable "Auto Cut" in printer settings, or add cut command in code

---

## Support & Help

For technical support:
- Check printer manual for IP configuration
- Visit manufacturer's website for drivers
- Test with ESC/POS printer utility first
- Contact support with printer model and error message

---

## Quick Reference

| Method | Dialog? | Speed | Setup | Reliability |
|--------|---------|-------|-------|-------------|
| Browser | ❌ Yes | Slow | Easy | High |
| Network | ✅ No | Fast | Medium | Very High |
| WebUSB | ✅ No* | Fast | Easy | Medium |

*After first permission grant

**Recommendation:** Use **Network Printer** for production deployment.
