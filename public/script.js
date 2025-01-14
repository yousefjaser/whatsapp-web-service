document.addEventListener('DOMContentLoaded', () => {
    // إعداد Socket.IO
    const socket = io();
    
    // عناصر التبويبات
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // عناصر إرسال الرسائل المباشرة
    const countryCodeSelect = document.getElementById('countryCode');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const messageInput = document.getElementById('message');
    const sendButton = document.getElementById('sendButton');
    
    // عناصر رمز QR
    const qrCodeElement = document.getElementById('qr-code');
    const statusMessageElement = document.getElementById('status-message');
    const refreshQrButton = document.getElementById('refresh-qr');

    // التبديل بين التبويبات
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // تحديث حالة الأزرار
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // تحديث حالة المحتوى
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === `${tabId}-tab`) {
                    content.classList.remove('hidden');
                }
            });
        });
    });

    // معالجة أحداث Socket.IO
    socket.on('qr', (qrImage) => {
        qrCodeElement.innerHTML = `<img src="${qrImage}" alt="رمز QR">`;
        statusMessageElement.textContent = 'يرجى مسح رمز QR باستخدام هاتفك';
    });

    socket.on('ready', (message) => {
        statusMessageElement.textContent = message;
        qrCodeElement.innerHTML = '<div class="success-message">✓ تم الاتصال بنجاح</div>';
    });

    socket.on('error', (message) => {
        statusMessageElement.textContent = message;
    });

    // تحديث رمز QR
    refreshQrButton.addEventListener('click', () => {
        qrCodeElement.innerHTML = '<div class="loading">جاري التحميل...</div>';
        socket.emit('refresh');
    });

    // تنسيق رقم الهاتف أثناء الكتابة
    phoneNumberInput.addEventListener('input', (e) => {
        // إزالة أي حروف غير رقمية
        let number = e.target.value.replace(/\D/g, '');
        
        // تحديد الحد الأقصى 9 أرقام
        if (number.length > 9) {
            number = number.slice(0, 9);
        }
        
        // تحديث قيمة حقل الإدخال
        e.target.value = number;
    });

    // معالجة زر الإرسال المباشر
    sendButton.addEventListener('click', async () => {
        const countryCode = countryCodeSelect.value;
        const phoneNumber = phoneNumberInput.value;
        const message = messageInput.value;

        if (!phoneNumber) {
            alert('الرجاء إدخال رقم الهاتف');
            return;
        }

        try {
            const response = await fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: countryCode + phoneNumber,
                    message: message
                })
            });

            const data = await response.json();
            alert(data.message);

            if (data.success) {
                messageInput.value = '';
                phoneNumberInput.value = '';
            }
        } catch (error) {
            alert('حدث خطأ في إرسال الرسالة');
        }
    });
});
