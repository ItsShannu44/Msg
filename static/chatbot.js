/* ================= PREMIUM AI CHATBOT ASSISTANT ================= */

class PremiumChatbotAssistant {
    constructor() {
        this.container = document.getElementById('chatbotContainer');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSend');
        this.micBtn = document.getElementById('chatbotMic');
        this.launcher = document.getElementById('chatbotLauncher');
        this.closeBtn = document.getElementById('chatbotClose');
        this.clearBtn = document.getElementById('chatbotClear');
        this.settingsBtn = document.getElementById('chatbotSettings');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.isOpen = false;
        this.isListening = false;
        this.messageHistory = [];
        this.userPreferences = {};
        
        this.initialize();
        this.setupThemeIntegration();
        this.setupOutsideClickDetection();
        this.setupMobileResponsiveness();
    }
    
    initialize() {
        this.loadHistory();
        this.loadPreferences();
        
        // Event listeners - FIXED THIS LINE:
        this.launcher.addEventListener('click', () => this.toggleChatbot()); // FIXED: was this.toggle   ()
        this.closeBtn.addEventListener('click', () => this.closeChatbot());
        this.clearBtn.addEventListener('click', () => this.clearChat());
        this.settingsBtn.addEventListener('click', () => this.showSettings());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                this.input.value = query;
                this.sendMessage();
            });
        });
        
        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        document.getElementById('chatbotAttach').addEventListener('click', () => this.showAttachOptions());
        document.getElementById('chatbotEmoji').addEventListener('click', () => this.showEmojiPicker());
        
        this.showWelcomeMessage();

        this.checkForNotifications();
        
        this.container.addEventListener('transitionend', () => {
            if (this.isOpen) {
                this.input.focus();
            }
        });
    }
    
    setupOutsideClickDetection() {
        document.addEventListener('click', (e) => {
            // If chatbot is open
            if (this.isOpen) {
                // Check if click is outside chatbot container and not on launcher
                const isClickInsideChatbot = this.container.contains(e.target);
                const isClickOnLauncher = this.launcher.contains(e.target);
                
                // Close if click is outside AND not on launcher
                if (!isClickInsideChatbot && !isClickOnLauncher) {
                    this.closeChatbot();
                }
            }
        });
        
        // Prevent clicks inside chatbot from closing it
        this.container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    setupSmartSuggestionsScrolling() {
        const cardsContainer = document.querySelector('.suggestion-cards');
        const leftArrow = document.querySelector('.scroll-indicator.left');
        const rightArrow = document.querySelector('.scroll-indicator.right');
        
        if (cardsContainer && leftArrow && rightArrow) {
            leftArrow.addEventListener('click', () => {
                cardsContainer.scrollBy({ left: -150, behavior: 'smooth' });
            });
            
            rightArrow.addEventListener('click', () => {
                cardsContainer.scrollBy({ left: 150, behavior: 'smooth' });
            });
            
            const updateArrows = () => {
                const scrollLeft = cardsContainer.scrollLeft;
                const maxScroll = cardsContainer.scrollWidth - cardsContainer.clientWidth;
                
                leftArrow.style.opacity = scrollLeft > 0 ? '0.7' : '0.2';
                rightArrow.style.opacity = scrollLeft < maxScroll - 5 ? '0.7' : '0.2';
            };
            
            cardsContainer.addEventListener('scroll', updateArrows);
            updateArrows();
        }
    }


    setupThemeIntegration() {
        const observer = new MutationObserver(() => {
            this.updateThemeColors();
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });
        this.updateThemeColors();
    }
    
    updateThemeColors() {
        const style = getComputedStyle(document.body);
        const themeColor = style.getPropertyValue('--theme-color').trim();
        const themeGlow = style.getPropertyValue('--theme-glow').trim();
        
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 
                `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
                '20, 72, 144';
        };
        
        // Update RGB variables
        document.documentElement.style.setProperty('--theme-color-rgb', hexToRgb(themeColor));
        document.documentElement.style.setProperty('--theme-glow-rgb', hexToRgb(themeGlow));
    }
    
    toggleChatbot() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.classList.add('active');
            this.hideNotification();
            this.recordInteraction('open');
            this.showWelcomeMessage();
        } else {
            this.container.classList.remove('active');
        }
    }
    
    closeChatbot() {
        this.isOpen = false;
        this.container.classList.remove('active');
        this.showMinimizedHint();
    }
    
    showMinimizedHint() {
        // Add bounce animation to launcher
        this.launcher.style.animation = 'none';
        setTimeout(() => {
            this.launcher.style.animation = 'bounce 1s ease';
        }, 10);
    }
    
    showWelcomeMessage() {
        this.messagesContainer.innerHTML = ''; 
        const welcomeHtml = `
            <div class="welcome-card">
                <div class="welcome-icon">
                    <i class="fas fa-sparkles"></i>
                </div>
                <h4>Welcome to KwikAI! 🤖</h4>
                <p>Your intelligent assistant for KwikChat. I can help you with messaging, themes, shortcuts, and more!</p>
            </div>
        `;
        this.messagesContainer.innerHTML = welcomeHtml;
        // If there's history, add it after welcome message
        if (this.messageHistory.length > 0) {
            setTimeout(() => {
                this.renderHistory();
            }, 100);
        }
        this.scrollToBottom();
    }
    
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Simulate AI thinking with delay
            await this.delay(800 + Math.random() * 800);
            
            // Get response
            const response = await this.getEnhancedResponse(message);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response with typing effect
            await this.typeResponse(response);
            
            // Save to history
            this.saveToHistory(message, response);
            
            // Analyze for follow-up
            this.suggestFollowUp(message, response);
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            this.addMessage('Oops! I encountered an error. Please try again.', 'bot');
        }
    }
    
    async typeResponse(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot';
        this.messagesContainer.appendChild(messageDiv);
        
        // Type effect
        let displayedText = '';
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            displayedText += (i > 0 ? ' ' : '') + words[i];
            messageDiv.innerHTML = this.formatMessage(displayedText) + 
                                 `<span class="message-time">${this.getCurrentTime()}</span>`;
            
            await this.delay(30 + Math.random() * 50);
            this.scrollToBottom();
        }
        
        // Add timestamp
        messageDiv.innerHTML = this.formatMessage(text) + 
                             `<span class="message-time">${this.getCurrentTime()}</span>`;
    }
    
    formatMessage(text) {
        // Format code blocks
        text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre class="code-block"><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Format bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Format lists
        text = text.replace(/^\- (.*)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        return text;
    }
    
    async getEnhancedResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced response database
        const responses = {
            // Enhanced greetings
            'hello': "Hello there! 👋 I'm KwikAI, your personal assistant for KwikChat. How can I help you today?",
            'hi': "Hi! 😊 Ready to make your KwikChat experience even better? What would you like to know?",
            
            // Voice features with emojis
            'voice': "🎤 **Voice Features in KwikChat:**\n\n• Click the microphone button to start voice input\n• Speak clearly for accurate transcription\n• Supports multiple languages\n• Auto-detects when you stop speaking\n• Converts speech to text instantly\n\n💡 **Tip:** Use voice for quick messages when typing isn't convenient!",
            
            // Theme customization
            'theme': "🎨 **Theme Customization:**\n\n1. **Quick Colors:** Click any color circle in the right panel\n2. **Dark Mode:** Toggle with the moon/sun icon\n3. **Advanced Settings:** Expand 'More Settings' for:\n   • Chat backgrounds\n   • Message colors\n   • Bubble styles\n   • Font settings\n   • Message spacing\n\n✨ Your preferences are automatically saved!",
            
            // Keyboard shortcuts
            'shortcut': "⌨️ **Keyboard Shortcuts:**\n\n**Messaging:**\n• Enter: Send message\n• Shift+Enter: New line\n• Ctrl+Z: Undo typing\n\n**Navigation:**\n• Ctrl+K: Focus search\n• Tab: Next input\n• Esc: Close menus\n\n**Messages:**\n• Ctrl+Click: Select multiple\n• Ctrl+A: Select all\n• Delete: Remove selected\n\n💡 Press **F1** anytime for help!",
            
            // Bulk operations
            'bulk': "📦 **Bulk Message Operations:**\n\n**Selection Methods:**\n1. **Ctrl+Click:** Select individual messages\n2. **Shift+Click:** Select range\n3. **Ctrl+A:** Select all messages\n\n**Actions Available:**\n• Copy selected messages\n• Delete for yourself\n• Delete for everyone (your messages only)\n\n🔧 Use the toolbar that appears at the bottom!",
            
            // Default intelligent response
            'default': "I'd love to help you with that! 🤔 \n\nBased on your question, here are some topics I can assist with:\n\n🎤 **Voice Features** - How to use voice messages\n🎨 **Themes** - Customizing your chat appearance\n⌨️ **Shortcuts** - Keyboard tricks for speed\n📦 **Bulk Operations** - Managing multiple messages\n🔍 **Search** - Finding messages quickly\n\nWhich one interests you?"
        };
        
        // Smart matching with scoring
        const matches = [];
        for (const [keyword, response] of Object.entries(responses)) {
            const score = this.calculateMatchScore(lowerMessage, keyword);
            if (score > 0.3) {
                matches.push({ score, response });
            }
        }
        
        // Return best match or default
        if (matches.length > 0) {
            matches.sort((a, b) => b.score - a.score);
            return matches[0].response;
        }
        
        // Context-aware fallback
        if (lowerMessage.includes('how') || lowerMessage.includes('can i')) {
            return "Let me guide you through that! 🔍\n\nPlease tell me:\n1. What exactly you want to do\n2. Which feature you're using\n3. What you've already tried\n\nThis helps me give you the most accurate help!";
        }
        
        return responses.default;
    }
    
    calculateMatchScore(message, keyword) {
        let score = 0;
        
        // Exact match
        if (message === keyword) score += 2;
        
        // Contains keyword
        if (message.includes(keyword)) score += 1;
        
        // Word overlap
        const messageWords = new Set(message.split(/\s+/));
        const keywordWords = new Set(keyword.split(/\s+/));
        const overlap = [...keywordWords].filter(word => messageWords.has(word)).length;
        score += overlap * 0.5;
        
        return score;
    }
    
    showTypingIndicator() {
        this.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.classList.remove('active');
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        
        const formattedText = this.formatMessage(text);
        const time = this.getCurrentTime();
        
        messageDiv.innerHTML = `${formattedText}<span class="message-time">${time}</span>`;
        this.messagesContainer.appendChild(messageDiv);
        
        this.scrollToBottom();
        
        // Add animation
        messageDiv.style.animation = 'messageSlide 0.3s ease';
    }
    
    getCurrentTime() {
        return new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    async toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.addMessage("Voice recognition isn't supported in your browser. 😔", 'bot');
            return;
        }
        
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            await this.startVoiceRecognition();
        }
    }
    
    async startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 3;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.micBtn.classList.add('listening');
            this.input.placeholder = '🎤 Listening... Speak now!';
            this.addMessage("I'm listening... 🎤", 'bot');
        };
        
        this.recognition.onresult = (event) => {
            const results = Array.from(event.results);
            const lastResult = results[results.length - 1];
            
            if (lastResult.isFinal) {
                const transcript = lastResult[0].transcript;
                this.input.value = transcript.charAt(0).toUpperCase() + transcript.slice(1);
                
                // Auto-send if confident
                if (lastResult[0].confidence > 0.7) {
                    setTimeout(() => this.sendMessage(), 500);
                }
            }
        };
        
        this.recognition.onend = () => {
            this.stopVoiceRecognition();
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            this.stopVoiceRecognition();
            this.addMessage(`Voice recognition failed: ${event.error}. Try typing instead!`, 'bot');
        };
        
        try {
            this.recognition.start();
        } catch (error) {
            this.addMessage("Couldn't start voice recognition. Check your microphone permissions! 🔒", 'bot');
        }
    }
    
    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.micBtn.classList.remove('listening');
        this.input.placeholder = 'Ask KwikAI anything...';
    }
    
    handleQuickAction(action) {
        switch(action) {
            case 'voice-help':
                this.input.value = 'How to use voice messages?';
                this.sendMessage();
                break;
            case 'theme-help':
                this.input.value = 'How to customize themes?';
                this.sendMessage();
                break;
            case 'shortcuts':
                this.input.value = 'Show me keyboard shortcuts';
                this.sendMessage();
                break;
        }
    }
    
    suggestFollowUp(userMessage, botResponse) {
        // Analyze conversation for follow-up suggestions
        const suggestions = {
            'voice': 'Would you like to try voice input now?',
            'theme': 'Want to see a preview of different themes?',
            'shortcut': 'Shall I list all available shortcuts?',
            'delete': 'Need help with specific deletion scenarios?'
        };
        
        // Simple keyword matching for demo
        setTimeout(() => {
            for (const [keyword, suggestion] of Object.entries(suggestions)) {
                if (userMessage.toLowerCase().includes(keyword)) {
                    this.addFollowUpSuggestion(suggestion);
                    break;
                }
            }
        }, 1500);
    }
    
    addFollowUpSuggestion(text) {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'chatbot-message bot follow-up';
        suggestionDiv.innerHTML = `
            <div class="follow-up-suggestion">
                <p>${text}</p>
                <button class="follow-up-btn">Yes, please!</button>
                <button class="follow-up-btn">Maybe later</button>
            </div>
        `;
        
        this.messagesContainer.appendChild(suggestionDiv);
        this.scrollToBottom();
    }
    
    clearChat() {
        if (confirm('Clear all chat history with KwikAI?')) {
            this.messageHistory = [];
            localStorage.removeItem('kwikaiHistory');
            this.showWelcomeMessage();
            this.recordInteraction('clear');
        }
    }
    
    showSettings() {
        this.addMessage("Settings feature coming soon! ⚙️\n\nCurrently I save:\n• Chat history\n• Your preferences\n• Interaction patterns\n\nStay tuned for more!", 'bot');
    }
    
    showAttachOptions() {
        this.addMessage("File attachment coming soon! 📎\n\nIn future updates, you'll be able to:\n• Share images with me\n• Upload documents\n• Send screenshots\n\nI'll analyze and help you with them!", 'bot');
    }
    
    showEmojiPicker() {
        // Simple emoji suggestions
        const emojis = ['😊', '🚀', '🎯', '💡', '🌟', '🔥', '💯', '👏'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        this.input.value += randomEmoji;
        this.input.focus();
    }
    
    checkForNotifications() {
        const lastSeen = localStorage.getItem('kwikaiLastSeen');
        const now = Date.now();
        
        if (!lastSeen || now - lastSeen > 24 * 60 * 60 * 1000) {
            this.showNotification();
        }
        
        localStorage.setItem('kwikaiLastSeen', now);
    }
    
    
    saveToHistory(userMessage, botResponse) {
        this.messageHistory.push({
            user: userMessage,
            bot: botResponse,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 100 messages
        if (this.messageHistory.length > 100) {
            this.messageHistory = this.messageHistory.slice(-100);
        }
        
        localStorage.setItem('kwikaiHistory', JSON.stringify(this.messageHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('kwikaiHistory');
        if (saved) {
            try {
                this.messageHistory = JSON.parse(saved);
            } catch (e) {
                this.messageHistory = [];
            }
        }
    }
    
    loadPreferences() {
        const saved = localStorage.getItem('kwikaiPrefs');
        if (saved) {
            try {
                this.userPreferences = JSON.parse(saved);
            } catch (e) {
                this.userPreferences = {};
            }
        }
    }
    
    recordInteraction(type) {
        const interactions = JSON.parse(localStorage.getItem('kwikaiInteractions') || '[]');
        interactions.push({
            type,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('kwikaiInteractions', JSON.stringify(interactions));
    }
    
    renderHistory() {
        this.messageHistory.forEach(msg => {
            this.addMessage(msg.user, 'user');
            this.addMessage(msg.bot, 'bot');
        });
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public API for other parts of the app
    showHelp(topic) {
        this.toggleChatbot();
        setTimeout(() => {
            this.input.value = topic;
            this.sendMessage();
        }, 300);
    }
    
    announceFeature(feature, description) {
        if (this.isOpen) {
            this.addMessage(`🎉 **New Feature Alert!**\n\n**${feature}**\n${description}\n\nWant me to explain how it works?`, 'bot');
        } else {
            this.showNotification();
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.kwikAI = new PremiumChatbotAssistant();
    
    // Global helper function
    window.showKwikAIHelp = (topic) => {
        if (window.kwikAI) {
            window.kwikAI.showHelp(topic);
        }
    };
    
    // Add to existing UI
    integrateWithMainUI();
});

function integrateWithMainUI() {
    // Add help option to main menu
    const menuDropdown = document.querySelector('.menu-dropdown');
    if (menuDropdown) {
        const aiHelpItem = document.createElement('a');
        aiHelpItem.href = '#';
        aiHelpItem.className = 'ai-help-item';
        aiHelpItem.innerHTML = `
            <i class="fas fa-robot"></i>
            <span>KwikAI Assistant</span>
            <span class="menu-badge">NEW</span>
        `;
        aiHelpItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.kwikAI) {
                window.kwikAI.toggleChatbot();
            }
        });
        menuDropdown.appendChild(aiHelpItem);
    }
    
    
    // Keyboard shortcut: Ctrl+Shift+Space for AI
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
            e.preventDefault();
            if (window.kwikAI) {
                window.kwikAI.toggleChatbot();
            }
        }
        
        // F1 for context-aware help
        if (e.key === 'F1') {
            e.preventDefault();
            const context = getCurrentContext();
            if (window.kwikAI) {
                window.kwikAI.showHelp(context);
            }
        }
    });
}

function getCurrentContext() {
    // Determine what the user is doing
    if (document.querySelector('.theme-settings-panel.expanded')) {
        return 'How to customize themes?';
    }
    
    if (selectedMessages && selectedMessages.size > 0) {
        return 'How to manage selected messages?';
    }
    
    if (document.getElementById('startVoice').classList.contains('listening')) {
        return 'How to use voice features?';
    }
    
    return 'How can I help you with KwikChat?';
}

// Add CSS for integration
const integrationStyles = `
    .ai-help-item {
        position: relative;
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.1), transparent) !important;
        border-left: 3px solid var(--theme-color) !important;
    }
    
    .ai-help-item:hover {
        background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.2), transparent) !important;
    }
    
    .menu-badge {
        position: absolute;
        right: 10px;
        background: var(--theme-color);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        animation: pulse 2s infinite;
    }
    
    .ai-quick-btn {
        background: rgba(var(--theme-color-rgb), 0.1);
        border: 1px solid rgba(var(--theme-color-rgb), 0.2);
        color: var(--theme-color);
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        margin-right: 10px;
        transition: all 0.3s ease;
    }
    
    .ai-quick-btn:hover {
        background: rgba(var(--theme-color-rgb), 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .follow-up-suggestion {
        background: rgba(var(--theme-color-rgb), 0.05);
        border: 1px solid rgba(var(--theme-color-rgb), 0.1);
        border-radius: 10px;
        padding: 12px;
        margin-top: 10px;
    }
    
    .follow-up-btn {
        background: rgba(var(--theme-color-rgb), 0.1);
        border: 1px solid rgba(var(--theme-color-rgb), 0.2);
        color: var(--theme-color);
        border-radius: 6px;
        padding: 6px 12px;
        margin: 5px 5px 0 0;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s ease;
    }
    
    .follow-up-btn:hover {
        background: rgba(var(--theme-color-rgb), 0.2);
    }
    
    .code-block {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        padding: 12px;
        margin: 10px 0;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
    }
    
    .dark-mode .code-block {
        background: rgba(255, 255, 255, 0.05);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = integrationStyles;
document.head.appendChild(styleSheet);



