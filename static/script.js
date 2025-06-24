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

    recognition.onstart = () => {
        console.log("Voice recognition started...");
        txtMessage.placeholder = "Listening...";
        startVoiceButton.textContent = "Stop Voice"; // Update button text
        voiceAnimation.classList.add("active"); // Show screen animation
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript + " ";
            }
        }

        txtMessage.value = finalTranscript || interimTranscript; // Show interim results live
    };

    recognition.onend = () => {
        console.log("Voice recognition stopped.");
        txtMessage.placeholder = "Type a message...";
        isListening = false;
        startVoiceButton.textContent = "Start Voice"; // Reset button when recognition stops
        voiceAnimation.classList.remove("active"); // Hide screen animation
    };

    startVoiceButton.addEventListener("click", () => {
        if (isListening) {
            recognition.stop(); // Stop recognition if already running
        } else {
            recognition.start(); // Start recognition
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