const chatWindow = document.getElementById("chat-window");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let sessionId = localStorage.getItem("chatSessionId") || null;

// Utility to add messages
function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Start session
async function initSession() {
  if (!sessionId) {
    const resp = await fetch("/bot/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: crypto.randomUUID() })
    });
    const data = await resp.json();
    sessionId = data.sessionId;
    localStorage.setItem("chatSessionId", sessionId);
    addMessage("bot", data.message);
  } else {
    const resp = await fetch("/bot/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const data = await resp.json();
    addMessage("bot", data.message);
  }
}

// Send message to bot
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  chatInput.value = "";

  const resp = await fetch("/bot/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, text })
  });
  const data = await resp.json();

  if (data.reply) {
    addMessage("bot", data.reply);

    // Detect checkout
    if (text === "99" && data.reply.includes("Ready to checkout")) {
      // Step 1: Get current orderId (ask backend for pending order)
      const orderResp = await fetch("/bot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text: "97" }) // check current order
      });
      const orderData = await orderResp.json();

      // We need orderId from backend (simplify: backend should include it in "Ready to checkout" response)
      if (data.orderId) {
        startPaystack(data.orderId);
      } else {
        console.warn("OrderId missing from checkout response. Update backend to send it.");
      }
    }
  }
}

// Start Paystack payment flow
async function startPaystack(orderId) {
  try {
    const resp = await fetch("/paystack/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, orderId })
    });
    const data = await resp.json();

    if (data.authorization_url) {
      // Redirect to Paystack hosted checkout
      window.open(data.authorization_url, "_blank");
      addMessage("bot", "Redirecting you to Paystack for payment...");
    } else {
      addMessage("bot", "Payment init failed.");
    }
  } catch (err) {
    console.error(err);
    addMessage("bot", "Error starting payment.");
  }
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Init chat
initSession();
