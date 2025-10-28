const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000; // Server sẽ chạy ở cổng 3000

app.use(cors());
app.use(bodyParser.json());

// --- CẤU HÌNH "BÍ KÍP" ---

// 1. Lấy API Key (Dán vào đây)
// TUYỆT ĐỐI BẢO MẬT KEY NÀY, đừng đưa lên Github
const API_KEY = 'process.env.API_KEY'; 

// 2. Đọc "Kho Báu" (Data Lễ hội)
const festivalData = fs.readFileSync('data.txt', 'utf-8');

// 3. Tạo "Lời Dặn Hệ thống" (System Prompt)
const systemPrompt = `
    Bạn là "Bot Lân", trợ lý ảo thân thiện, vui vẻ của Festival Hoa - Kiểng Sa Đéc 2025.
    Nhiệm vụ của bạn là CHỈ TRẢ LỜI các câu hỏi của du khách DỰA TRÊN thông tin được cung cấp dưới đây.
    
    [DỮ LIỆU CHÍNH THỨC CỦA LỄ HỘI]
    ${festivalData}
    [HẾT DỮ LIỆU]

    QUY TẮC BẮT BUỘC:
    1. Chỉ trả lời dựa vào dữ liệu trên.
    2. Nếu câu hỏi nằm ngoài phạm vi dữ liệu (ví dụ: hỏi về thời tiết, chính trị,...) hoặc không tìm thấy thông tin, hãy trả lời: "Xin lỗi, Bot Lân chỉ có thông tin về Festival Hoa thôi. Bạn có thể hỏi về lịch sự kiện, ăn uống, hoặc địa điểm nhé!"
    3. Trả lời ngắn gọn, rõ ràng, thân thiện.
    4. Không bịa đặt thông tin.
`;

// Khởi tạo "Siêu não" Gemini
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // Dùng model 'pro' ổn định hơn
// Tạo một phiên chat (để nó nhớ bối cảnh)
// Mình phải "mớm" cho nó trước là nó đồng ý với vai trò của mình
let chatSession;

async function initChat() {
    chatSession = model.startChat({
        history: [
            {
                role: 'user',
                parts: [{ text: systemPrompt }],
            },
            {
                role: 'model',
                parts: [{ text: 'Dạ rõ! Em là Bot Lân, trợ lý ảo Festival Hoa Sa Đéc. Em sẵn sàng trả lời các câu hỏi dựa trên thông tin được cung cấp!' }],
            },
        ],
        generationConfig: {
            // Cài đặt để nó bớt "sáng tạo"
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 500,
        },
    });
    console.log("Bot Lân đã sẵn sàng (Đã nạp System Prompt)!");
}

initChat(); // Khởi động chat ngay khi server chạy

// --- TẠO API ENDPOINT ---
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: 'Không có tin nhắn' });
        }

        console.log(`User hỏi: ${userMessage}`);

        // Gửi câu hỏi của user cho Gemini
        const result = await chatSession.sendMessage(userMessage);
        const botResponse = result.response.text();

        console.log(`Bot Lân rep: ${botResponse}`);
        
        // Trả lời cho Frontend
        res.json({ botResponse: botResponse });

    } catch (error) {
        console.error('Lỗi API Gemini:', error);
        res.status(500).json({ error: 'Bot Lân đang kẹt xe, bạn chờ chút nha!' });
    }
});

app.listen(port, () => {
    console.log(`Backend "Trái Tim" đang chạy tại http://localhost:${port}`);
});