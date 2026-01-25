class KwikChatAccessibility {
    constructor() {
        this.isActive = false;
        this.recognition = null;
        this.currentUser = null;
        this.isListeningForMessage = false;
        this.tempRecognition = null;
        this.waitingForMenuResponse = false;
        this.init();
    }

    init() {
        this.createAccessibilityUI();
        this.setupKeyboardShortcut();
    }

    createAccessibilityUI() {
        const panel = document.getElementById('accessibilityPanel');
        const closeBtn = document.getElementById('closeAccessibilityPanel');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                panel.classList.remove('active');
            });
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const btn = document.getElementById('accessibilityBtn');
            if (!panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                document.getElementById('accessibilityBtn').click();
            }
        });
    }

    toggleAccessibility() {
        const btn = document.getElementById('accessibilityBtn');
        const statusText = document.getElementById('accessibilityStatusText');
        const indicator = document.querySelector('.indicator-dot');
        const feedback = document.getElementById('accessibilityFeedback');
        const panel = document.getElementById('accessibilityPanel');
        
        if (!this.isActive) {
            this.activateAccessibility();
        } else {
            this.deactivateAccessibility();
        }
    }

    activateAccessibility() {
        this.isActive = true;
        const btn = document.getElementById('accessibilityBtn');
        const statusText = document.getElementById('accessibilityStatusText');
        const indicator = document.querySelector('.indicator-dot');
        const feedback = document.getElementById('accessibilityFeedback');
        
        btn.classList.add('active');
        indicator.classList.add('active');
        statusText.textContent = 'Listening';
        feedback.textContent = 'Starting accessibility...';
        // Show the panel
        const panel = document.getElementById('accessibilityPanel');
        panel.classList.add('active');
        this.startListening();
        
        // Speak announcement after a short delay
        setTimeout(() => {
            this.speak("KwikChat's Accessibility turned on.");
            this.updateFeedback("Accessibility mode active");
            setTimeout(() => {
                this.askForMenu();
            }, 3000);
        }, 800);
    }

    deactivateAccessibility() {
        this.isActive = false;
        const btn = document.getElementById('accessibilityBtn');
        const statusText = document.getElementById('accessibilityStatusText');
        const indicator = document.querySelector('.indicator-dot');
        const feedback = document.getElementById('accessibilityFeedback');
        
        btn.classList.remove('active');
        indicator.classList.remove('active');
        statusText.textContent = 'Off';
        feedback.textContent = 'Accessibility turned off';

        this.stopListening();
        this.speak("Accessibility turned off.");
        
        this.waitingForMenuResponse = false;
    }

    askForMenu() {
        if (!this.isActive) return;
        
        this.updateFeedback("Open assistant menu?");
        this.speak("Would you like me to open the assistant menu? Say yes or no.");
        this.waitingForMenuResponse = true;
    }

    startListening() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.updateFeedback('Listening for commands...');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                this.updateFeedback(`Heard: ${transcript}`);
                this.processCommand(transcript.toLowerCase().trim());
            };
            
            this.recognition.onerror = (event) => {
                console.log('Recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.updateFeedback('Microphone access needed');
                }
            };
            
            this.recognition.onend = () => {
                if (this.isActive && !this.isListeningForMessage) {
                    setTimeout(() => {
                        this.recognition.start();
                    }, 100);
                }
            };
            
            this.recognition.start();
        } catch (error) {
            console.error('Voice recognition error:', error);
            this.updateFeedback('Voice not supported');
            this.speak("Voice recognition is not supported in your browser.");
        }
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        if (this.tempRecognition) {
            this.tempRecognition.stop();
        }
    }

    processCommand(command) {
        console.log('Processing command:', command);
        
        if (this.waitingForMenuResponse) {
            this.handleMenuResponse(command);
            return;
        }
        
        // TURN OFF COMMAND
        if (command.includes('turn off') || command.includes('off accessibility')) {
            this.speak("Turning off accessibility.");
            this.deactivateAccessibility();
            return;
        }
        
        // TYPE COMMAND
        if (command.includes('type') || command.includes('type message')) {
            this.startVoiceTyping();
        }
        // OPEN USER
        else if (command.includes('open') || command.includes('select')) {
            this.openUserByName(command);
        }
        // READ PREVIOUS MESSAGES
        else if (command.includes('read previous') || command.includes('read messages')) {
            this.readPreviousMessages();
        }
        // SEND MESSAGE
        else if (command.includes('send') || command.includes('send message')) {
            this.sendMessage();
        }
        // CLEAR
        else if (command.includes('clear') || command.includes('delete')) {
            this.clearInput();
        }
        // HELP
        else if (command.includes('help') || command.includes('menu')) {
            this.showMenu();
        }
        else {
            this.speak(`I heard: ${command}. Say 'menu' for help.`);
        }
    }

    handleMenuResponse(command) {
        this.waitingForMenuResponse = false;
        
        if (command.includes('yes') || command.includes('yeah')) {
            this.showMenu();
        } 
        else if (command.includes('no') || command.includes('not')) {
            this.speak("Okay. You can say 'menu' anytime for help.");
            this.updateFeedback('Ready for commands');
        }
        else {
            this.speak("Please say yes or no.");
            this.waitingForMenuResponse = true;
        }
    }

    showMenu() {
        const menuText = `
            I can help you with:
            Open a user - Say "Open John"
            Type a message - Say "Type"
            Send message - Say "Send"
            Read previous messages - Say "Read previous"
            Clear message - Say "Clear"
            Turn off - Say "Turn off"
        `;
        
        this.speak(menuText);
        this.updateFeedback("Showing available commands");
    }

    openUserByName(command) {
        let username = command.replace('open', '').replace('select', '').trim();
        
        if (!username) {
            this.speak("Please say a username. Example: Open John");
            return;
        }
        
        this.speak(`Opening chat with ${username}`);

        let found = false;
        const userLists = ['#recent-chats li', '#user-list li'];
        
        for (const selector of userLists) {
            const userItems = document.querySelectorAll(selector);
            for (const item of userItems) {
                const itemText = item.textContent.toLowerCase().trim();
                if (itemText.includes(username.toLowerCase())) {
                    item.click();
                    this.currentUser = item.textContent.trim();
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        
        if (found) {
            setTimeout(() => {
                this.focusInput();
                this.speak(`Chat with ${this.currentUser} is open. Say "type" to type your message.`);
            }, 1000);
        } else {
            this.speak(`User ${username} not found`);
        }
    }

    focusInput() {
        const inputField = document.getElementById('TxtMessage');
        if (inputField) {
            inputField.focus();
            return true;
        }
        return false;
    }

    startVoiceTyping() {
        this.speak("I'm listening for your message. Speak now.");
        if (!this.focusInput()) {
            this.speak("Please open a chat first by saying: Open username");
            return;
        }
        
        // Stop main recognition temporarily
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.isListeningForMessage = true;
        this.listenForMessageContent();
    }

    listenForMessageContent() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.tempRecognition = new SpeechRecognition();
            this.tempRecognition.continuous = false;
            this.tempRecognition.interimResults = false;
            this.tempRecognition.lang = 'en-US';
            this.tempRecognition.maxAlternatives = 1;
            
            this.tempRecognition.onresult = (event) => {
                const message = event.results[0][0].transcript;
                this.typeAndReadMessage(message);
            };
            
            this.tempRecognition.onend = () => {
                this.restartMainListening();
            };
            
            this.tempRecognition.start();
        } catch (error) {
            this.restartMainListening();
        }
    }

    typeAndReadMessage(message) {
        const inputField = document.getElementById('TxtMessage');
        if (inputField) {
            inputField.value = message;
            this.updateFeedback(`Typed: ${message}`);
            this.speak(`You typed: ${message}. Say "send" to send it.`);
            this.restartMainListening();
        }
    }


    readPreviousMessages() {
        const messageElements = document.querySelectorAll('.msg .msg-message');
        
        if (messageElements.length === 0) {
            this.speak("No messages in this chat.");
            return;
        }
        

        // Get last 3 messages
        const lastMessages = [];
        const startIndex = Math.max(0, messageElements.length - 3);
        
        for (let i = startIndex; i < messageElements.length; i++) {
            const msgElement = messageElements[i];
            const text = msgElement.textContent.trim();
            
            if (text && !text.startsWith('[')) {
                const parentMsg = msgElement.closest('.msg');
                const isSender = parentMsg.classList.contains('sender');
                const sender = isSender ? 'You' : (this.currentUser || 'Them');
                
                lastMessages.push({
                    text: text,
                    sender: sender
                });
            }
        }
        
        if (lastMessages.length === 0) {
            this.speak("No readable messages found.");
            return;
        }
        
        this.speak(`Reading ${lastMessages.length} messages:`);
        
        // Read messages one by one
        lastMessages.forEach((msg, index) => {
            setTimeout(() => {
                this.speak(`${msg.sender} said: ${msg.text}`, { noInterrupt: true });
            }, (index + 1) * 2000);
        });
    }

    sendMessage() {
        const sendButton = document.getElementById('send-button');
        const inputField = document.getElementById('TxtMessage');
        
        if (!sendButton) {
            this.speak("Send button not found");
            return;
        }
        
        if (!inputField || !inputField.value.trim()) {
            this.speak("No message to send. Say 'type' to type a message first.");
            return;
        }

        sendButton.click();
        
        if (this.currentUser) {
            this.speak(`Message sent to ${this.currentUser}`);
        } else {
            this.speak("Message sent");
        }
    }

    clearInput() {
        const inputField = document.getElementById('TxtMessage');
        if (inputField) {
            inputField.value = '';
            this.speak("Message cleared");
        }
    }

    restartMainListening() {
        this.isListeningForMessage = false;
        
        if (this.tempRecognition) {
            this.tempRecognition.stop();
        }
        
        if (this.isActive && this.recognition) {
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (e) {
                    console.log('Error restarting recognition:', e);
                }
            }, 500);
        }
    }
    

   speak(text, options = {}) {
    if (!this.isActive && !options.force) return;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Female voice 
        utterance.rate = 1.0;  
        utterance.pitch = 1.2;    
        utterance.volume = 0.9;   
        
        // Get  available voices
        const voices = window.speechSynthesis.getVoices();
        
        for (const voice of voices) {
            const name = voice.name.toLowerCase();
            if (name.includes('female') || name.includes('zira') || 
                name.includes('samantha') || name.includes('woman')) {
                utterance.voice = voice;
                break;
            }
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

    updateFeedback(text) {
        const feedback = document.getElementById('accessibilityFeedback');
        if (feedback) {
            feedback.textContent = text;
        }
    }
}

// Initialize when page loads
if (document.querySelector('.chat-area')) {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.kwikAccessibility = new KwikChatAccessibility();
            console.log('KwikChat Accessibility initialized');
        }, 1000);
    });
}