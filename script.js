let board;
let score = 0;

function init() {
    board = Array.from({ length: 4 }, () => Array(4).fill(0));
    score = 0;
    document.getElementById('score').innerText = score;
    generateTile();
    generateTile();
    render();
}

function generateTile() {
    let emptyTiles = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (board[r][c] === 0) {
                emptyTiles.push({ r, c });
            }
        }
    }
    if (emptyTiles.length > 0) {
        const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function render() {
    const tileContainer = document.querySelector('.tile-container');
    tileContainer.innerHTML = '';
    board.forEach(row => {
        row.forEach(value => {
            const tile = document.createElement('div');
            tile.classList.add('tile', `tile-${value}`);
            tile.innerText = value > 0 ? value : '';
            tileContainer.appendChild(tile);
        });
    });
}

function moveTile(from, to) {
    const tile = board[from.r][from.c];
    board[to.r][to.c] = tile;
    board[from.r][from.c] = 0;
    const tileElement = document.querySelector(`.tile-${tile}`);
    tileElement.classList.add('move');
    tileElement.style.transform = `translate(${(to.c - from.c) * 100}%, ${(to.r - from.r) * 100}%)`;
    setTimeout(() => {
        tileElement.classList.remove('move');
        render();
    }, 200);
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
        for (let r = 1; r < 4; r++) {
            if (board[r][c] !== 0) {
                let newRow = r;
                while (newRow > 0 && (board[newRow - 1][c] === 0 || board[newRow - 1][c] === board[r][c])) {
                    if (board[newRow - 1][c] === board[r][c]) {
                        score += board[newRow - 1][c];
                        document.getElementById('score').innerText = score;
                    }
                    moveTile({ r, c }, { r: newRow - 1, c });
                    newRow--;
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < 4; c++) {
        for (let r = 2; r >= 0; r--) {
            if (board[r][c] !== 0) {
                let newRow = r;
                while (newRow < 3 && (board[newRow + 1][c] === 0 || board[newRow + 1][c] === board[r][c])) {
                    if (board[newRow + 1][c] === board[r][c]) {
                        score += board[newRow + 1][c];
                        document.getElementById('score').innerText = score;
                    }
                    moveTile({ r, c }, { r: newRow + 1, c });
                    newRow++;
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
        for (let c = 1; c < 4; c++) {
            if (board[r][c] !== 0) {
                let newCol = c;
                while (newCol > 0 && (board[r][newCol - 1] === 0 || board[r][newCol - 1] === board[r][c])) {
                    if (board[r][newCol - 1] === board[r][c]) {
                        score += board[r][newCol - 1];
                        document.getElementById('score').innerText = score;
                    }
                    moveTile({ r, c }, { r, c: newCol - 1 });
                    newCol--;
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < 4; r++) {
        for (let c = 2; c >= 0; c--) {
            if (board[r][c] !== 0) {
                let newCol = c;
                while (newCol < 3 && (board[r][newCol + 1] === 0 || board[r][newCol + 1] === board[r][c])) {
                    if (board[r][newCol + 1] === board[r][c]) {
                        score += board[r][c]; 
                        document.getElementById('score').innerText = score;
                        board[r][newCol + 1] *= 2; 
                    }
                    moveTile({ r, c }, { r, c: newCol + 1 });
                    newCol++;
                    moved = true;
                }
            }
        }
    }
    return moved;
}

function moveTiles(direction) {
    let moved = false;
    if (direction === 'up') {
        moved = moveUp();
    } else if (direction === 'down') {
        moved = moveDown();
    } else if (direction === 'left') {
        moved = moveLeft();
    } else if (direction === 'right') {
        moved = moveRight();
    }
    if (moved) {
        generateTile();
        render();
    }
}

document.getElementById('restart').addEventListener('click', init);

document.addEventListener('DOMContentLoaded', () => {
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
    sendButton.addEventListener('click', () => {
        const countryCode = countryCodeSelect.value;
        const phoneNumber = phoneNumberInput.value;
        const message = messageInput.value;

        if (!phoneNumber) {
            alert('الرجاء إدخال رقم الهاتف');
            return;
        }

        // تنسيق رقم الهاتف وفقاً لمتطلبات واتساب
        const formattedNumber = countryCode + phoneNumber;
        
        // إنشاء رابط واتساب
        let whatsappUrl = `https://wa.me/${formattedNumber}`;
        
        // إضافة الرسالة إذا كانت موجودة
        if (message) {
            whatsappUrl += `?text=${encodeURIComponent(message)}`;
        }

        // فتح واتساب في نافذة جديدة
        window.open(whatsappUrl, '_blank');
    });

    // دالة لإنشاء رمز QR
    function generateQRCode() {
        // إنشاء رابط واتساب ويب عشوائي (هذا مثال فقط)
        const randomId = Math.random().toString(36).substring(7);
        const whatsappWebUrl = `https://web.whatsapp.com/connect/${randomId}`;
        
        // مسح المحتوى السابق
        qrCodeElement.innerHTML = '';
        
        // إنشاء رمز QR جديد
        new QRCode(qrCodeElement, {
            text: whatsappWebUrl,
            width: 256,
            height: 256,
            colorDark: "#128C7E",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // تحديث رمز QR عند الضغط على زر التحديث
    refreshQrButton.addEventListener('click', generateQRCode);

    // إنشاء رمز QR عند تحميل الصفحة
    generateQRCode();
});

window.onload = init;
