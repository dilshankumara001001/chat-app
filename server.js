// server.js - Chat App in ONE file (No external files needed)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users
const users = {};

// Serve the full HTML page (CSS + JS inside)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>💬 Group Chat</title>
  <style>
    /* ----- ALL CSS ----- */
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
    body { background: #1a1a2e; height: 100vh; display: flex; justify-content: center; align-items: center; }
    #login-screen { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; }
    .login-box { background: #16213e; padding: 50px 40px; border-radius: 20px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.5); width: 400px; }
    .login-box h1 { color: #fff; font-size: 32px; margin-bottom: 10px; }
    .login-box p { color: #aaa; margin-bottom: 25px; }
    .login-box input { width: 100%; padding: 14px; border: none; border-radius: 10px; background: #0f3460; color: white; font-size: 16px; outline: none; margin-bottom: 15px; }
    .login-box input::placeholder { color: #888; }
    .login-box button { width: 100%; padding: 14px; border: none; border-radius: 10px; background: #e94560; color: white; font-size: 18px; font-weight: bold; cursor: pointer; transition: 0.3s; }
    .login-box button:hover { background: #c73652; transform: scale(1.02); }
    #chat-screen { width: 100%; height: 100vh; display: none; justify-content: center; align-items: center; background: #1a1a2e; }
    .chat-container { background: #16213e; width: 900px; max-width: 95%; height: 90vh; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
    .chat-header { background: #0f3460; padding: 18px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e94560; }
    .chat-header h2 { color: white; font-size: 22px; }
    .chat-header span { color: #aaa; font-size: 14px; background: #1a1a2e; padding: 5px 14px; border-radius: 20px; }
    .chat-body { display: flex; flex: 1; overflow: hidden; }
    .user-list { width: 200px; background: #0f3460; padding: 15px; border-right: 1px solid #1a1a2e; overflow-y: auto; }
    .user-list h4 { color: #aaa; font-size: 14px; margin-bottom: 15px; text-transform: uppercase; }
    .user-list ul { list-style: none; }
    .user-list ul li { color: #ddd; padding: 8px 12px; margin-bottom: 5px; background: #1a1a2e; border-radius: 8px; font-size: 14px; }
    .message-area { flex: 1; display: flex; flex-direction: column; background: #1a1a2e; }
    #messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    #messages .msg { max-width: 70%; padding: 10px 16px; border-radius: 18px; font-size: 15px; word-wrap: break-word; animation: fadeIn 0.3s; }
    #messages .msg-other { background: #0f3460; color: white; align-self: flex-start; border-bottom-left-radius: 4px; }
    #messages .msg-me { background: #e94560; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    #messages .msg-system { background: #2d2d44; color: #aaa; align-self: center; font-size: 13px; padding: 5px 18px; border-radius: 20px; font-style: italic; }
    #messages .msg .username { font-weight: bold; font-size: 13px; opacity: 0.8; display: block; margin-bottom: 3px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .message-input { display: flex; padding: 15px 20px; background: #0f3460; gap: 10px; border-top: 1px solid #1a1a2e; }
    .message-input input { flex: 1; padding: 12px 18px; border: none; border-radius: 30px; background: #1a1a2e; color: white; font-size: 16px; outline: none; }
    .message-input input::placeholder { color: #666; }
    .message-input button { padding: 12px 28px; border: none; border-radius: 30px; background: #e94560; color: white; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.3s; }
    .message-input button:hover { background: #c73652; }
  </style>
</head>
<body>

  <!-- LOGIN SCREEN -->
  <div id="login-screen">
    <div class="login-box">
      <h1>💬 Group Chat</h1>
      <p>Enter your name to join</p>
      <input type="text" id="username-input" placeholder="Your name...">
      <button id="join-btn">Join Chat</button>
    </div>
  </div>

  <!-- CHAT SCREEN -->
  <div id="chat-screen">
    <div class="chat-container">
      <div class="chat-header">
        <h2>💬 Group Chat</h2>
        <span id="online-count">0 online</span>
      </div>
      <div class="chat-body">
        <div class="user-list">
          <h4>👥 Online Users</h4>
          <ul id="user-list"></ul>
        </div>
        <div class="message-area">
          <div id="messages"></div>
          <div class="message-input">
            <input type="text" id="message-input" placeholder="Type a message...">
            <button id="send-btn">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script>
    // ----- ALL FRONTEND JAVASCRIPT (no backticks) -----
    const socket = io();
    let username = '';

    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const usernameInput = document.getElementById('username-input');
    const joinBtn = document.getElementById('join-btn');
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const userListUl = document.getElementById('user-list');
    const onlineCount = document.getElementById('online-count');

    joinBtn.addEventListener('click', () => {
      username = usernameInput.value.trim();
      if (username === '') { alert('Please enter your name!'); return; }
      loginScreen.style.display = 'none';
      chatScreen.style.display = 'flex';
      socket.emit('user-join', username);
    });
    usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') joinBtn.click(); });

    function sendMessage() {
      const text = messageInput.value.trim();
      if (text === '') return;
      socket.emit('send-message', text);
      messageInput.value = '';
      messageInput.focus();
    }
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    socket.on('message', (data) => {
      const { user, text } = data;
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('msg');
      if (user === 'System') {
        msgDiv.classList.add('msg-system');
        msgDiv.textContent = text;
      } else if (user === username) {
        msgDiv.classList.add('msg-me');
        msgDiv.innerHTML = '<span class="username">You</span>' + text;
      } else {
        msgDiv.classList.add('msg-other');
        msgDiv.innerHTML = '<span class="username">' + user + '</span>' + text;
      }
      messagesDiv.appendChild(msgDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    socket.on('user-list', (users) => {
      userListUl.innerHTML = '';
      users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = '🟢 ' + user;
        userListUl.appendChild(li);
      });
      onlineCount.textContent = users.length + ' online';
    });
  </script>
</body>
</html>
  `);
});

// ===== BACKEND SOCKET LOGIC (no backticks inside strings) =====
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-join', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('message', { 
      user: 'System', 
      text: username + ' joined the chat! 🎉' 
    });
    io.emit('user-list', Object.values(users));
  });

  socket.on('send-message', (message) => {
    const username = users[socket.id] || 'Anonymous';
    io.emit('message', { user: username, text: message });
  });

  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      io.emit('message', { 
        user: 'System', 
        text: username + ' left the chat. 👋' 
      });
      delete users[socket.id];
      io.emit('user-list', Object.values(users));
    }
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Chat server running at http://localhost:${PORT}`);
});