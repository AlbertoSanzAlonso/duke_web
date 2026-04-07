import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Terminal } from 'lucide-react';

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '¡Hola! Soy Duke Assist. ¿En qué puedo ayudarte hoy con el panel?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const token = sessionStorage.getItem('duke_admin_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai-help/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ question: input })
            });

            const data = await response.json();
            if (data.answer) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            } else if (data.error) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el servidor.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ai-chat-wrapper">
            {/* Bubble Button */}
            {!isOpen && (
                <button className="ai-chat-bubble" onClick={() => setIsOpen(true)}>
                    <Bot size={24} />
                    <span className="bubble-text">Duke Assist</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-window">
                    <header className="ai-chat-header">
                        <div className="header-info">
                            <Terminal size={18} color="var(--admin-primary)" />
                            <span>DUKE ASSIST v1.0 (Groq)</span>
                        </div>
                        <button onClick={() => setIsOpen(false)}><X size={20} /></button>
                    </header>

                    <div className="ai-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                <div className="message-bubble">
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="ai-message assistant">
                                <div className="message-bubble loading">
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="ai-chat-input" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Pregunta algo..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AIChat;
