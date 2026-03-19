
///////////////REDUCE THEME FLICKER//////////////////////////
(function() {
    'use strict';
    
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('themeColor');
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    
    // Apply theme classes immediately
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark-mode');
    }
    
    // Remove the critical styles after page loads (optional)
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            const criticalStyles = document.getElementById('critical-theme-styles');
            if (criticalStyles) {
                criticalStyles.disabled = true;
            }
        }, 100);
    });
})();
/////////////////////////////////////////////////////////////////////////
const socket = io(); // Initialize Socket.IO
let currentRecipientId = {{ default_recipient_id if default_recipient_id else 'null' }};
let currentUserId = {{ current_user.id }};
let lastDate = '';

window.onload = function () {
    let lastChatUserId = {{ last_chat_user_id if last_chat_user_id else 'null' }};
    if (lastChatUserId) {
        startChat(lastChatUserId, 'Recent User'); // Start the chat with the last user
    }
    // Start fetching recent chats and users every second
    setInterval(fetchRecentChats, 1000);
};

function logout() {
    fetch('/logout', { method: 'POST' })
        .then(() => window.location.href = '/login')
        .catch(error => console.error("Logout failed:", error));
}

document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('TxtMessage');
    const message = messageInput.value.trim();

    if (message && currentRecipientId) {
        const timestamp = new Date().toISOString();

        socket.emit('send_message', {
            sender_id: currentUserId,
            recipient_id: currentRecipientId,
            message: message,
            timestamp: timestamp
        });

        addMessageToConversation('You', message, true, timestamp, null, null, null, false, false);
        messageInput.value = ''; // Clear the input field
    }
});

function formatTimestamp(utcString) {
    const date = new Date(utcString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Update the addMessageToConversation function
function addMessageToConversation(sender, message, isSender, timestamp, senderProfilePic, receiverProfilePic, messageId = null, canDeleteForEveryone = false, isDeleted = false) {
    const conversationArea = document.getElementById('conversation-area');
    const formattedTimestamp = formatTimestamp(timestamp);
    const msgDiv = document.createElement('div');
    msgDiv.className = isSender ? 'msg sender' : 'msg receiver';
    
    if (isDeleted) {
        msgDiv.classList.add('deleted');
        message = '[Deleted]';
    }
    
    msgDiv.dataset.messageId = messageId;
    msgDiv.dataset.senderId = isSender ? currentUserId : currentRecipientId;
    msgDiv.dataset.canDeleteForEveryone = canDeleteForEveryone;
    
    const messageDate = new Date(timestamp).toDateString();
    
    if (messageDate !== lastDate) {
        lastDate = messageDate;
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

    setTimeout(() => {
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }, 100);
}

// Listen for deletion events from socket
socket.on('message_deleted', function(data) {
    const msgElement = document.querySelector(`[data-message-id="${data.message_id}"]`);
    
    if (msgElement) {
        if (data.delete_type === 'for_everyone') {
            msgElement.classList.add('deleted');
            const msgContent = msgElement.querySelector('.msg-message');
            if (msgContent) {
                msgContent.textContent = '[This message was deleted]';
            }
            // Hide delete button
            const deleteBtn = msgElement.querySelector('.msg-delete-btn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }
});

socket.on("user_online", (data) => {
    // Check if the user is the current recipient
    if (data.user_id === currentRecipientId) {
        updateStatusElement(data.user_id, true);
    }
});

socket.on("user_offline", (data) => {
    // Check if the user is the current recipient
    if (data.user_id === currentRecipientId) {
        updateStatusElement(data.user_id, false);
    }
});

socket.on('receive_message', (data) => {
    if (data.recipient_id === currentUserId) {
        addMessageToConversation(
            data.sender_id === currentUserId ? 'You' : data.sender_username, 
            data.message, 
            false,
            data.timestamp,
            data.sender_profile_picture,
            `/profile_picture/${data.sender_id}`,
            data.message_id,
            data.sender_id === currentUserId,
            false
        );
        fetchRecentChats();
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const threeDotsButton = document.getElementById("three-dots");
    const menuDropdown = document.getElementById("menuDropdown");

    // Toggle dropdown visibility
    if (threeDotsButton) {
        threeDotsButton.addEventListener("click", function(event) {
            event.stopPropagation();
            if (menuDropdown) {
                menuDropdown.style.display = menuDropdown.style.display === "block" ? "none" : "block";
            }
        });
    }

    // Close dropdown when clicking outside
    window.addEventListener("click", function() {
        if (menuDropdown) {
            menuDropdown.style.display = "none";
        }
    });
});

async function clearChat() {
    const conversationArea = document.getElementById('conversation-area');
    const chatWith = document.getElementById('chat-with').innerText;

    const confirmation = confirm("Are you sure you want to clear the chat? Once deleted, it cannot be recovered.");

    if (confirmation) {
        conversationArea.innerHTML = '';
        // Call the API to clear the chat in db
        await fetch(`/clear_chat/${currentRecipientId}`, { method: 'POST' });
        alert("Chat with " + chatWith + " has been cleared.");
    }
}

function startChat(recipientId, username) {
    currentRecipientId = recipientId;

    // Update the chat header with the username
    document.getElementById('chat-with').innerText = username;
    document.getElementById('profile-details').innerText = `${username}`;

    // Set profile picture source dynamically
    const profilePicDetail = document.getElementById('chat-profile-picture');
    const profilePicElement = document.getElementById('chat-profile-pic');
    profilePicElement.src = `/profile_picture/${recipientId}`;
    profilePicElement.style.display = 'block';
    profilePicDetail.src = `/profile_picture/${recipientId}`;
    profilePicDetail.style.display = 'block';

    // Fetch chat messages
    fetchMessages(recipientId);

    // Fetch the recipient's online status
    fetch(`/user_status/${recipientId}`)
        .then(response => response.json())
        .then(data => {
            updateStatusElement(recipientId, data.online);
        })
        .catch(error => console.error('Error fetching user status:', error));
}

function updateStatusElement(userId, isOnline) {
    const statusElement = document.getElementById('user-online-status');
    if (statusElement) {
        if (isOnline) {
            statusElement.innerText = " online";
            statusElement.style.color = "green";
            statusElement.classList.add('online');
            statusElement.classList.remove('offline');
        } else {
            statusElement.innerText = " offline";
            statusElement.style.color = "red";
            statusElement.classList.add('offline');
            statusElement.classList.remove('online');
        }
    }
}

// Update fetchMessages function
async function fetchMessages(recipientId) {
    try {
        const response = await fetch(`/get_messages/${recipientId}`);
        const messages = await response.json();
        const conversationArea = document.getElementById('conversation-area');
        conversationArea.innerHTML = '';
        lastDate = ''; // Reset date tracking
        
        messages.forEach(msg => {
            const isSender = msg.sender_id === currentUserId;
            addMessageToConversation(
                msg.username, 
                msg.display_message || msg.message, 
                isSender, 
                msg.timestamp, 
                null, 
                null,
                msg.message_id,
                msg.can_delete_for_everyone || false,
                msg.is_deleted || false
            );
        });
        
        conversationArea.scrollTop = conversationArea.scrollHeight;
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

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
            // Close any open dropdowns
            document.querySelectorAll('.delete-dropdown').forEach(d => d.classList.remove('show'));
            
            // Update message display immediately
            const msgElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (msgElement) {
                msgElement.classList.add('deleted');
                const msgContent = msgElement.querySelector('.msg-message');
                if (msgContent) {
                    if (deleteType === 'for_everyone') {
                        msgContent.textContent = '[This message was deleted]';
                    } else if (deleteType === 'for_me') {
                        const isSender = parseInt(msgElement.dataset.senderId) === currentUserId;
                        msgContent.textContent = isSender ? '[You deleted this message]' : '[Message deleted]';
                    }
                }
            }
        } else {
            alert(result.error || 'Failed to delete message');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.msg-delete-btn') && !e.target.closest('.delete-dropdown')) {
        document.querySelectorAll('.delete-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

async function fetchRecentChats() {
    try {
        const response = await fetch('/get_recent_chats');
        const recentChats = await response.json();
        const recentChatsArea = document.getElementById('recent-chats');
        let searchInput = document.getElementById("recent-user-search").value.toLowerCase();
        let selectedUserId = localStorage.getItem("selectedUserId");

        // Store existing chat IDs to check for changes
        const existingChatIds = Array.from(recentChatsArea.children).map(item => item.dataset.userId);
        const newChatIds = recentChats.map(chat => chat.user_id);

        // If no changes, do nothing
        if (JSON.stringify(existingChatIds) === JSON.stringify(newChatIds)) {
            return;
        }

        recentChatsArea.innerHTML = '';

        recentChats.forEach((chat) => {
            const { user_id, username, profile_picture, is_online } = chat;

            // Create list item for chat
            const chatItem = document.createElement('li');
            chatItem.classList.add('chat-item');
            chatItem.dataset.userId = user_id;
            chatItem.dataset.online = is_online;
            chatItem.onclick = () => {
                startChat(user_id, username);
                localStorage.setItem("selectedUserId", user_id);
                updateSelectedChat();
            };       

            // Create profile picture container with online indicator
            const profilePicContainer = document.createElement('div');
            profilePicContainer.className = 'profile-pic-container';
            
            // Create profile picture element
            const profilePic = document.createElement('img');
            profilePic.src = profile_picture || '/static/default_profile.jpg';
            profilePic.alt = `${username}'s profile picture`;
            profilePic.classList.add('profile-pic');

            // Create online status indicator
            if (is_online) {
                const onlineIndicator = document.createElement('span');
                onlineIndicator.className = 'online-indicator';
                onlineIndicator.title = 'Online';
                profilePicContainer.appendChild(onlineIndicator);
            }

            profilePicContainer.appendChild(profilePic);

            // Create username text element with online status
            const usernameText = document.createElement('span');
            usernameText.className = 'username-text';
            usernameText.innerText = username;

            // Append elements
            chatItem.appendChild(profilePicContainer);
            chatItem.appendChild(usernameText);
            recentChatsArea.appendChild(chatItem);
        });

        // Reapply selection after reloading
        updateSelectedChat();
        
        if (searchInput) {
            searchRecentUsers();
        }
    } catch (error) {
        console.error("Error fetching recent chats:", error);
    }
}
// Function to update selected chat after list reload
function updateSelectedChat() {
    let selectedUserId = localStorage.getItem("selectedUserId");
    if (selectedUserId) {
        let selectedChat = document.querySelector(`#recent-chats li[data-user-id="${selectedUserId}"]`);
        if (selectedChat) {
            document.querySelectorAll("#recent-chats li").forEach(li => li.classList.remove("selected"));
            selectedChat.classList.add("selected");
        }
    }
}

function searchUsers() {
    const searchQuery = document.getElementById('user-search').value.toLowerCase();
    const userList = document.getElementById('user-list');
    const users = userList.getElementsByTagName('li');

    Array.from(users).forEach(user => {
        const username = user.innerText.toLowerCase();
        if (username.includes(searchQuery)) {
            user.style.display = '';
        } else {
            user.style.display = 'none';
        }
    });
}

function searchRecentUsers() {
    let input = document.getElementById("recent-user-search").value.toLowerCase();
    let chatList = document.getElementById("recent-chats");
    let users = chatList.getElementsByTagName("li");

    for (let user of users) {
        let username = user.textContent || user.innerText;
        if (username.toLowerCase().includes(input)) {
            user.style.display = "";
        } else {
            user.style.display = "none";
        }
    }
}

// Enter key to send message
document.getElementById('TxtMessage').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        document.getElementById("send-button").click();
    }
});

// Mobile view functions
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


document.addEventListener('DOMContentLoaded', function() {
    fetchRecentChats();
});
