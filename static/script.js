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

//////////////////////////////////////////////////////////////////STYLES CSS DARK AND LIGHT MODE//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const toggleButton = document.querySelector('.dark-light');
if (toggleButton) {
    const originalToggle = toggleButton.onclick;
    toggleButton.onclick = function() {
        if (originalToggle) originalToggle();
        themeSettings.darkMode = document.body.classList.contains('dark-mode');
        saveThemeSettings();
    };
}

const colors = document.querySelectorAll('.color[data-theme="primary"]');
colors.forEach(color => {
    const originalClick = color.onclick;
    color.onclick = function() {
        if (originalClick) originalClick();
        themeSettings.primaryColor = this.getAttribute('data-color');
        saveThemeSettings();
    };
});

// Load saved theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('themeColor');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        
        // Remove 'selected' from all and apply only to the saved theme
        colors.forEach(color => {
            color.classList.remove('selected'); 
            if (color.getAttribute('data-color') === savedTheme) {
                color.classList.add('selected'); // Only select the saved theme
            }
        });
    }

    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});

// Event listener for theme selection
colors.forEach(color => {
    color.addEventListener('click', () => {
        // Remove 'selected' from all before adding it to the clicked one
        colors.forEach(c => c.classList.remove('selected'));

        const theme = color.getAttribute('data-color');
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('themeColor', theme); // Save theme in localStorage
        
        color.classList.add('selected'); // Add 'selected' to clicked color
    });
});

// Event listener for dark/light mode toggle
toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled'); // Store dark mode preference
});

//////////////////////////////////////////////ADD DIV TOGGLE///////////
document.addEventListener("DOMContentLoaded", function () {
    const addButton = document.getElementById("addtoggleButton");
    const recentsArea = document.querySelector(".msg-detail");
    const registeredUsers = document.querySelector(".registeredusers");

    addButton.addEventListener("click", function () {
        this.classList.toggle("back"); // Toggle the back class for icon change

        if (this.classList.contains("back")) {
            recentsArea.style.display = "none";
            registeredUsers.style.display = "flex"; 
        } else {
            registeredUsers.style.display = "none";
            recentsArea.style.display = "block";  
        }
    });
});


////////////////////////SRCL Conversation
document.addEventListener("DOMContentLoaded", function () {
    const conversationArea = document.getElementById("conversation-area");
    const scrollDownBtn = document.getElementById("scroll-down-btn");

    // Scroll to bottom function
    function scrollToBottom() {
        conversationArea.scrollTo({
            top: conversationArea.scrollHeight,
            behavior: "smooth"
        });
    }
    // Show/hide button based on scroll position
    function toggleScrollButton() {
        const isAtBottom = conversationArea.scrollHeight - conversationArea.scrollTop <= conversationArea.clientHeight + 10;
        if (isAtBottom) {
            scrollDownBtn.classList.remove("show"); // Hide button when already at the bottom
        } else {
            scrollDownBtn.classList.add("show"); // Show button when scrolled up
        }
    }

    // Scroll event listener
    conversationArea.addEventListener("scroll", toggleScrollButton);

    // Button click to scroll down
    scrollDownBtn.addEventListener("click", scrollToBottom);

});
//////////////////////////////////////////////////////////////////////seacrch in conversation/////////////////////////////////

document.getElementById('conversation-search').addEventListener('input', function () {
    let searchQuery = this.value.toLowerCase();
    let messages = document.querySelectorAll('#conversation-area .msg .msg-message');
    let firstMatch = null;

    messages.forEach(msg => {
        let originalText = msg.textContent;
        let lowerText = originalText.toLowerCase();

        if (searchQuery && lowerText.includes(searchQuery)) {
            // Highlight matching text
            let highlightedText = originalText.replace(new RegExp(`(${searchQuery})`, 'gi'), 
                `<span class="highlight">$1</span>`);
            msg.innerHTML = highlightedText;

            // Store the first matching element to scroll to
            if (!firstMatch) {
                firstMatch = msg;
            }
        } else {
            // Restore original text if search is cleared
            msg.innerHTML = originalText;
        }
    });

    // Scroll to the first match
    if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

/////////////////////DELETE MSG//////////////////////////

// Listen for the deleted message event
if (typeof socket !== 'undefined') {
    socket.on('message_deleted', function(data) {
        const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        if (messageElement) {
            // Update message display instead of removing
            if (data.delete_type === 'for_everyone') {
                messageElement.classList.add('deleted');
                const msgContent = messageElement.querySelector('.msg-message');
                if (msgContent) {
                    msgContent.textContent = '[This message was deleted]';
                }
            } else if (data.delete_type === 'for_me' && data.deleted_by !== currentUserId) {
                // Someone else deleted their copy, nothing to do for us
            }
        }
    });

    socket.on('messages_deleted', function(data) {
        data.message_ids.forEach(id => {
            let msgElement = document.querySelector(`[data-message-id="${id}"]`);
            if (msgElement) {
                msgElement.classList.add('deleted');
                const msgContent = msgElement.querySelector('.msg-message');
                if (msgContent) {
                    msgContent.textContent = '[This message was deleted]';
                }
            }
        });
    });
}


///////////////////////Add Button Toggle/////////////////

////////////////////////////SELECTED ACTIVE USER BG//////
document.addEventListener("DOMContentLoaded", function () {
    function handleListClick(event) {
        const target = event.target;

        if (target.tagName === "LI") {
            target.parentElement.querySelectorAll("li").forEach(li => li.classList.remove("selected"));

            target.classList.add("selected");

        }
    }

    document.querySelector(".msg1 ul").addEventListener("click", handleListClick);
    document.querySelector(".msg2 ul").addEventListener("click", handleListClick);
});

/////////////////////////word break/////////////////
document.querySelectorAll('.msg-message').forEach(msg => {
    msg.innerHTML = msg.innerHTML.replace(/(\S{15})/g, '$1\u200B');
});

////////////////////////////////////////

// Function to handle mobile view transitions
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
      const app = document.querySelector('.app');
      if (app) app.classList.add('chat-active');
    }
  }
  
  function goBackToRecents() {
    const app = document.querySelector('.app');
    if (app) app.classList.remove('chat-active');
    
    document.querySelectorAll('.msg1 ul li, .msg2 ul li').forEach(li => {
        li.classList.remove('selected');
    });
    
    currentRecipientId = null;
    localStorage.removeItem("selectedUserId");
  }
  
  // Update startChat function to include mobile view
  if (typeof startChat !== 'undefined') {
    const originalStartChat = startChat;
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
  
  document.addEventListener('DOMContentLoaded', function() {
    // Only run this code on mobile devices
    if (window.innerWidth <= 768) {
      const chatHeader = document.querySelector('.chat-profile');
      const detailArea = document.querySelector('.detail-area');
      const body = document.body;
      
      if (detailArea) {
        // Create close button for detail view
        const closeButton = document.createElement('button');
        closeButton.className = 'detail-area-close';
        closeButton.innerHTML = '&times;';
        detailArea.prepend(closeButton);
        
        // Show detail area when chat header is clicked
        if (chatHeader) {
            chatHeader.addEventListener('click', function() {
                detailArea.classList.add('mobile-visible');
                body.classList.add('detail-open');
            });
        }
        
        // Hide detail area when close button is clicked
        closeButton.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            detailArea.classList.remove('mobile-visible');
            body.classList.remove('detail-open');
        });
        
        // Hide detail area when clicking outside of it
        document.addEventListener('click', function(e) {
            if (detailArea.classList.contains('mobile-visible') && 
                !detailArea.contains(e.target) && 
                !chatHeader.contains(e.target)) {
                detailArea.classList.remove('mobile-visible');
                body.classList.remove('detail-open');
            }
        });
        
        // Also handle back button
        window.addEventListener('popstate', function() {
            if (detailArea.classList.contains('mobile-visible')) {
                detailArea.classList.remove('mobile-visible');
                body.classList.remove('detail-open');
                history.pushState(null, document.title, window.location.href);
            }
        });
        
        // Prevent the detail view from closing when clicking inside it
        detailArea.addEventListener('click', function(e) {
            e.stopPropagation();
        });
      }
    }
  });

  /////////////////////////
  document.getElementById("refresh-profile").addEventListener("click", function () {
    location.reload();
});


/////////////////////








document.addEventListener('DOMContentLoaded', function() {
    // Get modal and elements
    const agreementModal = document.getElementById('userAgreementModal');
    const agreeCheckbox = document.getElementById('agreeTerms');
    const confirmBtn = document.getElementById('confirmAgreement');
    const cancelBtn = document.getElementById('cancelAgreement');

    // Check if elements exist
    if (!agreementModal || !agreeCheckbox || !confirmBtn || !cancelBtn) {
        console.error('Agreement modal elements missing');
        return;
    }

    // Initialize modal state
    confirmBtn.disabled = true;

    // Function to show modal
    function showAgreementModal() {
        agreementModal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    // Function to hide modal
    function hideAgreementModal() {
        agreementModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    // Check agreement status from server instead of localStorage
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
                // Show modal only if user hasn't accepted agreement
                if (!data.accepted) {
                    setTimeout(showAgreementModal, 100);
                }
            }
        } catch (error) {
            console.error('Error checking agreement status:', error);
        }
    }

    // Check agreement status on page load
    checkAgreementStatus();

    // Checkbox handler
    agreeCheckbox.addEventListener('change', function() {
        confirmBtn.disabled = !this.checked;
    });

    // Confirm agreement handler
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
                // Hide modal and reload page
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

    // Cancel agreement handler
    cancelBtn.addEventListener('click', function() {
        hideAgreementModal();
        window.location.href = '/logout';
    });

    // CSRF token helper
    function getCSRFToken() {
        // Check for CSRF token in meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) return metaTag.content;
        
        // Check for CSRF token in cookie
        const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
        if (cookieMatch) return cookieMatch[1];
        
        // Check for CSRF token in form input
        const inputTag = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (inputTag) return inputTag.value;
        
        console.warn('CSRF token not found');
        return '';
    }
});



/* ================= BULK MESSAGE DELETION ================= */

// Store selected messages with their metadata
let selectedMessages = new Map(); // messageId -> {element, senderId, canDeleteForEveryone}
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
    
    // Show/hide delete for everyone button based on permissions
    let canDeleteForEveryone = false;
    selectedMessages.forEach(msg => {
        if (msg.canDeleteForEveryone && msg.senderId === currentUserId) {
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
    
    // Show/hide toolbar
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
        // Deselect
        msg.classList.remove("selected");
        selectedMessages.delete(messageId);
    } else {
        // Select
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
        // Ctrl/Cmd + click for selection
        e.preventDefault();
        toggleSelection(msg, messageId, senderId, msg.dataset.canDeleteForEveryone === 'true');
    } else if (selectionMode) {
        // Regular click when in selection mode
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

// Initialize delete button event listeners
document.addEventListener('DOMContentLoaded', function() {
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
                // Delete each message
                for (const messageId of messageIds) {
                    await deleteMessage(messageId, 'for_me');
                }
                
                // Clear selection
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
            
            // Check if user has permission to delete all selected messages for everyone
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
                // Delete each message for everyone
                for (const messageId of messageIds) {
                    await deleteMessage(messageId, 'for_everyone');
                }
                
                // Clear selection
                clearSelection();
            } catch (error) {
                console.error('Error deleting messages:', error);
                alert('Error deleting messages');
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
                if (t && !t.startsWith('[')) { // Don't copy deleted messages
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
});

// Delete single message function
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
            // Remove from selection if it was selected
            if (selectedMessages.has(messageId)) {
                selectedMessages.delete(messageId);
                updateToolbar();
            }
            
            // Update message display locally
            const msgElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (msgElement) {
                if (deleteType === 'for_everyone') {
                    msgElement.classList.add('deleted');
                    const msgContent = msgElement.querySelector('.msg-message');
                    if (msgContent) {
                        msgContent.textContent = '[This message was deleted]';
                    }
                } else if (deleteType === 'for_me') {
                    msgElement.classList.add('deleted');
                    const msgContent = msgElement.querySelector('.msg-message');
                    if (msgContent) {
                        const isSender = parseInt(msgElement.dataset.senderId) === currentUserId;
                        msgContent.textContent = isSender ? '[You deleted this message]' : '[Message deleted]';
                    }
                }
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

// Socket handler for deletion events from other users
if (typeof socket !== 'undefined') {
    socket.on('message_deleted', function(data) {
        const msgElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
        
        if (msgElement) {
            // Remove from selection if it was selected
            if (selectedMessages.has(data.message_id)) {
                selectedMessages.delete(data.message_id);
                updateToolbar();
            }
            
            // Update message display
            if (data.delete_type === 'for_everyone') {
                msgElement.classList.add('deleted');
                const msgContent = msgElement.querySelector('.msg-message');
                if (msgContent) {
                    msgContent.textContent = '[This message was deleted]';
                }
            }
        }
    });
}

// Clear selection function
function clearSelection() {
    selectedMessages.forEach(msg => {
        msg.element.classList.remove("selected");
    });
    selectedMessages.clear();
    updateToolbar();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to cancel selection
    if (e.key === 'Escape' && selectedMessages.size > 0) {
        clearSelection();
    }
    
    // Ctrl+A to select all messages in current chat
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
        const deleteForMeBtn = document.getElementById('delete-for-me-selected');
        if (deleteForMeBtn) deleteForMeBtn.click();
    }
    
    // Ctrl+Shift+D to delete selected for everyone
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D' && selectedMessages.size > 0) {
        e.preventDefault();
        const deleteForEveryoneBtn = document.getElementById('delete-for-everyone-selected');
        if (deleteForEveryoneBtn) deleteForEveryoneBtn.click();
    }
});

// Add CSS class for hidden delete for everyone button
const style = document.createElement('style');
style.textContent = `
    #delete-for-everyone-selected.hidden {
        display: none !important;
    }
`;
document.head.appendChild(style);


//============================ADVANCED THEME CUSTOMIZATION======================

/* ================= ADVANCED THEME CUSTOMIZATION ================= */

// Theme settings state
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

// Initialize theme settings panel
document.addEventListener('DOMContentLoaded', function() {
    const themeSettingsExpand = document.getElementById('themeSettingsExpand');
    const themeSettingsPanel = document.getElementById('themeSettingsPanel');
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

    // Load saved theme from localStorage
    loadThemeSettings();

    // Toggle theme settings panel
    if (themeSettingsExpand && themeSettingsPanel) {
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
    }

    // Background selection
    bgOptions.forEach(option => {
        option.addEventListener('click', function() {
            bgOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const bgType = this.dataset.bg;
            themeSettings.chatBackground.type = bgType;
            
            // Update CSS variables based on background type
            if (bgType === 'solid') {
                document.documentElement.style.setProperty('--chat-bg-image', 'none');
                document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
                document.documentElement.style.setProperty('--chat-bg-color', this.dataset.bgColor);
            } else if (bgType === 'gradient') {
                document.documentElement.style.setProperty('--chat-bg-image', 'none');
                document.documentElement.style.setProperty('--chat-bg-gradient', this.dataset.bgGradient);
                document.documentElement.style.setProperty('--chat-bg-color', 'transparent');
            } else if (bgType === 'custom') {
                // Handle custom image upload
                bgUpload.click();
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
                    
                    // Update custom bg preview
                    const customPreview = customBgOption.querySelector('.bg-preview');
                    customPreview.style.backgroundImage = `url('${bgUrl}')`;
                    customPreview.innerHTML = '';
                    
                    themeSettings.chatBackground.url = bgUrl;
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
            
            // Update CSS variables for bubble styles
            if (style === 'rounded') {
                document.documentElement.style.setProperty('--bubble-border-radius', '20px 20px 0px 20px');
                document.documentElement.style.setProperty('--receiver-bubble-radius', '0px 20px 20px 20px');
            } else if (style === 'sharp') {
                document.documentElement.style.setProperty('--bubble-border-radius', '5px 5px 0px 5px');
                document.documentElement.style.setProperty('--receiver-bubble-radius', '0px 5px 5px 5px');
            } else if (style === 'modern') {
                document.documentElement.style.setProperty('--bubble-border-radius', '20px 5px 20px 20px');
                document.documentElement.style.setProperty('--receiver-bubble-radius', '5px 20px 20px 5px');
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
            themeImportFile.click();
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
});

// Load theme settings from localStorage
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

// Apply theme settings to CSS variables
function applyThemeSettings() {
    // Apply primary theme color
    document.body.setAttribute('data-theme', themeSettings.primaryColor);
    
    // Apply chat background
    const bg = themeSettings.chatBackground;
    if (bg.type === 'solid') {
        document.documentElement.style.setProperty('--chat-bg-image', 'none');
        document.documentElement.style.setProperty('--chat-bg-gradient', 'none');
        document.documentElement.style.setProperty('--chat-bg-color', bg.color || 'var(--theme-bg-color)');
    } else if (bg.type === 'gradient') {
        document.documentElement.style.setProperty('--chat-bg-image', 'none');
        document.documentElement.style.setProperty('--chat-bg-gradient', bg.gradient);
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
        document.documentElement.style.setProperty('--bubble-border-radius', '20px 20px 0px 20px');
        document.documentElement.style.setProperty('--receiver-bubble-radius', '0px 20px 20px 20px');
    } else if (style === 'sharp') {
        document.documentElement.style.setProperty('--bubble-border-radius', '5px 5px 0px 5px');
        document.documentElement.style.setProperty('--receiver-bubble-radius', '0px 5px 5px 5px');
    } else if (style === 'modern') {
        document.documentElement.style.setProperty('--bubble-border-radius', '20px 5px 20px 20px');
        document.documentElement.style.setProperty('--receiver-bubble-radius', '5px 20px 20px 5px');
    }
    
    // Apply message spacing
    document.documentElement.style.setProperty('--message-spacing', themeSettings.messageSpacing + 'px');
    
    // Apply font settings
    document.documentElement.style.setProperty('--selected-font-family', themeSettings.fontSettings.family);
    document.documentElement.style.setProperty('--selected-font-size', themeSettings.fontSettings.size);
    
    // Apply dark mode
    if (themeSettings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Update UI controls from settings
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

// Save theme settings to localStorage
function saveThemeSettings() {
    localStorage.setItem('chatThemeSettings', JSON.stringify(themeSettings));
}

// Reset theme to default settings
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
        darkMode: false
    };
    
    applyThemeSettings();
    updateUIFromSettings();
    saveThemeSettings();
    alert('Theme reset to default settings!');
}

// Export theme settings as JSON file
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

// Apply imported theme settings
function applyImportedTheme(importedTheme) {
    // Merge imported theme with default structure
    themeSettings = {
        ...themeSettings,
        ...importedTheme
    };
    
    applyThemeSettings();
    updateUIFromSettings();
}


