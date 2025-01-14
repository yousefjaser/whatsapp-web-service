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
const sessionDir = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(sessionDir)){
    fs.mkdirSync(sessionDir, { recursive: true });
}

// إعداد المجلدات الثابتة
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let client = null;

function createClient() {
    return new Client({
        authStrategy: new LocalAuth({
            clientId: "whatsapp-web-client",
            dataPath: sessionDir
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--disable-gpu'
            ]
        },
        restartOnAuthFail: true
    });
}

// معالجة الاتصال بـ Socket.IO
io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل');

    if (!client) {
        client = createClient();

        client.on('qr', async (qr) => {
            try {
                console.log('تم إنشاء رمز QR جديد');
                const qrImage = await qrcode.toDataURL(qr);
                io.emit('qr', qrImage);
            } catch (err) {
                console.error('خطأ في إنشاء رمز QR:', err);
            }
        });

        client.on('ready', () => {
            console.log('تم الاتصال بواتساب بنجاح');
            io.emit('ready', 'تم الاتصال بواتساب بنجاح!');
        });

        client.on('authenticated', (session) => {
            console.log('تم المصادقة وحفظ الجلسة');
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
            io.emit('error', 'تم قطع الاتصال. يرجى إعادة المحاولة');
        });

        try {
            console.log('جاري بدء الاتصال...');
            client.initialize().catch(err => {
                console.error('خطأ في التهيئة:', err);
                client = null;
            });
        } catch (error) {
            console.error('خطأ في التهيئة:', error);
            client = null;
        }
    } else {
        // إذا كان العميل موجوداً ومتصلاً، أرسل حالة "جاهز" مباشرة
        if (client.info) {
            socket.emit('ready', 'تم الاتصال بواتساب بنجاح!');
        }
    }

    // إعادة تحميل رمز QR
    socket.on('refresh', async () => {
        try {
            console.log('جاري إعادة تحميل الاتصال...');
            if (client) {
                await client.destroy();
            }
            client = createClient();
            await client.initialize();
        } catch (error) {
            console.error('خطأ في إعادة التحميل:', error);
            socket.emit('error', 'حدث خطأ في إعادة التحميل');
        }
    });
});

// معالجة الرسائل المباشرة
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!client || !client.info) {
        return res.status(403).json({ 
            success: false, 
            message: 'الرجاء الاتصال بواتساب أولاً' 
        });
    }
    
    try {
        const formattedNumber = phone.replace(/\D/g, '');
        const chat = await client.getChatById(formattedNumber + '@c.us');
        await chat.sendMessage(message);
        res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error);
        res.status(500).json({ success: false, message: 'حدث خطأ في إرسال الرسالة' });
    }
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

app.post('/api/send-file', async (req, res) => {
    const { phone, fileUrl, caption } = req.body;
    
    if (!client || !client.info) {
        return res.status(403).json({ 
            success: false, 
            message: 'WhatsApp client is not ready' 
        });
    }
    
    try {
        const formattedNumber = phone.replace(/\D/g, '');
        const chat = await client.getChatById(formattedNumber + '@c.us');
        const media = await MessageMedia.fromUrl(fileUrl);
        await chat.sendMessage(media, { caption: caption });
        res.json({ success: true, message: 'File sent successfully' });
    } catch (error) {
        console.error('Error sending file:', error);
        res.status(500).json({ success: false, message: 'Error sending file' });
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
