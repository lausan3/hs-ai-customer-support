'use client'
import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hi, I'm the AlgoArchive support agent, how can I assist you today?`
  }]);

  const [message, setMessage] = useState('');


  // RAG: Give more context to the LLM for better search results.
  // Before sending the LLM a message, query a vector database for relevant embeddings related to the message.
  const sendMessage = async () => {
    setMessages([
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ]);

    setMessage('');

    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([...messages, {role: 'user', content: message}])
    }).then(async (res) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let result = '';
      return reader?.read().then(function processText({done, value}): any {
        if (done) { 
          return result 
        }

        const text = decoder.decode(value || new Int8Array(), { stream: true });

        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          
          console.log([
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text
            }
          ])

          return ([
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text
            }
          ])
        });

        // Continue reading the stream for chunks of text.
        return reader.read().then(processText);
      })
    });
  }

  const testEmbeddings = async () => {
    setMessage('');

    const response = await fetch("/api/rag", {
      method: "POST",
      body: JSON.stringify({ text: [message] })
    });

    console.log(response);
  }

  return (
    <main className="w-screen h-screen flex flex-col justify-center items-center bg-white">
      <div className="flex flex-col w-[600px] h-[700px] border border-black p-8 gap-8">
        <div id="messages-area" className="flex flex-col gap-8 flex-grow overflow-auto max-h-full">
          {
            messages.map((message, index) => {
              return  (
                <div key={index} className={`flex ${message.role === 'assistant' ? 'self-start' : 'self-end'}`}>
                  <div 
                    className=
                    {`${message.role === 'assistant' ? 'bg-blue-500' : 'bg-gray-400'} text-white rounded-2xl p-3`}
                  >
                    {message.content}
                  </div>
                </div>
              )
            })
          }
        </div>
        <div id="user-input-area" className="flex flex-row gap-2">
          <input 
            type="text"
            placeholder="Enter a message"
            className="w-full text-black p-5 rounded-2xl border border-black"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="bg-zinc-300 text-black p-5 rounded-2xl"
            onClick={sendMessage}
          >Send</button>
        </div>
      </div>
    </main>
  );
}
