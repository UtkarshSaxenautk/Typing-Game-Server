const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

function getRandomNumber() {
  // Generate a random decimal number between 0 (inclusive) and 1 (exclusive)
  const randomDecimal = Math.random();

  // Multiply the random decimal number by 5 to get a number between 0 (inclusive) and 5 (exclusive)
  const randomBetween0And5 = randomDecimal * 5;

  // Take the floor of the result to get an integer between 0 and 4 (both inclusive)
  const randomNumber = Math.floor(randomBetween0And5);

  return randomNumber;
}

// Use the cors middleware for express app
app.use(cors());

const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
});

// Store connected clients and their selected difficulty levels
const clients = new Map();

io.on('connection', (socket) => {
  console.log('New client connected: ', socket.id);

  socket.on('select-difficulty', (difficulty) => {
    console.log("got : " , difficulty , " " , socket.id)
    // Store the client's selected difficulty level and other necessary data
    clients.set(socket.id, {
      difficulty,
      userInput: '',
      endTime: null,
      wpm: 0,
    });

    // Check if there's another player with the same difficulty level
    const matchedClient = [...clients.entries()].find(
      ([clientId, clientData]) => clientId !== socket.id && clientData.difficulty === difficulty
    );

    if (matchedClient) {
      // If a match is found, notify both players and remove them from the clients list
      const [matchedId, matchedData] = matchedClient;
      clients.delete(socket.id);
      clients.delete(matchedId);
      console.log('Match found:', socket.id, '->', matchedId);

      // Notify the players about the match and their matched difficulty
      const data = {dif : matchedData.difficulty , index : getRandomNumber()}
      socket.emit('matched-difficulty', data);
      io.to(matchedId).emit('matched-difficulty', data);
    } else {
      // If no match is found, keep waiting for another player
      console.log('Waiting for a match:', socket.id);
    }
  });

  // Your existing socket.io logic goes here

  socket.on('disconnect', () => {
    // Remove the client from the clients list upon disconnection
    console.log('Client disconnected:', socket.id);
    clients.delete(socket.id);
  });
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
