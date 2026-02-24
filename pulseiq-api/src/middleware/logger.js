/**
 * Middleware to log API request and response details
 */
const logger = (req, res, next) => {
    const start = Date.now();
    const { method, url, body, query, params } = req;

    console.log('\n' + '='.repeat(50));
    console.log(`📡 [${new Date().toISOString()}] REQUEST`);
    console.log(`Method: ${method}`);
    console.log(`URL: ${url}`);

    if (params && Object.keys(params).length > 0) {
        console.log('Params:', JSON.stringify(params, null, 2));
    }
    if (query && Object.keys(query).length > 0) {
        console.log('Query:', JSON.stringify(query, null, 2));
    }
    if (method !== 'GET' && body && Object.keys(body).length > 0) {
        console.log('Body:', JSON.stringify(body, null, 2));
    }

    // Capture the original send method
    const originalSend = res.send;

    // Override res.send to log the response
    res.send = function (data) {
        const duration = Date.now() - start;
        console.log('-'.repeat(50));
        console.log(`🏠 [${new Date().toISOString()}] RESPONSE (${duration}ms)`);
        console.log(`Status: ${res.statusCode}`);

        try {
            // Attempt to parse and log the response body if it's JSON
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            console.log('Response Body:', JSON.stringify(parsedData, null, 2));
        } catch (e) {
            // If it's not JSON, just log the raw data (trimmed if too long)
            const rawOutput = String(data);
            console.log('Response Body (raw):', rawOutput.length > 500 ? rawOutput.substring(0, 500) + '...' : rawOutput);
        }

        console.log('='.repeat(50) + '\n');

        // Call the original send method
        return originalSend.apply(res, arguments);
    };

    next();
};

module.exports = logger;
