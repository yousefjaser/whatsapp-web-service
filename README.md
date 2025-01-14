# WhatsApp Web API Service

A WhatsApp Web API service that allows sending messages and files through REST API endpoints.

## Features

- QR Code authentication with session persistence
- Send text messages via API
- Send files via URL through API
- Check connection status
- Support for multiple country codes
- Real-time connection status updates

## API Endpoints

### Send Message
```http
POST /api/send-message
Content-Type: application/json

{
    "phone": "1234567890",
    "message": "Hello, World!"
}
```

### Send File
```http
POST /api/send-file
Content-Type: application/json

{
    "phone": "1234567890",
    "fileUrl": "https://example.com/file.pdf",
    "caption": "Here's your file"
}
```

### Check Status
```http
GET /api/status
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/whatsapp-web-service.git
cd whatsapp-web-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## Deployment on Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the following environment variables:
   - `PORT`: The port number (optional, defaults to 3000)

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
```

## Dependencies

- Node.js
- Express
- whatsapp-web.js
- Socket.IO
- QRCode

## License

MIT
