const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let chatHistory = [];

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required' });
    }

    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: "You are a reliable Citizen Service Chatbot. Respond accurately and helpfully by providing information and assistance strictly related to citizen services. Politely decline any queries beyond this scope. Communicate clearly and naturally, keeping responses concise yet informative." }] },
                    ...chatHistory
                ]
            })
        });

        const data = await response.json();
        console.log('Gemini API Response:', JSON.stringify(data, null, 2)); 

        const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (botResponse) {
            
            chatHistory.push({ role: 'model', parts: [{ text: botResponse }] });

            res.json({ reply: botResponse });
        } else {
            console.error('Unexpected API Response Structure:', data);
            res.status(500).json({ error: 'Invalid response from Gemini API', details: data });
        }
    } catch (error) {
        console.error('Error communicating with Gemini API:', error);
        res.status(500).json({ error: 'Failed to get a response from the therapy assistant' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
