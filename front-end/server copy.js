const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Endpoint to generate image using Pollinations AI
app.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Received prompt:', prompt);
        
        // Using Pollinations AI direct image URL
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024`;
        console.log('Generated image URL:', imageUrl);
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
