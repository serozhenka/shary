import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../peer";

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

const Chat: React.FC<ChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`chat-panel ${isOpen ? "open" : ""}`}>
      <div className="chat-container">
        <div className="chat-header">
          <h5 className="chat-title">
            <i className="bi bi-chat-dots me-2"></i>
            Чат у зустрічі
          </h5>
          <button
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary rounded-circle"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <i
                className="bi bi-chat-dots display-4 mb-3"
                style={{ opacity: 0.5 }}
              ></i>
              <p>Розпочніть розмову - повідомлення з'являться тут</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.isOwn ? "own-message" : ""}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">
                      {message.isOwn ? "Ви" : message.username}
                    </span>
                    <span className="message-time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="form-control chat-input"
              placeholder="Введіть повідомлення..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim()}
            >
              <i className="bi bi-send"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
