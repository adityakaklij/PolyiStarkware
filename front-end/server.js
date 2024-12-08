const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');  // Import cors package

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static('public'));

// Katana's local RPC URL
const katanaRPCUrl = 'http://localhost:5050'; // Default local RPC URL

// Contract address for your Dojo Engine smart contract
// const contractAddress = '0x0525177c8afe8680d7ad1da30ca183e482cfcd6404c1e09d83fd3fa2994fd4b8'; // Replace with your actual contract address
const contractAddress = '0x0525177c8afe8680d7ad1da30ca183e482cfcd6404c1e09d83fd3fa2994fd4b8'; // Replace with your actual contract address

// Proxy endpoint for `/move` and `/spawn` calls
app.post('/proxy', async (req, res) => {
    try {
        const { method, params } = req.body;

        const response = await axios.post(`${katanaRPCUrl}/invoke`, {
            method,
            params
        });

        res.json(response.data);  // Send the Katana response back to the frontend
    } catch (error) {
        console.error('Error in proxy:', error);
        res.status(500).json({ error: error.message });
    }
});

// Example: Player spawn endpoint
app.post('/spawn', async (req, res) => {
    try {
        const { playerAddress } = req.body;
        console.log('Spawning player with address:', playerAddress);

        // Make a request to Katana's RPC endpoint to invoke the 'spawn' function
        const response = await axios.post(`${katanaRPCUrl}/invoke`, {
            method: 'spawn',
            params: [playerAddress],  // Send player address as a parameter to the spawn function
        });

        console.log('Player spawn response:', response.data);
        res.json(response.data);  // Send the response back to the client
    } catch (error) {
        console.error('Error spawning player:', error);
        res.status(500).json({ error: error.message });
    }
});

// Example: Player move endpoint
app.post('/move', async (req, res) => {
    try {
        const { playerAddress, direction } = req.body;
        console.log('Moving player with address:', playerAddress, 'Direction:', direction);

        // Make a request to Katana's RPC endpoint to invoke the 'move' function
        const response = await axios.post(`${katanaRPCUrl}/invoke`, {
            method: 'move',
            params: [playerAddress, direction],  // Send player address and direction as parameters
        });

        console.log('Player move response:', response.data);
        res.json(response.data);  // Send the response back to the client
    } catch (error) {
        console.error('Error moving player:', error);
        res.status(500).json({ error: error.message });
    }
});

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
