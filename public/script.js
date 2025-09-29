const sessionId = 'demo-' + Date.now();
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

function appendMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Initialize session
fetch('/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId })
})
  .then(res => res.json())
  .then(data => appendMessage(data.message, 'bot'));

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  appendMessage(text, 'user');
  input.value = '';

  fetch('/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text })
  })
    .then(res => res.json())
    .then(data => appendMessage(data.reply, 'bot'))
    .catch(err => appendMessage('Error: ' + err.message, 'bot'));
}