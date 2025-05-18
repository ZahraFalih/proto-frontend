// src/components/dashboard/AIChatPanel.js
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import zahraAvatar from '../../styles/Avatars/zahra avatar.png';
import zahraAvatar2 from '../../styles/Avatars/zahraa Avatar 2.png';
import husseinAvatar from '../../styles/Avatars/hussein avatar.png';
import husseinAvatar2 from '../../styles/Avatars/hussein avatar 2.png';
import berrakAvatar from '../../styles/Avatars/berrak avatar.png';
import berrakAvatar2 from '../../styles/Avatars/berrak avatar 2.png';
import baranAvatar from '../../styles/Avatars/baran avatar.png';
import baranAvatar2 from '../../styles/Avatars/baran avatar 2.png';
import '../../styles/AIChatPanel.css';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';
import { fetchWithRetry, parseJsonResponse } from '../../utils/api';

// Randomly select assistant on component mount
const getRandomPersona = () => {
  const personas = ['zahra', 'hussein', 'berrak', 'baran'];
  const randomIndex = Math.floor(Math.random() * personas.length);
  return personas[randomIndex];
};

// Add timestamp to force image reload
const addTimestamp = (url) => `${url}?t=${new Date().getTime()}`;

// Main chat panel
const AIChatPanel = ({ context = {} }) => {
  // Track both current and previous persona to detect changes
  const [currentPersona, setCurrentPersona] = useState(getRandomPersona());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const { 
    summary         = 'No summary available', 
    roleMetrics     = {}, 
    businessMetrics = {}, 
    uba            = '',
    ui             = []
  } = context;

  // Log context updates for debugging
  useEffect(() => {
    console.log('[AIChatPanel] Received context:', {
      summary: summary ? 'Present' : 'Missing',
      roleMetrics: roleMetrics && Object.keys(roleMetrics).length ? 'Present' : 'Missing',
      businessMetrics: businessMetrics && Object.keys(businessMetrics).length ? 'Present' : 'Missing',
      uba: uba ? 'Present' : 'Missing',
      ui: Array.isArray(ui) && ui.length ? `${ui.length} items` : 'Missing'
    });
  }, [summary, roleMetrics, businessMetrics, uba, ui]);

  // Effect to handle persona changes
  useEffect(() => {
    // Clear assistant messages when persona changes
    setMessages(prev => prev.filter(msg => msg.sender === 'user'));
  }, [currentPersona]);

  // Effect to keep track of context updates - add system message when context changes
  useEffect(() => {
    console.log('[AIChatPanel] Context data updated - will be included in next message');
  }, [context]);

  // Pick new random persona and clear history
  const switchPersona = () => {
    const newPersona = getRandomPersona();
    setCurrentPersona(newPersona);
  };

  // Refresh persona on page load
  useEffect(() => {
    switchPersona();
  }, []);

  // Get current avatar based on persona
  const getAvatars = () => {
    switch(currentPersona) {
      case 'zahra':
        return {
          primary: zahraAvatar,
          secondary: zahraAvatar2,
          name: 'Zahra'
        };
      case 'hussein':
        return {
          primary: husseinAvatar,
          secondary: husseinAvatar2,
          name: 'Hussein'
        };
      case 'berrak':
        return {
          primary: berrakAvatar,
          secondary: berrakAvatar2,
          name: 'Berrak'
        };
      case 'baran':
        return {
          primary: baranAvatar,
          secondary: baranAvatar2,
          name: 'Baran'
        };
      default:
        return {
          primary: zahraAvatar,
          secondary: zahraAvatar2,
          name: 'Zahra'
        };
    }
  };

  const { primary: primaryAvatar, secondary: secondaryAvatar, name: assistantName } = getAvatars();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Simulate typing delay for AI
  const simulateTypingDelay = () => {
    return new Promise(resolve => {
      const minDelay = 500;
      const maxDelay = 1500;
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(resolve, delay);
    });
  };

  // Prepend context system message
  const formatMetrics = (metrics, label = '') => {
    if (!metrics || Object.keys(metrics).length === 0) {
      console.log(`[AIChatPanel] No ${label.toLowerCase()} metrics found`);
      return `No ${label.toLowerCase()} metrics available`;
    }
    
    // Get the first (and usually only) page's metrics
    const pageMetrics = Object.values(metrics)[0];
    if (!pageMetrics) {
      console.log(`[AIChatPanel] No page metrics found in ${label.toLowerCase()} metrics`);
      return `No ${label.toLowerCase()} metrics available`;
    }

    // Get role name if available (for role metrics only)
    const roleName = label === 'Role Model' ? `(${Object.keys(metrics)[0]})` : '';
    
    console.log(`[AIChatPanel] Formatting ${label} metrics with ${Object.keys(pageMetrics).length} entries`);
    return Object.entries(pageMetrics)
      .map(([metric, value]) => `  - ${metric}: ${value}`)
      .join('\n') + (roleName ? `\n  Role: ${roleName}` : '');
  };

  const formatUIEvaluation = (uiData) => {
    if (!uiData || !Array.isArray(uiData) || uiData.length === 0) {
      console.log('[AIChatPanel] No UI evaluation data found');
      return 'No UI evaluation data available';
    }

    console.log(`[AIChatPanel] Formatting UI evaluation with ${uiData.length} categories`);
    return uiData.map(category => (
      `  ${category.name} (${category.score}/10):\n    ${category.evidence}`
    )).join('\n\n');
  };

  const formatUBAAnalysis = (ubaText) => {
    if (!ubaText) {
      console.log('[AIChatPanel] No UBA analysis found');
      return 'No UBA analysis available';
    }
    
    // Split into paragraphs and format
    const paragraphs = ubaText.split('\n').filter(p => p.trim());
    console.log(`[AIChatPanel] Formatting UBA analysis with ${paragraphs.length} paragraphs`);
    return paragraphs.map((p, i) => `  ${i + 1}. ${p.trim()}`).join('\n');
  };

  const ctxContent = [
    'CONTEXT:',
    `Web Metrics Summary: ${context.summary || 'N/A'}`,
    '\nYour Business Metrics:',
    formatMetrics(context.businessMetrics, 'Business'),
    '\nRole Model Metrics:',
    formatMetrics(context.roleMetrics, 'Role Model'),
    '\nUser Behavior Analysis:',
    formatUBAAnalysis(context.uba),
    '\nUI Evaluation Scores & Analysis:',
    formatUIEvaluation(context.ui)
  ].join('\n');

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    console.log('[Chat] User says:', inputValue);
    console.log('[Chat] Context available for AI:', ctxContent.substring(0, 100) + '...');

    // Add user message
    const userMessage = { id: messages.length + 1, sender: 'user', text: inputValue };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInputValue('');
    setIsTyping(true);

    // Build messages array for backend
    const chatMessages = updated.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Add system message with context at the beginning
    const systemMessage = {
      role: 'system',
      content: ctxContent
    };

    // Construct payload
    const payload = {
      persona: currentPersona,
      messages: [systemMessage, ...chatMessages]
    };

    // Debug logging
    console.log('[Chat] Sending request:', {
      persona: payload.persona,
      messageCount: payload.messages.length,
      hasSystemMessage: !!payload.messages[0]?.role === 'system',
      messages: payload.messages
    });

    try {
      console.log('[Chat] Sending request to:', buildApiUrl(API_ENDPOINTS.AI.CHAT));
      const res = await fetchWithRetry(buildApiUrl(API_ENDPOINTS.AI.CHAT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        console.error('[Chat] API responded with error status:', res.status);
        throw new Error(`API responded with status ${res.status}`);
      }
      
      const data = await parseJsonResponse(res);
      console.log('[Chat] AI replies:', data);

      if (!data.reply) {
        console.error('[Chat] API response missing reply field:', data);
        throw new Error('Unexpected API response format');
      }

      await simulateTypingDelay();
      const aiMessage = { id: updated.length + 1, sender: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMessage]);
      inputRef.current?.focus();

    } catch (err) {
      console.error('[Chat] Error after retries:', err);
      setMessages(prev => [...prev, { 
        id: messages.length + 1, 
        sender: 'ai', 
        text: `I'm having trouble connecting right now. Please try again in a moment.`, 
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
      setIsSending(false);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-section-header">
        <h2>Still Have Some Questions?</h2>
        <p>You can ask one of our UX experts (or their AI clone)</p>
      </div>

      <div className="chat-panel">
        <div className="chat-header">
          <select 
            className="persona-selector-minimal"
            value={currentPersona}
            onChange={(e) => {
              setCurrentPersona(e.target.value);
              setMessages([]); // Clear all messages when changing persona
            }}
            title="Switch AI Assistant"
          >
            <option value="zahra">Zahra</option>
            <option value="hussein">Hussein</option>
            <option value="berrak">Berrak</option>
            <option value="baran">Baran</option>
          </select>
        </div>

        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.length === 0 ? (
            <WelcomeScreen 
              avatar={primaryAvatar} 
              name={assistantName} 
              persona={currentPersona} 
            />
          ) : (
            <>  
              {messages.map(msg => (
                <Message 
                  key={msg.id} 
                  message={msg} 
                  avatar={secondaryAvatar}
                  assistantName={assistantName}
                  persona={currentPersona}
                />
              ))}
              {isTyping && (
                <div className="message ai-message typing-message">
                  <div className="message-content">
                    <div className="message-avatar">
                      <img src={secondaryAvatar} alt={`${assistantName} Avatar`} />
                    </div>
                    <div className="message-bubble"><LoadingIndicator /></div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleSendMessage} autoComplete="off">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button type="submit" disabled={!inputValue.trim() || isSending} className={isSending ? 'sending' : ''}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Loading indicator for AI typing
const LoadingIndicator = () => (
  <div className="loading-indicator">
    <div className="loading-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

// Welcome screen component
const WelcomeScreen = ({ avatar, name, persona }) => (
  <div className="welcome-screen">
    <div className="welcome-content">
      <div className="welcome-avatar">
        <img 
          src={avatar} 
          alt={`${name} Avatar`}
          key={`welcome-${persona}`} 
        />
      </div>
      <div className="welcome-text">
        {(() => {
          switch(persona) {
            case 'zahra':
              return (
                <>
                  <h1>Hi. I'm {name}</h1>
                  <p>What do you want?</p>
                </>
              );
            case 'hussein':
              return (
                <>
                  <h1>Oh. hey, there..</h1>
                  <p>I'm Hussein, what can I do you?</p>
                </>
              );
            case 'berrak':
              return (
                <>
                  <h1>Merhaba!</h1>
                  <p>I'm Berrak. How can I assist you today?</p>
                </>
              );
            case 'baran':
              return (
                <>
                  <h1>Selam</h1>
                  <p>I'm Baran. How can I help?</p>
                </>
              );
            default:
              return (
                <>
                  <h1>Hello!</h1>
                  <p>How can I help you today?</p>
                </>
              );
          }
        })()}
      </div>
    </div>
  </div>
);

// Message component
const Message = ({ message, avatar, assistantName, persona }) => {
  const isAI = message.sender === 'ai';
  return (
    <div className={`message ${isAI ? 'ai-message' : 'user-message'} ${message.isError ? 'error-message' : ''}`}>
      <div className="message-content">
        {isAI && (
          <div className="message-avatar">
            <img 
              src={avatar} 
              alt={`${assistantName} Avatar`}
              key={`message-${message.id}-${persona}`}
            />
          </div>
        )}
        <div className="message-bubble">
          {isAI ? (
            <div className="message-text markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="message-text">
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
