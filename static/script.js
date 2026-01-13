const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    console.error("Speech Recognition API is not supported in this browser.");
} else {
    console.log("Speech Recognition API is available.");

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop automatically after speech input
    recognition.interimResults = true; // Allow real-time text update
    recognition.lang = "en-US";

    const txtMessage = document.getElementById("TxtMessage");
    const startVoiceButton = document.getElementById("startVoice");
    let isListening = false; // Track the mic state
    let previousText = ""; // Preserve already spoken text

    recognition.onstart = () => {
        console.log("Voice recognition started...");
        txtMessage.placeholder = "Listening...";
        startVoiceButton.textContent = "Stop Voice";

        if (typeof voiceAnimation !== "undefined") {
            voiceAnimation.classList.add("active");
        }

        previousText = txtMessage.value.trim(); // Store existing text
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        // Gracefully stop mic on error
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

            // Capitalize first letter of new sentence
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
const colors = document.querySelectorAll('.color');

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
socket.on('message_deleted', function(data) {
    const messageElement = document.getElementById(`msg-${data.message_id}`);
    if (messageElement) {
        messageElement.remove(); // Remove message from UI
    }
});

socket.on('messages_deleted', function(data) {
    data.message_ids.forEach(id => {
        let msgElement = document.getElementById(`msg-${id}`);
        if (msgElement) msgElement.remove();
    });
});


// Socket event handlers for message deletion
socket.on('message_deleted_for_me', function(data) {
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
        messageElement.style.opacity = '0.3';
        messageElement.style.textDecoration = 'line-through';
    }
});

socket.on('message_deleted_for_everyone', function(data) {
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
        messageElement.style.opacity = '0';
        messageElement.style.height = '0';
        messageElement.style.padding = '0';
        messageElement.style.margin = '0';
        messageElement.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }
});

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
        chatHeader.insertBefore(backButton, chatHeader.firstChild);
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
  }
  
  const originalStartChat = startChat;
  startChat = function(recipientId, username) {
    originalStartChat(recipientId, username);
    showChatOnMobile();
  };
  
  window.addEventListener('resize', setupMobileView);
  
  document.addEventListener('DOMContentLoaded', function() {
    setupMobileView();
    
    if (currentRecipientId && window.innerWidth <= 768) {
      showChatOnMobile();
    }
  });

  


let isReturningFromChat = false;

function goBackToRecents() {
  isReturningFromChat = true;
  document.querySelector('.app').classList.remove('chat-active');
  

  document.querySelectorAll('.msg1 ul li, .msg2 ul li').forEach(li => {
    li.classList.remove('selected');
  });
  
  currentRecipientId = null;
  
  // Reset the flag after a brief delay
  setTimeout(() => {
    isReturningFromChat = false;
  }, 300);
}


function goBackToRecents() {
    document.querySelector('.app').classList.remove('chat-active');

    localStorage.removeItem("selectedUserId");
}
  ////////////////////////////////////////////////////////////////
  
  document.addEventListener('DOMContentLoaded', function() {
    // Only run this code on mobile devices
    if (window.innerWidth <= 768) {
      const chatHeader = document.querySelector('.chat-profile');
      const detailArea = document.querySelector('.detail-area');
      const body = document.body;
      
      // Create close button for detail view
      const closeButton = document.createElement('button');
      closeButton.className = 'detail-area-close';
      closeButton.innerHTML = '&times;';
      detailArea.prepend(closeButton);
      
      // Show detail area when chat header is clicked
      chatHeader.addEventListener('click', function() {
        detailArea.classList.add('mobile-visible');
        body.classList.add('detail-open');
      });
      
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



///////////////////////SELECT MSG////////////////////
/* ================= PREMIUM MESSAGE SELECTION ================= */

let selectedMessages = new Set();
let selectionMode = false;

const toolbar = document.getElementById("selection-toolbar");
const countEl = document.getElementById("selection-count");

function updateToolbar() {
    countEl.innerText = selectedMessages.size;

    if (selectedMessages.size > 0) {
        toolbar.classList.add("show");
    } else {
        toolbar.classList.remove("show");
        selectionMode = false;
    }
}

function toggleSelection(msg) {
    selectionMode = true;

    msg.classList.toggle("selected");

    if (msg.classList.contains("selected")) {
        selectedMessages.add(msg);
    } else {
        selectedMessages.delete(msg);
    }

    updateToolbar();
}

function clearSelection() {
    selectedMessages.forEach(msg => msg.classList.remove("selected"));
    selectedMessages.clear();
    updateToolbar();
}

/* Desktop: Ctrl + Click */
document.addEventListener("click", e => {
    const msg = e.target.closest(".msg");
    if (!msg) return;

    if (e.ctrlKey) {
        e.preventDefault();
        toggleSelection(msg);
    } else if (selectionMode) {
        toggleSelection(msg);
    }
});

/* Mobile: Long press */
let pressTimer = null;

document.addEventListener("touchstart", e => {
    const msg = e.target.closest(".msg");
    if (!msg) return;

    pressTimer = setTimeout(() => {
        toggleSelection(msg);
    }, 450);
});

document.addEventListener("touchend", () => {
    clearTimeout(pressTimer);
});

/* Copy */
document.getElementById("copy-selected").addEventListener("click", () => {
    let text = "";
    selectedMessages.forEach(msg => {
        const t = msg.querySelector(".msg-message")?.innerText;
        if (t) text += t + "\n\n";
    });

    navigator.clipboard.writeText(text.trim());
    clearSelection();
});

/* Cancel */
document.getElementById("cancel-selection").addEventListener("click", clearSelection);








// ================= MESSAGE DELETION FUNCTIONALITY =================

// Global variables for message deletion
let selectedMessageElement = null;
let selectedMessageId = null;
let deleteMode = 'forMe'; // 'forMe' or 'forEveryone'

// Show message context menu on right-click or long press
function showMessageContextMenu(event, messageElement) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Show context menu called');
    
    // Get the message element
    selectedMessageElement = messageElement;
    if (!selectedMessageElement) {
        console.error('No message element found');
        return;
    }
    
    // Get message ID from data attribute
    selectedMessageId = selectedMessageElement.getAttribute('data-message-id');
    console.log('Message ID:', selectedMessageId);
    
    if (!selectedMessageId) {
        console.error('No message ID found in data attribute');
        // Try to find message ID in child elements
        const msgIdElement = selectedMessageElement.querySelector('[data-message-id]');
        if (msgIdElement) {
            selectedMessageId = msgIdElement.getAttribute('data-message-id');
            console.log('Found message ID in child:', selectedMessageId);
        }
    }
    
    if (!selectedMessageId) {
        showToast('Cannot delete: Message ID not found');
        return;
    }
    
    // Check if this is a sender message (user's own message)
    const isSenderMessage = selectedMessageElement.classList.contains('sender');
    console.log('Is sender message:', isSenderMessage);
    
    // Show/hide "Delete for everyone" option based on sender
    const deleteForEveryoneBtn = document.getElementById('deleteForEveryoneBtn');
    if (deleteForEveryoneBtn) {
        if (isSenderMessage) {
            deleteForEveryoneBtn.style.display = 'block';
        } else {
            deleteForEveryoneBtn.style.display = 'none';
        }
    }
    
    // Position the context menu
    const contextMenu = document.getElementById('messageContextMenu');
    if (!contextMenu) {
        console.error('Context menu element not found');
        return;
    }
    
    contextMenu.style.display = 'block';
    
    // Position at cursor
    let clientX, clientY;
    if (event.type === 'touchstart' && event.touches && event.touches[0]) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const x = Math.min(clientX || 0, window.innerWidth - contextMenu.offsetWidth - 10);
    const y = Math.min(clientY || 0, window.innerHeight - contextMenu.offsetHeight - 10);
    
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
    
    // Prevent clicks outside from closing immediately
    setTimeout(() => {
        document.addEventListener('click', closeContextMenuOnClick);
    }, 10);
}

// Close context menu when clicking outside
function closeContextMenuOnClick(event) {
    const contextMenu = document.getElementById('messageContextMenu');
    if (contextMenu && !contextMenu.contains(event.target) && 
        !event.target.closest('.msg')) {
        hideMessageContextMenu();
        document.removeEventListener('click', closeContextMenuOnClick);
    }
}

// Hide context menu
function hideMessageContextMenu() {
    const contextMenu = document.getElementById('messageContextMenu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
    selectedMessageElement = null;
    selectedMessageId = null;
}

// Delete message for me only
function deleteMessageForMe() {
    console.log('Delete for me called, Message ID:', selectedMessageId);
    
    if (!selectedMessageElement || !selectedMessageId) {
        showToast('No message selected');
        hideMessageContextMenu();
        return;
    }
    
    deleteMode = 'forMe';
    showDeleteModal('Delete for me', 
                   'Are you sure you want to delete this message for yourself? The other person will still see it.',
                   false);
}

// Delete message for everyone
function deleteMessageForEveryone() {
    console.log('Delete for everyone called, Message ID:', selectedMessageId);
    
    if (!selectedMessageElement || !selectedMessageId) {
        showToast('No message selected');
        hideMessageContextMenu();
        return;
    }
    
    // Only allow delete for everyone for sender's own messages
    if (!selectedMessageElement.classList.contains('sender')) {
        showToast('You can only delete your own messages for everyone');
        hideMessageContextMenu();
        return;
    }
    
    deleteMode = 'forEveryone';
    showDeleteModal('Delete for everyone', 
                   'Are you sure you want to delete this message for everyone? This action cannot be undone.',
                   true);
}

// Copy message text
function copyMessage() {
    if (!selectedMessageElement) return;
    
    const messageText = selectedMessageElement.querySelector('.msg-message')?.textContent;
    if (messageText) {
        navigator.clipboard.writeText(messageText.trim())
            .then(() => showToast('Message copied to clipboard'))
            .catch(() => showToast('Failed to copy message'));
    }
    
    hideMessageContextMenu();
}

// Show delete confirmation modal
function showDeleteModal(title, message, isForEveryone) {
    const modal = document.getElementById('deleteModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (!modal || !modalTitle || !modalMessage || !confirmBtn) {
        console.error('Modal elements not found');
        return;
    }
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    if (isForEveryone) {
        confirmBtn.className = 'modal-btn confirm-btn danger';
        confirmBtn.textContent = 'Delete for Everyone';
    } else {
        confirmBtn.className = 'modal-btn confirm-btn';
        confirmBtn.textContent = 'Delete for Me';
    }
    
    modal.style.display = 'flex';
    
    // Remove click listener to prevent multiple bindings
    document.removeEventListener('click', closeContextMenuOnClick);
}

// Hide modal
function hideModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedMessageElement = null;
    selectedMessageId = null;
}

// Confirm delete action
async function confirmDelete() {
    console.log('Confirm delete called, Message ID:', selectedMessageId, 'Mode:', deleteMode);
    
    hideModal();
    
    if (!selectedMessageId) {
        showToast('No message selected');
        return;
    }
    
    const isForEveryone = deleteMode === 'forEveryone';
    
    try {
        const response = await fetch('/delete_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message_id: selectedMessageId,
                delete_for_everyone: isForEveryone
            })
        });
        
        const data = await response.json();
        console.log('Delete response:', data);
        
        if (data.success) {
            // Handle UI update based on delete mode
            if (isForEveryone) {
                // Remove message completely
                if (selectedMessageElement) {
                    selectedMessageElement.classList.add('deleted-for-all');
                    setTimeout(() => {
                        if (selectedMessageElement && selectedMessageElement.parentNode) {
                            selectedMessageElement.parentNode.removeChild(selectedMessageElement);
                        }
                    }, 300);
                }
                showToast('Message deleted for everyone');
            } else {
                // Just hide message for current user (soft delete)
                if (selectedMessageElement) {
                    selectedMessageElement.classList.add('deleted');
                }
                showToast('Message deleted for you');
            }
        } else {
            showToast('Failed to delete message: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Error deleting message. Please try again.');
    }
    
    selectedMessageElement = null;
    selectedMessageId = null;
}

// Toast notification function
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('Toast element not found');
        return;
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Initialize message context menu
function initMessageContextMenu() {
    console.log('Initializing message context menu...');
    
    // Right-click context menu for desktop
    document.addEventListener('contextmenu', function(event) {
        const messageElement = event.target.closest('.msg');
        if (messageElement) {
            showMessageContextMenu(event, messageElement);
            return false; // Prevent default context menu
        }
    });
    
    // Mobile: Long press on messages
    let pressTimer;
    document.addEventListener('touchstart', function(event) {
        const messageElement = event.target.closest('.msg');
        if (messageElement) {
            pressTimer = setTimeout(() => {
                showMessageContextMenu(event, messageElement);
            }, 500); // 500ms long press
        }
    });
    
    document.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    
    document.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    });
    
    // Close context menu on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideMessageContextMenu();
            hideModal();
        }
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('deleteModal');
        if (modal && modal.style.display === 'flex' && 
            !modal.contains(event.target) && 
            !event.target.closest('.message-context-menu')) {
            hideModal();
        }
    });
    
    console.log('Message context menu initialized');
}

// Update the addMessageToConversation function to include message IDs
function addMessageToConversation(sender, message, isSender, timestamp, senderProfilePic, receiverProfilePic, status = "sent", messageId = null) {
    const conversationArea = document.getElementById('conversation-area');
    const formattedTimestamp = formatTimestamp(timestamp);
    
    // Create message container
    const msgDiv = document.createElement('div');
    msgDiv.className = isSender ? 'msg sender' : 'msg receiver';
    
    // Add message ID as data attribute (CRITICAL FIX)
    if (messageId) {
        msgDiv.setAttribute('data-message-id', messageId);
    }
    
    const messageDate = new Date(timestamp).toDateString();
    let lastDate = localStorage.getItem('lastMessageDate') || '';

    // Add date separator if it's a new day
    if (messageDate !== lastDate) {
        lastDate = messageDate;
        localStorage.setItem('lastMessageDate', messageDate);
        const dateDiv = document.createElement("div");
        dateDiv.className = "msg-date";
        dateDiv.textContent = messageDate;
        conversationArea.appendChild(dateDiv);
    }

    let profilePicUrl = isSender 
        ? `/profile_picture/${currentUserId}`
        : receiverProfilePic || `/profile_picture/${currentRecipientId}` || "/static/default_profile.jpg";

    msgDiv.innerHTML = `
        <div class="msg-detail">
            <div class="msg-content">
                <span class="msg-message">${message}</span>
                <span class="msg-time">${formattedTimestamp}</span>
            </div>
            <img class="msg-profile-pic" src="${profilePicUrl}" alt="${sender}'s Profile">
        </div>
    `;

    conversationArea.appendChild(msgDiv);

    // Add click event for selection (if needed)
    msgDiv.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
            this.classList.toggle('selected');
        }
    });

    // Ensure scrolling happens after the new message is added
    setTimeout(() => {
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }, 100);
    
    return msgDiv;
}



// Socket event handlers for message deletion
socket.on('message_deleted_for_me', function(data) {
    console.log('Socket: message_deleted_for_me', data);
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
        messageElement.classList.add('deleted');
        showToast('A message was deleted');
    }
});

socket.on('message_deleted_for_everyone', function(data) {
    console.log('Socket: message_deleted_for_everyone', data);
    const messageElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    if (messageElement) {
        messageElement.classList.add('deleted-for-all');
        setTimeout(() => {
            if (messageElement && messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
        showToast('A message was deleted for everyone');
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing message deletion...');
    initMessageContextMenu();
    
    // Test: Add some debug messages
    console.log('Current user ID:', currentUserId);
    console.log('Current recipient ID:', currentRecipientId);
});

// Debug function to check message IDs in DOM
function debugMessageIds() {
    const messages = document.querySelectorAll('.msg');
    console.log('Total messages in DOM:', messages.length);
    messages.forEach((msg, index) => {
        const msgId = msg.getAttribute('data-message-id');
        console.log(`Message ${index}: ID = ${msgId}, Class = ${msg.className}`);
    });
}