import { NextResponse } from 'next/server'
import net from 'net'

/**
 * Network Printer API Endpoint
 * Sends raw ESC/POS commands to a network printer
 * 
 * POST /api/print
 * Body: { printerIP, printerPort, commands }
 */
export async function POST(request) {
  try {
    const { printerIP, printerPort = 9100, commands } = await request.json()

    if (!printerIP) {
      return NextResponse.json(
        { error: 'Printer IP address is required' },
        { status: 400 }
      )
    }

    if (!commands) {
      return NextResponse.json(
        { error: 'Print commands are required' },
        { status: 400 }
      )
    }

    // Send to network printer
    await sendToNetworkPrinter(printerIP, printerPort, commands)

    return NextResponse.json({
      success: true,
      message: 'Print job sent successfully'
    })
  } catch (error) {
    console.error('Network print error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to print',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Send ESC/POS commands to network printer via TCP socket
 */
function sendToNetworkPrinter(ip, port, commands) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    let timeout

    // Set connection timeout
    timeout = setTimeout(() => {
      client.destroy()
      reject(new Error('Printer connection timeout'))
    }, 5000)

    client.connect(port, ip, () => {
      clearTimeout(timeout)
      console.log(`Connected to printer at ${ip}:${port}`)
      
      // Send ESC/POS commands
      client.write(commands, (error) => {
        if (error) {
          reject(error)
        }
      })
    })

    client.on('data', (data) => {
      console.log('Printer response:', data.toString())
    })

    client.on('close', () => {
      console.log('Printer connection closed')
      resolve()
    })

    client.on('error', (error) => {
      clearTimeout(timeout)
      console.error('Printer socket error:', error)
      reject(error)
    })

    // Close connection after 2 seconds
    setTimeout(() => {
      client.end()
    }, 2000)
  })
}
