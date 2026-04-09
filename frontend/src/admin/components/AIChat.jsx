import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Terminal, Maximize2, Minimize2 } from 'lucide-react';

const AIChat = () => {
    const [isOpen, setIsOpen] = useState(() => {
        const saved = sessionStorage.getItem('duke_chat_open') === 'true';
        // Evitar apertura automática en móviles para no bloquear la UX inicial
        if (typeof window !== 'undefined' && window.innerWidth <= 768) return false;
        return saved;
    });
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('duke_chat_history');
        return saved ? JSON.parse(saved) : [
            { role: 'assistant', content: '¡Hola! Soy Duke Assist. ¿En qué puedo ayudarte hoy con el panel?' }
        ];
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        sessionStorage.setItem('duke_chat_history', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        sessionStorage.setItem('duke_chat_open', isOpen);
    }, [isOpen]);

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

    const renderMessage = (content) => {
        if (!content) return null;
        
        // Basic Markdown-like rendering
        // 1. Bold: **text** -> <strong>text</strong>
        let html = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // 2. Code blocks: ```text``` -> <pre>text</pre>
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="ai-chat-code">$1</pre>');
        // 3. Inline code: `text` -> <code>text</code>
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        // 4. Line breaks
        return <div dangerouslySetInnerHTML={{ __html: html.replace(/\n/g, '<br/>') }} />;
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
                <div className={`ai-chat-window ${isExpanded ? 'expanded' : ''}`}>
                    <header className="ai-chat-header">
                        <div className="header-info">
                            <Terminal size={18} color="var(--admin-primary)" />
                            <span>DUKE ASSIST v1.0 (Groq)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="header-action-btn" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Contraer" : "Pantalla Completa"}>
                                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            <button className="header-action-btn" onClick={() => { setIsOpen(false); setIsExpanded(false); }} title="Cerrar"><X size={20} /></button>
                        </div>
                    </header>

                    <div className="ai-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                <div className="message-bubble">
                                    {renderMessage(msg.content)}
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
