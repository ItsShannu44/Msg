/* ================= SPEECH RECOGNITION ================= */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    console.log("Speech Recognition API is available.");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const txtMessage = document.getElementById("TxtMessage");
    const startVoiceButton = document.getElementById("startVoice");
    let isListening = false;
    let previousText = "";

    recognition.onstart = () => {
        console.log("Voice recognition started...");
        txtMessage.placeholder = "Listening...";
        if (startVoiceButton) startVoiceButton.textContent = "Stop Voice";

        const voiceAnimation = document.getElementById("voiceAnimation");
        if (voiceAnimation) {
            voiceAnimation.classList.add("active");
        }

        previousText = txtMessage.value.trim();
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        recognition.stop();
        isListening = false;
        if (startVoiceButton) startVoiceButton.textContent = "Start Voice";

        const voiceAnimation = document.getElementById("voiceAnimation");
        if (voiceAnimation) {
            voiceAnimation.classList.remove("active");
        }

        txtMessage.placeholder = "Type a message...";
    };

    recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript.trim();
            transcript = transcript.charAt(0).toUpperCase() + transcript.slice(1);

            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript + " ";
            }
        }

        txtMessage.value =
            (previousText ? previousText + " " : "") +
            (finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
        console.log("Voice recognition stopped.");
        txtMessage.placeholder = "Type a message...";
        isListening = false;
        if (startVoiceButton) startVoiceButton.textContent = "Start Voice";

        const voiceAnimation = document.getElementById("voiceAnimation");
        if (voiceAnimation) {
            voiceAnimation.classList.remove("active");
        }
    };

    if (startVoiceButton) {
        startVoiceButton.addEventListener("click", () => {
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
                isListening = true;
            }
        });
    }
} else {
    console.error("Speech Recognition API is not supported in this browser.");
}

/* ================= THEME SETTINGS STATE ================= */
let themeSettings = {
    primaryColor: 'blue',
    chatBackground: {
        type: 'pattern1',
        url: '/static/Pattern_1.png',
        color: '',
        gradient: ''
    },
    messageColors: {
        sender: '#144890',
        receiver: '#dfdfdf',
        text: '#000000'
    },
    bubbleStyle: 'rounded',
    messageSpacing: 10,
    fontSettings: {
        family: 'Manrope, sans-serif',
        size: '16px'
    },
    darkMode: false
};

/* ================= BULK MESSAGE DELETION ================= */
let selectedMessages = new Map();
let selectionMode = false;
const toolbar = document.getElementById("selection-toolbar");

/* ================= DOM CONTENT LOADED ================= */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user agreement modal exists and initialize it
    if (document.getElementById('userAgreementModal')) {
        initializeAgreementModal();
    }
    
    // Initialize theme system
    initializeThemeSystem();
    
    // Load theme settings
    loadThemeSettings();
    
    // Initialize selection system
    initializeSelectionSystem();
    
    // Initialize other event listeners
    initializeEventListeners();
    
    // Initialize message sending if needed
    if (document.getElementById('sendButton')) {
        initializeMessageSending();
    }
});

/* ================= THEME SYSTEM FUNCTIONS ================= */

function initializeThemeSystem() {
    const toggleButton = document.querySelector('.dark-light');
    const colors = document.querySelectorAll('.color[data-theme="primary"]');
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('themeColor');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        colors.forEach(color => {
            color.classList.remove('selected'); 
            if (color.getAttribute('data-color') === savedTheme) {
                color.classList.add('selected');
            }
        });
    }

    // Load dark mode setting
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeSettings.darkMode = true;
        
        // Update dark-light toggle icon if it exists
        if (toggleButton) {
            const svg = toggleButton.querySelector('svg');
            if (svg) {
                svg.style.fill = 'white';
            }
        }
    }

    // Event listener for theme selection
    colors.forEach(color => {
        color.addEventListener('click', () => {
            colors.forEach(c => c.classList.remove('selected'));
            const theme = color.getAttribute('data-color');
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('themeColor', theme);
            color.classList.add('selected');
            themeSettings.primaryColor = theme;
            saveThemeSettings();
        });
    });

    // Event listener for dark/light mode toggle
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isNowDark = !document.body.classList.contains('dark-mode');
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isNowDark ? 'enabled' : 'disabled');
            themeSettings.darkMode = isNowDark;
            
            // Update icon
            const svg = toggleButton.querySelector('svg');
            if (svg) {
                svg.style.fill = isNowDark ? 'white' : '';
            }
            
            saveThemeSettings();
            
            // Update CSS variables for dark mode
            updateDarkModeCSS(isNowDark);
        });
    }
    
    // Initialize advanced theme system
    initializeAdvancedThemeSystem();
}

function updateDarkModeCSS(isDark) {
    const root = document.documentElement;
    if (isDark) {
        root.style.setProperty('--theme-bg-color', '#1a1a2e');
        root.style.setProperty('--theme-color', '#ffffff');
        root.style.setProperty('--message-text-color', '#ffffff');
        root.style.setProperty('--incoming-message-bg', '#2d2d44');
        root.style.setProperty('--outgoing-message-bg', '#0d6efd');
    } else {
        root.style.setProperty('--theme-bg-color', getComputedStyle(root).getPropertyValue('--light-theme-bg') || '#fafafa');
        root.style.setProperty('--theme-color', '#2c3e50');
        root.style.setProperty('--message-text-color', '#000000');
        root.style.setProperty('--incoming-message-bg', '#dfdfdf');
        root.style.setProperty('--outgoing-message-bg', '#144890');
    }
}

function initializeAdvancedThemeSystem() {
    const themeSettingsExpand = document.getElementById('themeSettingsExpand');
    const themeSettingsPanel = document.getElementById('themeSettingsPanel');
    
    if (!themeSettingsExpand || !themeSettingsPanel) {
        console.log('Theme settings elements not found');
        return;
    }

    const bgOptions = document.querySelectorAll('.bg-option');
    const bubbleOptions = document.querySelectorAll('.bubble-option');
    const colorPickers = document.querySelectorAll('.color-picker');
    const messageSpacingSlider = document.getElementById('messageSpacing');
    const spacingValue = document.getElementById('spacingValue');
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeSelect = document.getElementById('fontSize');
    const customBgOption = document.getElementById('customBgOption');
    const bgUpload = document.getElementById('bgUpload');
    const resetThemeBtn = document.getElementById('resetTheme');
    const saveThemeBtn = document.getElementById('saveTheme');
    const exportThemeBtn = document.getElementById('exportTheme');
    const importThemeBtn = document.getElementById('importTheme');
    const themeImportFile = document.getElementById('themeImportFile');

    // Toggle theme settings panel
    themeSettingsExpand.addEventListener('click', function() {
        themeSettingsPanel.classList.toggle('expanded');
        const icon = this.querySelector('i');
        if (themeSettingsPanel.classList.contains('expanded')) {
            icon.className = 'fas fa-chevron-up';
            this.innerHTML = '<i class="fas fa-chevron-up"></i> Less Settings';
        } else {
            icon.className = 'fas fa-chevron-down';
            this.innerHTML = '<i class="fas fa-chevron-down"></i> More Settings';
        }
    });

    // Background selection
    bgOptions.forEach(option => {
        option.addEventListener('click', function() {
            bgOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const bgType = this.dataset.bg;
            themeSettings.chatBackground.type = bgType;
            
            if (bgType === 'solid') {
                document.documentElement.style.setProperty('--chat-bg-image', 'none');
                document.documentElement.style.setProperty('--chat-bg-color', this.dataset.bgColor || 'var(--theme-bg-color)');
            } else if (bgType === 'gradient') {
                document.documentElement.style.setProperty('--chat-bg-image', 'none');
                document.documentElement.style.setProperty('--chat-bg-gradient', this.dataset.bgGradient);
                document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
            } else if (bgType === 'custom') {
                if (bgUpload) bgUpload.click();
            } else {
                document.documentElement.style.setProperty('--chat-bg-image', `url('${this.dataset.bgUrl}')`);
                document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
                document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
            }
            
            saveThemeSettings();
        });
    });

    // Custom background upload
    if (bgUpload) {
        bgUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const bgUrl = e.target.result;
                    document.documentElement.style.setProperty('--chat-bg-image', `url('${bgUrl}')`);
                    document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
                    document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
                    
                    if (customBgOption) {
                        const customPreview = customBgOption.querySelector('.bg-preview');
                        if (customPreview) {
                            customPreview.style.backgroundImage = `url('${bgUrl}')`;
                            customPreview.innerHTML = '';
                        }
                    }
                    
                    themeSettings.chatBackground.url = bgUrl;
                    themeSettings.chatBackground.type = 'custom';
                    saveThemeSettings();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Color pickers
    colorPickers.forEach(picker => {
        picker.addEventListener('input', function() {
            const color = this.value;
            const id = this.id;
            
            if (id === 'senderColor') {
                document.documentElement.style.setProperty('--sender-bubble-color', color);
                themeSettings.messageColors.sender = color;
            } else if (id === 'receiverColor') {
                document.documentElement.style.setProperty('--receiver-bubble-color', color);
                themeSettings.messageColors.receiver = color;
            } else if (id === 'textColor') {
                document.documentElement.style.setProperty('--message-text-color', color);
                themeSettings.messageColors.text = color;
            }
            
            saveThemeSettings();
        });
    });

    // Bubble style selection
    bubbleOptions.forEach(option => {
        option.addEventListener('click', function() {
            bubbleOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const style = this.dataset.bubble;
            themeSettings.bubbleStyle = style;
            
            if (style === 'rounded') {
                document.documentElement.style.setProperty('--bubble-border-radius', '20px');
            } else if (style === 'sharp') {
                document.documentElement.style.setProperty('--bubble-border-radius', '5px');
            } else if (style === 'modern') {
                document.documentElement.style.setProperty('--bubble-border-radius', '20px 5px 20px 20px');
            }
            
            saveThemeSettings();
        });
    });

    // Message spacing slider
    if (messageSpacingSlider && spacingValue) {
        messageSpacingSlider.addEventListener('input', function() {
            const value = this.value + 'px';
            spacingValue.textContent = value;
            document.documentElement.style.setProperty('--message-spacing', value);
            themeSettings.messageSpacing = parseInt(this.value);
            saveThemeSettings();
        });
    }

    // Font family selection
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', function() {
            const fontFamily = this.value;
            document.documentElement.style.setProperty('--selected-font-family', fontFamily);
            themeSettings.fontSettings.family = fontFamily;
            saveThemeSettings();
        });
    }

    // Font size selection
    if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', function() {
            const fontSize = this.value;
            document.documentElement.style.setProperty('--selected-font-size', fontSize);
            themeSettings.fontSettings.size = fontSize;
            saveThemeSettings();
        });
    }

    // Reset theme to default
    if (resetThemeBtn) {
        resetThemeBtn.addEventListener('click', function() {
            if (confirm('Reset all theme settings to default?')) {
                resetThemeSettings();
            }
        });
    }

    // Save theme
    if (saveThemeBtn) {
        saveThemeBtn.addEventListener('click', function() {
            saveThemeSettings();
            alert('Theme settings saved successfully!');
        });
    }

    // Export theme
    if (exportThemeBtn) {
        exportThemeBtn.addEventListener('click', function() {
            exportThemeSettings();
        });
    }

    // Import theme
    if (importThemeBtn) {
        importThemeBtn.addEventListener('click', function() {
            if (themeImportFile) themeImportFile.click();
        });
    }

    if (themeImportFile) {
        themeImportFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const importedTheme = JSON.parse(e.target.result);
                        applyImportedTheme(importedTheme);
                        saveThemeSettings();
                        alert('Theme imported successfully!');
                    } catch (error) {
                        alert('Error importing theme. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            }
        });
    }
}

function loadThemeSettings() {
    const savedTheme = localStorage.getItem('chatThemeSettings');
    if (savedTheme) {
        try {
            themeSettings = JSON.parse(savedTheme);
            applyThemeSettings();
            updateUIFromSettings();
        } catch (error) {
            console.error('Error loading theme settings:', error);
        }
    }
}

function applyThemeSettings() {
    // Apply primary theme color
    document.body.setAttribute('data-theme', themeSettings.primaryColor);
    
    // Apply chat background
    const bg = themeSettings.chatBackground;
    if (bg.type === 'solid') {
        document.documentElement.style.setProperty('--chat-bg-image', 'none');
        document.documentElement.style.setProperty('--chat-bg-color', bg.color || 'var(--theme-bg-color)');
    } else if (bg.type === 'gradient') {
        document.documentElement.style.setProperty('--chat-bg-image', 'none');
        document.documentElement.style.setProperty('--chat-bg-gradient', bg.gradient || 'none');
        document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
    } else if (bg.type === 'custom') {
        document.documentElement.style.setProperty('--chat-bg-image', `url('${bg.url}')`);
        document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
        document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
    } else {
        document.documentElement.style.setProperty('--chat-bg-image', `url('${bg.url}')`);
        document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
        document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
    }
    
    // Apply message colors
    const colors = themeSettings.messageColors;
    document.documentElement.style.setProperty('--sender-bubble-color', colors.sender);
    document.documentElement.style.setProperty('--receiver-bubble-color', colors.receiver);
    document.documentElement.style.setProperty('--message-text-color', colors.text);
    
    // Apply bubble style
    const style = themeSettings.bubbleStyle;
    if (style === 'rounded') {
        document.documentElement.style.setProperty('--bubble-border-radius', '20px');
    } else if (style === 'sharp') {
        document.documentElement.style.setProperty('--bubble-border-radius', '5px');
    } else if (style === 'modern') {
        document.documentElement.style.setProperty('--bubble-border-radius', '20px 5px 20px 20px');
    }
    
    // Apply message spacing
    document.documentElement.style.setProperty('--message-spacing', themeSettings.messageSpacing + 'px');
    
    // Apply font settings
    document.documentElement.style.setProperty('--selected-font-family', themeSettings.fontSettings.family);
    document.documentElement.style.setProperty('--selected-font-size', themeSettings.fontSettings.size);
    
    // Apply dark mode
    if (themeSettings.darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeCSS(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateDarkModeCSS(false);
    }
}

function updateUIFromSettings() {
    // Update color pickers
    const senderColorPicker = document.getElementById('senderColor');
    const receiverColorPicker = document.getElementById('receiverColor');
    const textColorPicker = document.getElementById('textColor');
    
    if (senderColorPicker) senderColorPicker.value = themeSettings.messageColors.sender;
    if (receiverColorPicker) receiverColorPicker.value = themeSettings.messageColors.receiver;
    if (textColorPicker) textColorPicker.value = themeSettings.messageColors.text;
    
    // Update background selection
    const bgOptions = document.querySelectorAll('.bg-option');
    bgOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.bg === themeSettings.chatBackground.type) {
            option.classList.add('selected');
        }
    });
    
    // Update bubble style selection
    const bubbleOptions = document.querySelectorAll('.bubble-option');
    bubbleOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.bubble === themeSettings.bubbleStyle) {
            option.classList.add('selected');
        }
    });
    
    // Update spacing slider
    const spacingSlider = document.getElementById('messageSpacing');
    const spacingValue = document.getElementById('spacingValue');
    if (spacingSlider && spacingValue) {
        spacingSlider.value = themeSettings.messageSpacing;
        spacingValue.textContent = themeSettings.messageSpacing + 'px';
    }
    
    // Update font selects
    const fontFamilySelect = document.getElementById('fontFamily');
    const fontSizeSelect = document.getElementById('fontSize');
    if (fontFamilySelect) fontFamilySelect.value = themeSettings.fontSettings.family;
    if (fontSizeSelect) fontSizeSelect.value = themeSettings.fontSettings.size;
}

function saveThemeSettings() {
    localStorage.setItem('chatThemeSettings', JSON.stringify(themeSettings));
}

function resetThemeSettings() {
    themeSettings = {
        primaryColor: 'blue',
        chatBackground: {
            type: 'pattern1',
            url: '/static/Pattern_1.png',
            color: '',
            gradient: ''
        },
        messageColors: {
            sender: '#144890',
            receiver: '#dfdfdf',
            text: '#000000'
        },
        bubbleStyle: 'rounded',
        messageSpacing: 10,
        fontSettings: {
            family: 'Manrope, sans-serif',
            size: '16px'
        },
        darkMode: document.body.classList.contains('dark-mode')
    };
    
    applyThemeSettings();
    updateUIFromSettings();
    saveThemeSettings();
    alert('Theme reset to default settings!');
}

function exportThemeSettings() {
    const themeData = JSON.stringify(themeSettings, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `kwikchat-theme-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Theme exported successfully!');
}

function applyImportedTheme(importedTheme) {
    themeSettings = {
        ...themeSettings,
        ...importedTheme
    };
    
    applyThemeSettings();
    updateUIFromSettings();
}

/* ================= SELECTION SYSTEM FUNCTIONS ================= */

function initializeSelectionSystem() {
    // Add CSS class for hidden delete for everyone button
    if (!document.querySelector('#selection-toolbar-style')) {
        const style = document.createElement('style');
        style.id = 'selection-toolbar-style';
        style.textContent = `
            #delete-for-everyone-selected.hidden {
                display: none !important;
            }
            .msg.selected {
                background-color: rgba(0, 123, 255, 0.1) !important;
                border: 2px solid #007bff !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function updateToolbar() {
    if (!toolbar) return;
    
    const countEl = document.getElementById("selection-count");
    const deleteForEveryoneBtn = document.getElementById("delete-for-everyone-selected");
    
    if (countEl) {
        countEl.innerText = selectedMessages.size;
    }
    
    let canDeleteForEveryone = false;
    selectedMessages.forEach(msg => {
        if (msg.canDeleteForEveryone && msg.senderId === window.currentUserId) {
            canDeleteForEveryone = true;
        }
    });
    
    if (deleteForEveryoneBtn) {
        if (canDeleteForEveryone) {
            deleteForEveryoneBtn.classList.remove('hidden');
        } else {
            deleteForEveryoneBtn.classList.add('hidden');
        }
    }
    
    if (selectedMessages.size > 0) {
        toolbar.classList.add("show");
        selectionMode = true;
    } else {
        toolbar.classList.remove("show");
        selectionMode = false;
    }
}

function toggleSelection(msg, messageId, senderId, canDeleteForEveryone) {
    if (!msg || !messageId || !senderId) return;
    
    if (selectedMessages.has(messageId)) {
        msg.classList.remove("selected");
        selectedMessages.delete(messageId);
    } else {
        msg.classList.add("selected");
        selectedMessages.set(messageId, {
            element: msg,
            senderId: senderId,
            canDeleteForEveryone: canDeleteForEveryone
        });
    }
    updateToolbar();
}

function clearSelection() {
    selectedMessages.forEach(msg => {
        if (msg && msg.element) {
            msg.element.classList.remove("selected");
        }
    });
    selectedMessages.clear();
    updateToolbar();
}

async function deleteSelectedMessages(deleteType) {
    if (selectedMessages.size === 0) return false;
    
    try {
        const messageIds = Array.from(selectedMessages.keys());
        
        const response = await fetch('/delete_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_ids: messageIds,
                delete_type: deleteType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            messageIds.forEach(messageId => {
                if (selectedMessages.has(messageId)) {
                    const msg = selectedMessages.get(messageId);
                    if (msg && msg.element) {
                        msg.element.classList.add('deleted');
                        const msgContent = msg.element.querySelector('.msg-message');
                        if (msgContent) {
                            if (deleteType === 'for_everyone') {
                                msgContent.textContent = '[This message was deleted]';
                            } else if (deleteType === 'for_me') {
                                const isSender = msg.senderId === window.currentUserId;
                                msgContent.textContent = isSender ? '[You deleted this message]' : '[Message deleted]';
                            }
                        }
                    }
                    selectedMessages.delete(messageId);
                }
            });
            
            updateToolbar();
            return true;
        } else {
            alert(result.error || 'Failed to delete messages');
            return false;
        }
    } catch (error) {
        console.error('Error deleting messages:', error);
        alert('Error deleting messages');
        return false;
    }
}

/* ================= EVENT LISTENERS INITIALIZATION ================= */

function initializeEventListeners() {
    // Add button toggle - FIXED: Your HTML doesn't have these exact IDs
    const addButton = document.getElementById("addtoggleButton");
    const recentsArea = document.querySelector(".msg-detail");
    const registeredUsers = document.querySelector(".registeredusers");

    if (addButton && recentsArea && registeredUsers) {
        addButton.addEventListener("click", function () {
            this.classList.toggle("back");
            if (this.classList.contains("back")) {
                recentsArea.style.display = "none";
                registeredUsers.style.display = "flex"; 
            } else {
                registeredUsers.style.display = "none";
                recentsArea.style.display = "block";  
            }
        });
    }

    // Scroll functionality
    const conversationArea = document.getElementById("conversation-area");
    const scrollDownBtn = document.getElementById("scroll-down-btn");

    if (conversationArea && scrollDownBtn) {
        function scrollToBottom() {
            conversationArea.scrollTo({
                top: conversationArea.scrollHeight,
                behavior: "smooth"
            });
        }
        
        function toggleScrollButton() {
            const isAtBottom = conversationArea.scrollHeight - conversationArea.scrollTop <= conversationArea.clientHeight + 10;
            if (isAtBottom) {
                scrollDownBtn.classList.remove("show");
            } else {
                scrollDownBtn.classList.add("show");
            }
        }

        conversationArea.addEventListener("scroll", toggleScrollButton);
        scrollDownBtn.addEventListener("click", scrollToBottom);
    }

    // Message click handlers for selection
    document.addEventListener("click", e => {
        const msg = e.target.closest(".msg");
        if (!msg || msg.classList.contains('deleted')) return;
        
        const messageId = msg.dataset.messageId;
        const senderId = parseInt(msg.dataset.senderId);
        
        if (!messageId || !senderId) return;
        
        const canDeleteForEveryone = msg.dataset.canDeleteForEveryone === 'true';
        
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleSelection(msg, messageId, senderId, canDeleteForEveryone);
        } else if (selectionMode) {
            toggleSelection(msg, messageId, senderId, canDeleteForEveryone);
        }
    });

    // Long press for mobile
    let pressTimer = null;

    document.addEventListener("touchstart", e => {
        const msg = e.target.closest(".msg");
        if (!msg || msg.classList.contains('deleted')) return;
        
        pressTimer = setTimeout(() => {
            const messageId = msg.dataset.messageId;
            const senderId = parseInt(msg.dataset.senderId);
            if (messageId && senderId) {
                const canDeleteForEveryone = msg.dataset.canDeleteForEveryone === 'true';
                toggleSelection(msg, messageId, senderId, canDeleteForEveryone);
            }
        }, 450);
    });

    document.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
    });

    // Delete selected messages for me
    const deleteForMeBtn = document.getElementById("delete-for-me-selected");
    if (deleteForMeBtn) {
        deleteForMeBtn.addEventListener("click", async () => {
            if (selectedMessages.size === 0) return;
            
            const confirmMsg = selectedMessages.size === 1 
                ? "Delete this message for you?"
                : `Delete ${selectedMessages.size} messages for you?`;
            
            if (!confirm(confirmMsg)) return;
            
            const success = await deleteSelectedMessages('for_me');
            if (success) {
                clearSelection();
            }
        });
    }
    
    // Delete selected messages for everyone
    const deleteForEveryoneBtn = document.getElementById("delete-for-everyone-selected");
    if (deleteForEveryoneBtn) {
        deleteForEveryoneBtn.addEventListener("click", async () => {
            if (selectedMessages.size === 0) return;
            
            const messagesToDelete = Array.from(selectedMessages.values());
            const canDeleteAll = messagesToDelete.every(msg => 
                msg.senderId === window.currentUserId && msg.canDeleteForEveryone
            );
            
            if (!canDeleteAll) {
                alert("You can only delete your own messages for everyone");
                return;
            }
            
            const confirmMsg = selectedMessages.size === 1 
                ? "Delete this message for everyone? This cannot be undone."
                : `Delete ${selectedMessages.size} messages for everyone? This cannot be undone.`;
            
            if (!confirm(confirmMsg)) return;
            
            const success = await deleteSelectedMessages('for_everyone');
            if (success) {
                clearSelection();
            }
        });
    }
    
    // Cancel selection button
    const cancelSelectionBtn = document.getElementById("cancel-selection");
    if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener("click", clearSelection);
    }
    
    // Copy selected button
    const copySelectedBtn = document.getElementById("copy-selected");
    if (copySelectedBtn) {
        copySelectedBtn.addEventListener("click", () => {
            let text = "";
            selectedMessages.forEach(msg => {
                const msgElement = msg.element;
                const t = msgElement.querySelector(".msg-message")?.innerText;
                const timestamp = msgElement.querySelector(".msg-time")?.innerText;
                if (t && !t.startsWith('[')) {
                    text += `${t} (${timestamp})\n\n`;
                }
            });
            
            if (text.trim()) {
                navigator.clipboard.writeText(text.trim());
                clearSelection();
                alert("Messages copied to clipboard!");
            } else {
                alert("No messages to copy");
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectedMessages.size > 0) {
            clearSelection();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            const messages = document.querySelectorAll('#conversation-area .msg:not(.deleted)');
            messages.forEach(msg => {
                const messageId = msg.dataset.messageId;
                const senderId = parseInt(msg.dataset.senderId);
                if (messageId && senderId) {
                    if (!selectedMessages.has(messageId)) {
                        const canDeleteForEveryone = msg.dataset.canDeleteForEveryone === 'true';
                        toggleSelection(msg, messageId, senderId, canDeleteForEveryone);
                    }
                }
            });
        }
    });
}

/* ================= USER AGREEMENT MODAL ================= */

function initializeAgreementModal() {
    const agreementModal = document.getElementById('userAgreementModal');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const confirmBtn = document.getElementById('confirmAgreement');
    const cancelBtn = document.getElementById('cancelAgreement');

    if (!agreementModal || !agreeCheckbox || !confirmBtn || !cancelBtn) {
        return;
    }

    confirmBtn.disabled = true;

    function showAgreementModal() {
        agreementModal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    function hideAgreementModal() {
        agreementModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    async function checkAgreementStatus() {
        try {
            const response = await fetch('/check_agreement_status', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.accepted) {
                    setTimeout(showAgreementModal, 100);
                }
            }
        } catch (error) {
            console.error('Error checking agreement status:', error);
        }
    }

    // Check agreement status on load
    checkAgreementStatus();

    agreeCheckbox.addEventListener('change', function() {
        confirmBtn.disabled = !this.checked;
    });

    confirmBtn.addEventListener('click', async function() {
        if (!agreeCheckbox.checked) return;

        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner"></span> Processing...';

        try {
            const response = await fetch('/accept_agreement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                hideAgreementModal();
                window.location.reload();
            } else {
                throw new Error(data.message || 'Failed to save agreement');
            }
        } catch (error) {
            console.error('Error accepting agreement:', error);
            alert('Failed to save agreement. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm';
        }
    });

    cancelBtn.addEventListener('click', function() {
        if (confirm('You must accept the terms to use KwikChat. Would you like to logout instead?')) {
            window.location.href = '/logout';
        }
    });

    // Close modal when clicking outside
    agreementModal.addEventListener('click', function(e) {
        if (e.target === agreementModal) {
            if (confirm('You must accept the terms to use KwikChat. Would you like to logout instead?')) {
                window.location.href = '/logout';
            }
        }
    });

    // Add keyboard support
    document.addEventListener('keydown', function(e) {
        if (agreementModal.classList.contains('active')) {
            if (e.key === 'Escape') {
                if (confirm('You must accept the terms to use KwikChat. Would you like to logout instead?')) {
                    window.location.href = '/logout';
                }
            }
            
            if (e.key === 'Enter' && agreeCheckbox.checked && !confirmBtn.disabled) {
                confirmBtn.click();
            }
        }
    });
}

/* ================= INITIALIZE ALL FUNCTIONALITIES ================= */

// Export functions to global scope
window.toggleSelection = toggleSelection;
window.clearSelection = clearSelection;
window.deleteSelectedMessages = deleteSelectedMessages;

console.log('KwikChat JavaScript loaded successfully!')