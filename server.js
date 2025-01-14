const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// إنشاء مجلد لحفظ بيانات الجلسة
const SESSION_DIR = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(SESSION_DIR)){
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// إعداد المجلدات الثابتة
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let client = null;
let qrCodeData = null;

function createClient() {
    return new Client({
        authStrategy: new LocalAuth({
            clientId: "whatsapp-web-client",
            dataPath: SESSION_DIR
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-web-security'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
        },
        restartOnAuthFail: true,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0
    });
}

async function initializeClient() {
    try {
        if (!client) {
            client = createClient();

            client.on('qr', async (qr) => {
                try {
                    console.log('تم إنشاء رمز QR جديد');
                    qrCodeData = await qrcode.toDataURL(qr);
                    io.emit('qr', qrCodeData);
                } catch (err) {
                    console.error('خطأ في إنشاء رمز QR:', err);
                }
            });

            client.on('ready', () => {
                console.log('تم الاتصال بواتساب بنجاح');
                qrCodeData = null;
                io.emit('ready', 'تم الاتصال بواتساب بنجاح!');
            });

            client.on('authenticated', () => {
                console.log('تم المصادقة وحفظ الجلسة');
                qrCodeData = null;
                io.emit('authenticated', 'تم حفظ بيانات الجلسة بنجاح!');
            });

            client.on('auth_failure', (msg) => {
                console.error('فشل في المصادقة:', msg);
                io.emit('error', 'فشل في المصادقة');
            });

            client.on('disconnected', async (reason) => {
                console.log('تم قطع الاتصال:', reason);
                if (client) {
                    try {
                        await client.destroy();
                    } catch (error) {
                        console.error('خطأ في تدمير العميل:', error);
                    }
                }
                client = null;
                // محاولة إعادة الاتصال تلقائياً
                setTimeout(() => {
                    initializeClient();
                }, 5000);
            });

            await client.initialize();
        }
    } catch (error) {
        console.error('خطأ في التهيئة:', error);
        client = null;
        // محاولة إعادة التهيئة بعد فترة
        setTimeout(() => {
            initializeClient();
        }, 5000);
    }
}

// بدء تشغيل العميل عند بدء الخادم
initializeClient();

io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل');

    // إرسال رمز QR الحالي إذا كان موجوداً
    if (qrCodeData) {
        socket.emit('qr', qrCodeData);
    } else if (client && client.info) {
        socket.emit('ready', 'تم الاتصال بواتساب بنجاح!');
    }

    socket.on('refresh', async () => {
        try {
            console.log('جاري إعادة تحميل الاتصال...');
            if (client) {
                await client.destroy();
            }
            client = null;
            await initializeClient();
        } catch (error) {
            console.error('خطأ في إعادة التحميل:', error);
            socket.emit('error', 'حدث خطأ في إعادة التحميل');
        }
    });
});

// API Endpoints
app.post('/api/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!client || !client.info) {
        return res.status(403).json({ 
            success: false, 
            message: 'WhatsApp client is not ready' 
        });
    }
    
    try {
        const formattedNumber = phone.replace(/\D/g, '');
        const chat = await client.getChatById(formattedNumber + '@c.us');
        await chat.sendMessage(message);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: client && client.info ? 'connected' : 'disconnected',
        info: client ? client.info : null
    });
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
