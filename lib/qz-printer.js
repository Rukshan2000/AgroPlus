import qz from 'qz-tray';

// Initialize QZ Tray without certificate (for local development)
// For production, you should use proper certificates
export async function initializeQZTray() {
    try {
        // Set security for unsigned certificates (development only)
        qz.security.setCertificatePromise(function(resolve, reject) {
            resolve(); // Use default/unsigned for dev
        });

        qz.security.setSignaturePromise(function(toSign) {
            return function(resolve, reject) {
                resolve(); // Use default/unsigned for dev
            };
        });

        // Connect to QZ Tray
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect({ 
                retries: 5,
                delay: 1
            });
            console.log('✓ Connected to QZ Tray');
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize QZ Tray:', error);
        return false;
    }
}

// Get list of available printers
export async function getPrinters() {
    try {
        await initializeQZTray();
        return await qz.printers.find();
    } catch (error) {
        console.error('Failed to get printers:', error);
        return [];
    }
}

// Print raw commands (for ESC/POS printers)
export async function printRawCommands(printerName, commands) {
    try {
        await initializeQZTray();
        const config = qz.configs.create(printerName);
        return await qz.print(config, commands);
    } catch (error) {
        console.error('Failed to print:', error);
        throw error;
    }
}

// Print HTML content
export async function printHTML(printerName, htmlContent) {
    try {
        await initializeQZTray();
        const config = qz.configs.create(printerName, {
            rasterize: false,
            scaleContent: true,
            pixelPrecision: 2,
        });
        
        return await qz.print(config, [{
            type: 'html',
            format: 'plain',
            data: htmlContent
        }]);
    } catch (error) {
        console.error('Failed to print HTML:', error);
        throw error;
    }
}

// Disconnect from QZ Tray
export async function disconnectQZTray() {
    try {
        if (qz.websocket.isActive()) {
            await qz.websocket.disconnect();
        }
    } catch (error) {
        console.error('Failed to disconnect from QZ Tray:', error);
    }
}