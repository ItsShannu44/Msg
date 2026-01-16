/* ================= AI CHATBOT ASSISTANT ================= */

class ChatbotAssistant {
    constructor() {
        this.container = document.getElementById('chatbotContainer');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSend');
        this.micBtn = document.getElementById('chatbotMic');
        this.toggleBtn = document.getElementById('chatbotToggle');
        this.closeBtn = document.getElementById('chatbotClose');
        this.notificationBadge = document.getElementById('chatbotNotification');
        this.suggestionBtns = document.querySelectorAll('.suggestion-btn');
        
        this.isOpen = false;
        this.isListening = false;
        this.messageHistory = [];
        
        this.initialize();
    }
    
    initialize() {
        // Load chat history from localStorage
        this.loadHistory();
        
        // Event listeners
        this.toggleBtn.addEventListener('click', () => this.toggleChatbot());
        this.closeBtn.addEventListener('click', () => this.closeChatbot());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.micBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Suggestion buttons
        this.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.input.value = query;
                this.sendMessage();
            });
        });
        
        // Add welcome message if no history
        if (this.messageHistory.length === 0) {
            this.addWelcomeMessage();
        } else {
            this.renderHistory();
        }
        
        // Show notification badge
        this.showNotification();
    }
    
    toggleChatbot() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.container.classList.add('active');
            this.input.focus();
            this.hideNotification();
        } else {
            this.container.classList.remove('active');
        }
    }
    
    closeChatbot() {
        this.isOpen = false;
        this.container.classList.remove('active');
    }
    
    showNotification() {
        const hasSeen = localStorage.getItem('chatbotSeen');
        if (!hasSeen) {
            this.notificationBadge.style.display = 'flex';
            localStorage.setItem('chatbotSeen', 'true');
        }
    }
    
    hideNotification() {
        this.notificationBadge.style.display = 'none';
    }
    
    addWelcomeMessage() {
        const welcomeHtml = `
            <div class="chatbot-welcome">
                <h4>👋 Hello! I'm KwikChat Assistant</h4>
                <p>I'm here to help you with KwikChat features and answer your questions.</p>
                <p>Try asking me about:</p>
                <ul style="text-align: left; font-size: 13px; opacity: 0.8;">
                    <li>How to send messages</li>
                    <li>Changing themes and settings</li>
                    <li>Managing your chats</li>
                    <li>Voice features</li>
                    <li>Keyboard shortcuts</li>
                </ul>
            </div>
        `;
        this.messagesContainer.innerHTML = welcomeHtml;
    }
    
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.input.value = '';
        
        // Show typing indicator
        const typingMsg = this.showTypingIndicator();
        
        try {
            // Get bot response
            const response = await this.getBotResponse(message);
            
            // Remove typing indicator and add bot response
            typingMsg.remove();
            this.addMessage(response, 'bot');
            
            // Save to history
            this.saveToHistory(message, response);
            
        } catch (error) {
            console.error('Chatbot error:', error);
            typingMsg.remove();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}`;
        
        // Format code blocks if present
        let formattedText = text;
        if (text.includes('```')) {
            formattedText = this.formatCodeBlocks(text);
        }
        
        messageDiv.innerHTML = formattedText;
        this.messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    formatCodeBlocks(text) {
        return text.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<div class="code-block">${this.escapeHtml(code.trim())}</div>`;
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot typing';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span>Assistant is typing...</span>
        `;
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }
    
    async getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Define responses based on keywords
        const responses = {
            // Greetings
            'hello': "Hello! 👋 How can I help you with KwikChat today?",
            'hi': "Hi there! 😊 What can I assist you with?",
            'hey': "Hey! 👋 Need help with KwikChat features?",
            
            // About KwikChat
            'what is kwikchat': "KwikChat is a real-time messaging platform with features like voice messages, theme customization, bulk message deletion, and more!",
            'about kwikchat': "KwikChat offers secure messaging, customizable themes, voice recognition, and powerful chat management tools.",
            
            // Messaging
            'send message': "To send a message:\n1. Select a user from the recent chats or user list\n2. Type your message in the input box\n3. Press Enter or click the Send button\n\nYou can also use voice input by clicking the microphone button!",
            'how to send': "Simply type your message and press Enter or click the Send button. You can also use Ctrl+Enter for quick sending.",
            
            // Themes
            'change theme': "To change the theme:\n1. Click on the theme settings in the right panel\n2. Choose from 4 colors (Blue, Purple, Green, Orange)\n3. Toggle dark/light mode with the moon/sun icon\n4. Customize further with advanced settings",
            'theme': "You can customize:\n• Primary theme color\n• Chat background\n• Message bubble colors\n• Font settings\n• Message spacing",
            'dark mode': "Toggle dark mode by clicking the moon/sun icon in the top right corner. Your preference will be saved automatically.",
            
            // Messages Management
            'delete message': "You can delete messages in several ways:\n\n**Single message:**\n• Right-click on a message\n• Choose 'Delete for me' or 'Delete for everyone'\n\n**Multiple messages:**\n• Ctrl+Click to select multiple messages\n• Use the selection toolbar that appears\n• Choose to delete, copy, or clear selection\n\n**Bulk deletion:**\n• Press Ctrl+A to select all messages\n• Use delete options from the toolbar",
            'clear chat': "To clear an entire conversation:\n1. Click the three dots (⋮) in the chat header\n2. Select 'Clear Chat'\n3. Confirm the action",
            
            // Voice Features
            'voice': "Voice features in KwikChat:\n• Click the 'Start Voice' button to record\n• Speak clearly into your microphone\n• Voice messages are converted to text automatically\n• Supports multiple languages\n\nMake sure to allow microphone access when prompted!",
            'microphone': "For voice input:\n1. Click the microphone button\n2. Speak your message\n3. Click again or wait for auto-stop\n4. Review and send the transcribed text",
            
            // Keyboard Shortcuts
            'shortcut': "**Keyboard shortcuts:**\n• Ctrl+Enter: Send message\n• Ctrl+A: Select all messages\n• Ctrl+Click: Select multiple messages\n• Esc: Clear selection\n• Ctrl+D: Delete selected for me\n• Ctrl+Shift+D: Delete selected for everyone\n• Up/Down arrows: Navigate messages",
            'keyboard': "Use these shortcuts for faster chatting:\n• Enter: Send message\n• Ctrl+Z: Undo (while typing)\n• Ctrl+Y: Redo\n• Tab: Focus next input\n• Ctrl+F: Search in conversation",
            
            // Search
            'search': "Search features:\n• Use the search box in Recent Chats\n• Search within conversations using the search bar\n• Highlighted results show matching text\n• Click results to jump to messages",
            
            // Profile
            'profile': "Manage your profile:\n• Click your profile picture in top right\n• Upload a new profile picture\n• View your chat statistics\n• Manage account settings",
            
            // Help
            'help': "I can help you with:\n• Sending and managing messages\n• Customizing themes and appearance\n• Using voice features\n• Keyboard shortcuts\n• Search functionality\n• Profile management\n\nWhat would you like to know about?",
            'features': "KwikChat features include:\n• Real-time messaging\n• Voice-to-text input\n• Theme customization\n• Bulk message management\n• Search functionality\n• User status (online/offline)\n• Message deletion options\n• Keyboard shortcuts\n• Responsive design",
            
            // Error Handling
            'error': "Common issues and solutions:\n1. **Messages not sending:** Check internet connection\n2. **Voice not working:** Allow microphone access\n3. **Theme not saving:** Clear browser cache\n4. **Messages not loading:** Refresh the page\n\nTry refreshing or contact support if issues persist.",
            
            // Default response
            'default': "I'm here to help you with KwikChat! You can ask me about:\n\n• How to send messages\n• Changing themes and settings\n• Managing your chats\n• Voice features\n• Keyboard shortcuts\n• Search functionality\n\nWhat would you like to know? 😊"
        };
        
        // Find matching response
        for (const [keyword, response] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }
        
        // Check for specific patterns
        if (lowerMessage.includes('how to') || lowerMessage.includes('how do i')) {
            return "I can help you with that! Please be more specific about what you'd like to do in KwikChat.";
        }
        
        if (lowerMessage.includes('thank')) {
            return "You're welcome! 😊 Is there anything else I can help you with?";
        }
        
        // Return default response
        return responses.default;
    }
    
    toggleVoiceInput() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            this.addMessage("Voice recognition is not supported in your browser.", 'bot');
            return;
        }
        
        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }
    
    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.micBtn.classList.add('listening');
            this.input.placeholder = 'Listening...';
        };
        
        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            this.input.value = transcript;
        };
        
        this.recognition.onend = () => {
            this.stopVoiceRecognition();
            if (this.input.value.trim()) {
                this.sendMessage();
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.stopVoiceRecognition();
            this.addMessage('Voice recognition failed. Please try again.', 'bot');
        };
        
        this.recognition.start();
    }
    
    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.micBtn.classList.remove('listening');
        this.input.placeholder = 'Ask me anything...';
    }
    
    saveToHistory(userMessage, botResponse) {
        this.messageHistory.push({
            user: userMessage,
            bot: botResponse,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 messages
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(-50);
        }
        
        localStorage.setItem('chatbotHistory', JSON.stringify(this.messageHistory));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('chatbotHistory');
        if (saved) {
            try {
                this.messageHistory = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading chat history:', e);
                this.messageHistory = [];
            }
        }
    }
    
    renderHistory() {
        this.messagesContainer.innerHTML = '';
        this.addWelcomeMessage();
        
        this.messageHistory.forEach(msg => {
            this.addMessage(msg.user, 'user');
            this.addMessage(msg.bot, 'bot');
        });
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    // Utility method for external calls
    showHelp(topic) {
        this.toggleChatbot();
        setTimeout(() => {
            this.input.value = topic;
            this.sendMessage();
        }, 300);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new ChatbotAssistant();
    
    // Add help command to window for easy access
    window.showChatbotHelp = (topic) => {
        if (window.chatbot) {
            window.chatbot.showHelp(topic);
        }
    };
});

// Add help button to existing UI
function addHelpButtons() {
    // Add help button to settings dropdown
    const menuDropdown = document.querySelector('.menu-dropdown');
    if (menuDropdown) {
        const helpItem = document.createElement('a');
        helpItem.href = '#';
        helpItem.innerHTML = '<i class="fas fa-robot"></i> Chatbot Help';
        helpItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.chatbot) {
                window.chatbot.toggleChatbot();
            }
        });
        menuDropdown.appendChild(helpItem);
    }
    
    // Add help context to theme settings
    const themeSettingsExpand = document.getElementById('themeSettingsExpand');
    if (themeSettingsExpand) {
        const helpIcon = document.createElement('i');
        helpIcon.className = 'fas fa-question-circle';
        helpIcon.style.marginLeft = '10px';
        helpIcon.style.cursor = 'pointer';
        helpIcon.style.opacity = '0.7';
        helpIcon.title = 'Get help with theme settings';
        helpIcon.addEventListener('click', () => {
            if (window.chatbot) {
                window.chatbot.showHelp('How to change theme?');
            }
        });
        themeSettingsExpand.appendChild(helpIcon);
    }
}

// Call this function after DOM is loaded
document.addEventListener('DOMContentLoaded', addHelpButtons);


// Add this to your existing JavaScript file

// Helper function to get context for chatbot
function getChatContext() {
    return {
        currentRecipient: currentRecipientId ? document.getElementById('chat-with')?.textContent : 'None',
        currentTheme: document.body.getAttribute('data-theme') || 'blue',
        isDarkMode: document.body.classList.contains('dark-mode'),
        unreadMessages: document.querySelectorAll('#recent-chats .unread')?.length || 0,
        selectedMessages: selectedMessages ? selectedMessages.size : 0
    };
}

// Add context menu item for chatbot help
function addContextMenuHelp() {
    // Add to message context menu
    document.addEventListener('contextmenu', function(e) {
        const msg = e.target.closest('.msg');
        if (msg && !msg.classList.contains('deleted')) {
            // You can add context-specific help here
            setTimeout(() => {
                // Add help option if context menu exists
                const existingMenu = document.querySelector('.context-menu');
                if (existingMenu && window.chatbot) {
                    const helpOption = document.createElement('div');
                    helpOption.className = 'context-menu-item';
                    helpOption.innerHTML = '<i class="fas fa-robot"></i> Get Help';
                    helpOption.addEventListener('click', () => {
                        window.chatbot.showHelp('How to delete messages?');
                    });
                    existingMenu.appendChild(helpOption);
                }
            }, 10);
        }
    }, true);
}

// Add chatbot tips to voice recognition
function enhanceVoiceWithChatbot() {
    const originalVoiceStart = startVoiceButton?.onclick;
    if (startVoiceButton && window.chatbot) {
        startVoiceButton.addEventListener('click', function() {
            // If voice fails, suggest chatbot help
            setTimeout(() => {
                if (!isListening && window.chatbot) {
                    const message = 'Voice recognition seems to have failed. Need help?';
                    window.chatbot.addMessage(message, 'bot');
                }
            }, 3000);
        });
    }
}

// Initialize all integrations
document.addEventListener('DOMContentLoaded', function() {
    addContextMenuHelp();
    enhanceVoiceWithChatbot();
    
    // Make chatbot accessible via keyboard shortcut
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+H to open chatbot
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            if (window.chatbot) {
                window.chatbot.toggleChatbot();
            }
        }
        
        // F1 for help
        if (e.key === 'F1') {
            e.preventDefault();
            if (window.chatbot) {
                window.chatbot.showHelp('help');
            }
        }
    });
});