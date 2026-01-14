const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    console.error("Speech Recognition API is not supported in this browser.");
} else {
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
        startVoiceButton.textContent = "Stop Voice";

        if (typeof voiceAnimation !== "undefined") {
            voiceAnimation.classList.add("active");
        }

        previousText = txtMessage.value.trim();
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        recognition.stop();
        isListening = false;
        startVoiceButton.textContent = "Start Voice";

        if (typeof voiceAnimation !== "undefined") {
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
        startVoiceButton.textContent = "Start Voice";

        if (typeof voiceAnimation !== "undefined") {
            voiceAnimation.classList.remove("active");
        }
    };

    startVoiceButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            isListening = true;
        }
    });
}

// Theme functionality
const toggleButton = document.querySelector('.dark-light');
const colors = document.querySelectorAll('.color');

// Load saved theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
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

    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});

// Theme selection
colors.forEach(color => {
    color.addEventListener('click', () => {
        colors.forEach(c => c.classList.remove('selected'));
        const theme = color.getAttribute('data-color');
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('themeColor', theme);
        color.classList.add('selected');
    });
});

// Dark/light mode toggle
toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
});

// Add button toggle
document.addEventListener("DOMContentLoaded", function () {
    const addButton = document.getElementById("addtoggleButton");
    const recentsArea = document.querySelector(".msg-detail");
    const registeredUsers = document.querySelector(".registeredusers");

    if (addButton) {
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
});

// Scroll functionality
document.addEventListener("DOMContentLoaded", function () {
    const conversationArea = document.getElementById("conversation-area");
    const scrollDownBtn = document.getElementById("scroll-down-btn");

    function scrollToBottom() {
        if (conversationArea) {
            conversationArea.scrollTo({
                top: conversationArea.scrollHeight,
                behavior: "smooth"
            });
        }
    }
    
    function toggleScrollButton() {
        if (conversationArea && scrollDownBtn) {
            const isAtBottom = conversationArea.scrollHeight - conversationArea.scrollTop <= conversationArea.clientHeight + 10;
            if (isAtBottom) {
                scrollDownBtn.classList.remove("show");
            } else {
                scrollDownBtn.classList.add("show");
            }
        }
    }

    if (conversationArea) {
        conversationArea.addEventListener("scroll", toggleScrollButton);
    }
    
    if (scrollDownBtn) {
        scrollDownBtn.addEventListener("click", scrollToBottom);
    }
});

// Search in conversation
const conversationSearch = document.getElementById('conversation-search');
if (conversationSearch) {
    conversationSearch.addEventListener('input', function () {
        let searchQuery = this.value.toLowerCase();
        let messages = document.querySelectorAll('#conversation-area .msg .msg-message');
        let firstMatch = null;

        messages.forEach(msg => {
            let originalText = msg.textContent;
            let lowerText = originalText.toLowerCase();

            if (searchQuery && lowerText.includes(searchQuery)) {
                let highlightedText = originalText.replace(new RegExp(`(${searchQuery})`, 'gi'), 
                    `<span class="highlight">$1</span>`);
                msg.innerHTML = highlightedText;

                if (!firstMatch) {
                    firstMatch = msg;
                }
            } else {
                msg.innerHTML = originalText;
            }
        });

        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

// Socket events for deleted messages
if (typeof socket !== 'undefined') {
    socket.on('message_deleted', function(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });

    socket.on('messages_deleted', function(data) {
        data.message_ids.forEach(id => {
            let msgElement = document.querySelector(`[data-message-id="${id}"]`);
            if (msgElement) msgElement.remove();
        });
    });
}

// Selected active user background
document.addEventListener("DOMContentLoaded", function () {
    function handleListClick(event) {
        const target = event.target;
        if (target.tagName === "LI") {
            target.parentElement.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
            target.classList.add("selected");
        }
    }

    const msg1List = document.querySelector(".msg1 ul");
    const msg2List = document.querySelector(".msg2 ul");
    
    if (msg1List) msg1List.addEventListener("click", handleListClick);
    if (msg2List) msg2List.addEventListener("click", handleListClick);
});

// Word break
document.querySelectorAll('.msg-message').forEach(msg => {
    msg.innerHTML = msg.innerHTML.replace(/(\S{15})/g, '$1\u200B');
});

// Mobile view
function setupMobileView() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        if (!document.querySelector('.back-button')) {
            const backButton = document.createElement('button');
            backButton.className = 'back-button';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
            backButton.addEventListener('click', goBackToRecents);

            const chatHeader = document.querySelector('.chat-header');
            if (chatHeader) {
                chatHeader.insertBefore(backButton, chatHeader.firstChild);
            }
        }
    }
}

function showChatOnMobile() {
    if (window.innerWidth <= 768) {
        document.querySelector('.app').classList.add('chat-active');
    }
}

function goBackToRecents() {
    document.querySelector('.app').classList.remove('chat-active');
    
    document.querySelectorAll('.msg1 ul li, .msg2 ul li').forEach(li => {
        li.classList.remove('selected');
    });
    
    currentRecipientId = null;
    localStorage.removeItem("selectedUserId");
}

// Update startChat function
const originalStartChat = typeof startChat !== 'undefined' ? startChat : null;
if (originalStartChat) {
    startChat = function(recipientId, username) {
        originalStartChat(recipientId, username);
        showChatOnMobile();
    };
}

window.addEventListener('resize', setupMobileView);

document.addEventListener('DOMContentLoaded', function() {
    setupMobileView();
    
    if (typeof currentRecipientId !== 'undefined' && currentRecipientId && window.innerWidth <= 768) {
        showChatOnMobile();
    }
});

// Mobile detail area
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth <= 768) {
        const chatHeader = document.querySelector('.chat-profile');
        const detailArea = document.querySelector('.detail-area');
        const body = document.body;
        
        if (detailArea) {
            const closeButton = document.createElement('button');
            closeButton.className = 'detail-area-close';
            closeButton.innerHTML = '&times;';
            detailArea.prepend(closeButton);
            
            if (chatHeader) {
                chatHeader.addEventListener('click', function() {
                    detailArea.classList.add('mobile-visible');
                    body.classList.add('detail-open');
                });
            }
            
            closeButton.addEventListener('click', function(e) {
                e.stopPropagation();
                detailArea.classList.remove('mobile-visible');
                body.classList.remove('detail-open');
            });
            
            document.addEventListener('click', function(e) {
                if (detailArea.classList.contains('mobile-visible') && 
                    !detailArea.contains(e.target) && 
                    !chatHeader.contains(e.target)) {
                    detailArea.classList.remove('mobile-visible');
                    body.classList.remove('detail-open');
                }
            });
            
            detailArea.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    }
});

// Refresh profile
const refreshProfileBtn = document.getElementById("refresh-profile");
if (refreshProfileBtn) {
    refreshProfileBtn.addEventListener("click", function () {
        location.reload();
    });
}

// User agreement modal
document.addEventListener('DOMContentLoaded', function() {
    const agreementModal = document.getElementById('userAgreementModal');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const confirmBtn = document.getElementById('confirmAgreement');
    const cancelBtn = document.getElementById('cancelAgreement');

    if (!agreementModal || !agreeCheckbox || !confirmBtn || !cancelBtn) {
        console.error('Agreement modal elements missing');
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
                    'X-CSRFToken': getCSRFToken()
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
                    'X-CSRFToken': getCSRFToken()
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
            console.error('Agreement error:', error);
            alert('Error saving agreement. Please try again.');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm';
        }
    });

    cancelBtn.addEventListener('click', function() {
        hideAgreementModal();
        window.location.href = '/logout';
    });

    function getCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) return metaTag.content;
        
        const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
        if (cookieMatch) return cookieMatch[1];
        
        const inputTag = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (inputTag) return inputTag.value;
        
        console.warn('CSRF token not found');
        return '';
    }
});

/* ================= BULK MESSAGE DELETION ================= */

// Store selected messages with their metadata
let selectedMessages = new Map();
let selectionMode = false;
const toolbar = document.getElementById("selection-toolbar");

// Function to update toolbar
function updateToolbar() {
    if (!toolbar) return;
    
    const countEl = document.getElementById("selection-count");
    const deleteForEveryoneBtn = document.getElementById("delete-for-everyone-selected");
    
    if (countEl) {
        countEl.innerText = selectedMessages.size;
    }
    
    let canDeleteForEveryone = false;
    selectedMessages.forEach(msg => {
        if (msg.canDeleteForEveryone && msg.senderId === currentUserId) {
            canDeleteForEveryone = true;
        }
    });
    
    if (deleteForEveryoneBtn) {
        deleteForEveryoneBtn.style.display = canDeleteForEveryone ? 'flex' : 'none';
    }
    
    if (selectedMessages.size > 0) {
        toolbar.classList.add("show");
        selectionMode = true;
    } else {
        toolbar.classList.remove("show");
        selectionMode = false;
    }
}

// Function to add/remove message from selection
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

// Message click handlers
document.addEventListener("click", e => {
    const msg = e.target.closest(".msg");
    if (!msg || msg.classList.contains('deleted')) return;
    
    const messageId = msg.dataset.messageId;
    const senderId = parseInt(msg.dataset.senderId);
    
    if (!messageId || !senderId) return;
    
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleSelection(msg, messageId, senderId, msg.dataset.canDeleteForEveryone === 'true');
    } else if (selectionMode) {
        toggleSelection(msg, messageId, senderId, msg.dataset.canDeleteForEveryone === 'true');
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
            toggleSelection(msg, messageId, senderId, msg.dataset.canDeleteForEveryone === 'true');
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
        
        const messageIds = Array.from(selectedMessages.keys());
        
        try {
            for (const messageId of messageIds) {
                await deleteMessage(messageId, 'for_me');
            }
            clearSelection();
        } catch (error) {
            console.error('Error deleting messages:', error);
            alert('Error deleting messages');
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
            msg.senderId === currentUserId && msg.canDeleteForEveryone
        );
        
        if (!canDeleteAll) {
            alert("You can only delete your own messages for everyone");
            return;
        }
        
        const confirmMsg = selectedMessages.size === 1 
            ? "Delete this message for everyone? This cannot be undone."
            : `Delete ${selectedMessages.size} messages for everyone? This cannot be undone.`;
        
        if (!confirm(confirmMsg)) return;
        
        const messageIds = Array.from(selectedMessages.keys());
        
        try {
            for (const messageId of messageIds) {
                await deleteMessage(messageId, 'for_everyone');
            }
            clearSelection();
        } catch (error) {
            console.error('Error deleting messages:', error);
            alert('Error deleting messages');
        }
    });
}

// Delete single message
async function deleteMessage(messageId, deleteType) {
    try {
        const response = await fetch('/delete_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: messageId,
                delete_type: deleteType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (selectedMessages.has(messageId)) {
                selectedMessages.delete(messageId);
                updateToolbar();
            }
            return true;
        } else {
            alert(result.error || 'Failed to delete message');
            return false;
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
        return false;
    }
}

// Socket handler for deletion events
if (typeof socket !== 'undefined') {
    socket.on('message_deleted', function(data) {
        const msgElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        
        if (msgElement) {
            if (selectedMessages.has(data.message_id)) {
                selectedMessages.delete(data.message_id);
                updateToolbar();
            }
            
            if (data.delete_type === 'for_everyone') {
                msgElement.classList.add('deleted');
                const msgContent = msgElement.querySelector('.msg-message');
                if (msgContent) {
                    msgContent.textContent = '[This message was deleted]';
                }
            } else if (data.delete_type === 'for_me') {
                msgElement.classList.add('deleted');
                const msgContent = msgElement.querySelector('.msg-message');
                if (msgContent) {
                    const isSender = parseInt(msgElement.dataset.senderId) === currentUserId;
                    msgContent.textContent = isSender ? '[You deleted this message]' : '[Message deleted]';
                }
            }
        }
    });
}

// Clear selection
function clearSelection() {
    selectedMessages.forEach(msg => {
        msg.element.classList.remove("selected");
    });
    selectedMessages.clear();
    updateToolbar();
}

// Cancel selection
const cancelSelectionBtn = document.getElementById("cancel-selection");
if (cancelSelectionBtn) {
    cancelSelectionBtn.addEventListener("click", clearSelection);
}

// Copy selected
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
    // Escape to cancel selection
    if (e.key === 'Escape' && selectedMessages.size > 0) {
        clearSelection();
    }
    
    // Ctrl+A to select all messages
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const messages = document.querySelectorAll('#conversation-area .msg:not(.deleted)');
        messages.forEach(msg => {
            const messageId = msg.dataset.messageId;
            const senderId = parseInt(msg.dataset.senderId);
            if (messageId && senderId) {
                if (!selectedMessages.has(messageId)) {
                    toggleSelection(msg, messageId, senderId, msg.dataset.canDeleteForEveryone === 'true');
                }
            }
        });
    }
    
    // Ctrl+D to delete selected for me
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedMessages.size > 0) {
        e.preventDefault();
        if (deleteForMeBtn) deleteForMeBtn.click();
    }
    
    // Ctrl+Shift+D to delete selected for everyone
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D' && selectedMessages.size > 0) {
        e.preventDefault();
        if (deleteForEveryoneBtn) deleteForEveryoneBtn.click();
    }
});