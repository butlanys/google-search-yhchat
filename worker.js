addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('', { status: 200 });
  }

  try {
    const json = await request.json();
    const { content, chatId, chatType } = json.event.message;
    const { senderId } = json.event.sender;
    const { text } = content;
    const commandId = json.event.message.commandId;
    const botCommandId = parseInt(BOT_COMMAND_ID);

    let searchQuery = '';
    let recvId = '';
    let recvType = '';

    if (chatType === 'group' && commandId === botCommandId) {
      searchQuery = text;
      recvId = chatId;
      recvType = 'group';
    } else if (chatType !== 'group') {
      searchQuery = text;
      recvId = senderId;
      recvType = 'user';
    }

    if (searchQuery) {
      try {
        const encodedQuery = encodeURIComponent(searchQuery);
        const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodedQuery}`;
        const response = await fetch(googleApiUrl);
        const data = await response.json();

        let message = '';
        if (data.items && data.items.length > 0) {
          for (let i = 0; i < Math.min(data.items.length, 8); i++) {
            const item = data.items[i];
            message += `<a href="${item.link}">${item.title}</a><br>${item.snippet}<br><br>`;
          }
        } else {
          message = "未找到结果。";
        }
        await sendMessage(recvId, message, data.items && data.items.length > 0 ? "html" : "text", recvType);
      } catch (e) {}
    }

  } catch (e) {}

  return new Response('', { status: 200 });
}

async function sendMessage(recvId, content, contentType, recvType) {
  try {
    const token = YHCHAT_TOKEN;
    const url = `https://chat-go.jwzhd.com/open-apis/v1/bot/send?token=${token}`;
    const bodyContent = JSON.stringify({ recvId, recvType, contentType, content: { text: content } });
    const headers = { 'Content-Type': 'application/json' };
    await fetch(url, { method: 'POST', headers, body: bodyContent });
  } catch (e) {}
}
