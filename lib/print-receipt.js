'use client'

/**
 * Prints a rendered receipt element via a hidden 80mm iframe.
 *
 * Note on why this doesn't use `iframe.onload`: assigning onload *after*
 * `document.write()`/`close()` is a race — for a same-origin written document
 * the load event can fire before the handler is attached, so print() silently
 * never runs. Instead we close the document, wait for any images (the logo) to
 * settle, then print exactly once.
 *
 * @param {HTMLElement} element - the receipt node to print (its innerHTML is used)
 * @param {{ title?: string }} options
 * @returns {{ ok: boolean, error?: string }}
 */
export function printReceiptElement(element, { title = 'Receipt' } = {}) {
  if (!element) {
    return { ok: false, error: 'Receipt content not found' }
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    document.body.removeChild(iframe)
    return { ok: false, error: 'Could not open print frame' }
  }

  iframeDoc.open()
  iframeDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <style>
      @media print {
        @page { size: 80mm auto; margin: 0; }
        body { margin: 0; padding: 0; }
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        width: 80mm;
      }
      img { max-width: 100%; }
    </style>
  </head>
  <body>${element.innerHTML}</body>
</html>`)
  iframeDoc.close()

  let printed = false
  const doPrint = () => {
    if (printed) return
    printed = true
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe)
      }, 1000)
    }
  }

  // Wait for images (the logo) so they aren't missing from the printout,
  // with a timeout so a broken image can never block printing.
  const images = Array.from(iframeDoc.images || [])
  const pending = images.filter((img) => !img.complete)

  if (pending.length === 0) {
    doPrint()
  } else {
    let remaining = pending.length
    const settle = () => {
      remaining -= 1
      if (remaining <= 0) doPrint()
    }
    pending.forEach((img) => {
      img.addEventListener('load', settle, { once: true })
      img.addEventListener('error', settle, { once: true })
    })
    setTimeout(doPrint, 2000)
  }

  return { ok: true }
}
