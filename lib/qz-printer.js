import qz from 'qz-tray';

// Configuration for QZ Tray
const config = {
    // Certificate settings (if needed)
    certificatePromise: (resolve, reject) => {
        resolve("data:cert/pfx;base64,..."); // Add your certificate here if required
    },
    privateKeyPromise: (resolve, reject) => {
        resolve("data:private/key;base64,..."); // Add your private key here if required
    },
};

// Initialize QZ Tray with configs
export async function initializeQZTray() {
    try {
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
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