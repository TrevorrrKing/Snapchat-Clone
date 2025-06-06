// Snapchat Clone JavaScript

class SnapchatClone {
    constructor() {
        this.currentStream = null;
        this.currentFilter = 'none';
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.currentChat = null;
        this.messages = this.loadMessages();
        this.stories = this.loadStories();
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCamera();
        this.setupFilters();
        this.setupCapture();
        this.setupChat();
        this.setupStories();
        this.setupProfile();
        this.startCamera();
    }

    // Navigation
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = btn.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Special handling for camera tab (center button)
        if (tabName === 'camera') {
            document.querySelector('.nav-btn:nth-child(3)').classList.add('active');
            this.startCamera();
        } else {
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            this.stopCamera();
        }
    }

    // Camera functionality
    async setupCamera() {
        this.video = document.getElementById('video-preview');
        this.canvas = document.getElementById('capture-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Switch camera button
        document.getElementById('switch-camera-btn').addEventListener('click', () => {
            this.switchCamera();
        });
        
        // Flash button
        document.getElementById('flash-btn').addEventListener('click', () => {
            this.toggleFlash();
        });
    }

    async startCamera() {
        try {
            if (this.currentStream) {
                this.stopCamera();
            }
            
            const constraints = {
                video: {
                    facingMode: this.facingMode || 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            };
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.currentStream;
            
            this.video.onloadedmetadata = () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            };
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Camera access denied. Please allow camera permissions.');
        }
    }

    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }

    async switchCamera() {
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        await this.startCamera();
    }

    toggleFlash() {
        const flashBtn = document.getElementById('flash-btn');
        const track = this.currentStream?.getVideoTracks()[0];
        
        if (track && track.getCapabilities().torch) {
            const constraints = {
                advanced: [{ torch: !this.flashEnabled }]
            };
            track.applyConstraints(constraints);
            this.flashEnabled = !this.flashEnabled;
            flashBtn.style.background = this.flashEnabled ? '#FFFC00' : 'rgba(0, 0, 0, 0.5)';
            flashBtn.style.color = this.flashEnabled ? '#000' : 'white';
        }
    }

    // Filters
    setupFilters() {
        const filterItems = document.querySelectorAll('.filter-item');
        filterItems.forEach(item => {
            item.addEventListener('click', () => {
                this.applyFilter(item.dataset.filter);
                
                // Update active filter
                filterItems.forEach(f => f.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        this.video.style.filter = filter;
    }

    // Capture functionality
    setupCapture() {
        document.getElementById('photo-btn').addEventListener('click', () => {
            this.takePhoto();
        });
        
        document.getElementById('video-btn').addEventListener('click', () => {
            this.toggleVideoRecording();
        });
        
        // Preview controls
        document.getElementById('retake-btn').addEventListener('click', () => {
            this.hidePreview();
        });
        
        document.getElementById('save-story-btn').addEventListener('click', () => {
            this.saveToStory();
        });
        
        document.getElementById('send-btn').addEventListener('click', () => {
            this.showSendOptions();
        });
    }

    takePhoto() {
        if (!this.video.videoWidth) return;
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Apply filter to canvas
        this.ctx.filter = this.currentFilter;
        this.ctx.drawImage(this.video, 0, 0);
        
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        this.showPreview(imageData, 'image');
        
        // Add capture animation
        this.addCaptureFlash();
    }

    toggleVideoRecording() {
        if (!this.isRecording) {
            this.startVideoRecording();
        } else {
            this.stopVideoRecording();
        }
    }

    async startVideoRecording() {
        try {
            const videoBtn = document.getElementById('video-btn');
            this.recordedChunks = [];
            
            this.mediaRecorder = new MediaRecorder(this.currentStream);
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const videoUrl = URL.createObjectURL(blob);
                this.showPreview(videoUrl, 'video');
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            videoBtn.style.background = '#ff4444';
            videoBtn.textContent = '⏹️';
            
        } catch (error) {
            console.error('Error starting video recording:', error);
        }
    }

    stopVideoRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            const videoBtn = document.getElementById('video-btn');
            videoBtn.style.background = '#FFFC00';
            videoBtn.textContent = '🎥';
        }
    }

    showPreview(mediaData, type) {
        const preview = document.getElementById('media-preview');
        const previewImage = document.getElementById('preview-image');
        const previewVideo = document.getElementById('preview-video');
        
        if (type === 'image') {
            previewImage.src = mediaData;
            previewImage.style.display = 'block';
            previewVideo.style.display = 'none';
        } else {
            previewVideo.src = mediaData;
            previewVideo.style.display = 'block';
            previewImage.style.display = 'none';
        }
        
        preview.classList.remove('hidden');
        this.currentMedia = { data: mediaData, type };
    }

    hidePreview() {
        document.getElementById('media-preview').classList.add('hidden');
        this.currentMedia = null;
    }

    addCaptureFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            z-index: 9999;
            animation: flash 0.3s ease-out;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flash {
                0% { opacity: 0; }
                50% { opacity: 0.8; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(flash);
        
        setTimeout(() => {
            document.body.removeChild(flash);
            document.head.removeChild(style);
        }, 300);
    }

    // Chat functionality
    setupChat() {
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', () => {
                const contact = item.dataset.contact;
                this.openChat(contact);
            });
        });
        
        document.getElementById('back-to-chats').addEventListener('click', () => {
            this.closeChat();
        });
        
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    openChat(contact) {
        this.currentChat = contact;
        document.querySelector('.chat-contact-name').textContent = contact;
        document.getElementById('chat-window').classList.remove('hidden');
        document.querySelector('.chat-list').style.display = 'none';
        
        this.loadChatMessages(contact);
        this.markAsRead(contact);
    }

    closeChat() {
        document.getElementById('chat-window').classList.add('hidden');
        document.querySelector('.chat-list').style.display = 'block';
        this.currentChat = null;
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        
        if (!text || !this.currentChat) return;
        
        const message = {
            id: Date.now(),
            text,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            contact: this.currentChat
        };
        
        this.addMessageToChat(message);
        this.saveMessage(message);
        input.value = '';
        
        // Simulate typing indicator and response
        this.showTypingIndicator();
        setTimeout(() => {
            this.simulateResponse();
        }, 2000);
    }

    addMessageToChat(message) {
        const messagesContainer = document.querySelector('.messages-container');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
        messageEl.innerHTML = `
            <div class="message-content">${message.text}</div>
            <div class="message-time">${message.timestamp}</div>
        `;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.querySelector('.messages-container');
        const typingEl = document.createElement('div');
        typingEl.className = 'message received typing-indicator';
        typingEl.innerHTML = '<div class="message-content">Typing...</div>';
        typingEl.id = 'typing-indicator';
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    simulateResponse() {
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();
        
        const responses = [
            "That's awesome! 😊",
            "Thanks for sharing!",
            "Cool photo!",
            "Let's hang out soon!",
            "Haha, nice one! 😄"
        ];
        
        const response = {
            id: Date.now(),
            text: responses[Math.floor(Math.random() * responses.length)],
            sender: this.currentChat,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            contact: this.currentChat
        };
        
        this.addMessageToChat(response);
        this.saveMessage(response);
    }

    loadChatMessages(contact) {
        const messagesContainer = document.querySelector('.messages-container');
        messagesContainer.innerHTML = '';
        
        const contactMessages = this.messages.filter(m => m.contact === contact);
        contactMessages.forEach(message => {
            this.addMessageToChat(message);
        });
    }

    markAsRead(contact) {
        const chatItem = document.querySelector(`[data-contact="${contact}"]`);
        const unreadBadge = chatItem.querySelector('.unread-badge');
        if (unreadBadge) {
            unreadBadge.style.display = 'none';
        }
    }

    // Stories functionality
    setupStories() {
        const storyItems = document.querySelectorAll('.story-item[data-story]');
        storyItems.forEach(item => {
            item.addEventListener('click', () => {
                const story = item.dataset.story;
                this.viewStory(story);
            });
        });
        
        document.getElementById('close-story').addEventListener('click', () => {
            this.closeStoryViewer();
        });
        
        document.getElementById('add-story-btn').addEventListener('click', () => {
            this.switchTab('camera');
        });
    }

    viewStory(storyName) {
        document.getElementById('story-viewer').classList.remove('hidden');
        
        // Simulate story content - in a real app, this would load actual media
        const storyImage = document.getElementById('story-image');
        storyImage.src = `data:image/svg+xml;base64,${btoa(`
            <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#FFFC00"/>
                <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="24" fill="#000">
                    ${storyName}'s Story
                </text>
            </svg>
        `)}`;
        
        this.markStoryAsViewed(storyName);
        this.startStoryProgress();
    }

    closeStoryViewer() {
        document.getElementById('story-viewer').classList.add('hidden');
    }

    markStoryAsViewed(storyName) {
        const storyItem = document.querySelector(`[data-story="${storyName}"]`);
        const avatar = storyItem.querySelector('.story-avatar');
        avatar.classList.remove('unviewed');
        avatar.classList.add('viewed');
    }

    startStoryProgress() {
        const progressBar = document.querySelector('.progress-bar::after');
        // Story auto-closes after 5 seconds
        setTimeout(() => {
            this.closeStoryViewer();
        }, 5000);
    }

    saveToStory() {
        if (!this.currentMedia) return;
        
        const story = {
            id: Date.now(),
            data: this.currentMedia.data,
            type: this.currentMedia.type,
            timestamp: Date.now()
        };
        
        this.stories.push(story);
        this.saveStories();
        this.hidePreview();
        
        this.showSuccess('Added to your story!');
    }

    showSendOptions() {
        // Simple implementation - just send to first contact
        if (this.currentMedia) {
            const message = {
                id: Date.now(),
                text: this.currentMedia.type === 'image' ? '📷 Photo' : '🎥 Video',
                sender: 'me',
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                contact: 'John Doe',
                media: this.currentMedia
            };
            
            this.saveMessage(message);
            this.hidePreview();
            this.showSuccess('Sent to John Doe!');
        }
    }

    // Profile and Settings
    setupProfile() {
        const autoSaveToggle = document.getElementById('auto-save-toggle');
        const privacyToggle = document.getElementById('privacy-toggle');
        
        // Load saved settings
        const settings = this.loadSettings();
        autoSaveToggle.checked = settings.autoSave || false;
        privacyToggle.checked = settings.privacy || false;
        
        // Save settings on change
        autoSaveToggle.addEventListener('change', () => {
            this.saveSetting('autoSave', autoSaveToggle.checked);
        });
        
        privacyToggle.addEventListener('change', () => {
            this.saveSetting('privacy', privacyToggle.checked);
        });
    }

    // Storage functions
    loadMessages() {
        try {
            return JSON.parse(localStorage.getItem('snapchat_messages') || '[]');
        } catch {
            return [];
        }
    }

    saveMessage(message) {
        this.messages.push(message);
        localStorage.setItem('snapchat_messages', JSON.stringify(this.messages));
    }

    loadStories() {
        try {
            return JSON.parse(localStorage.getItem('snapchat_stories') || '[]');
        } catch {
            return [];
        }
    }

    saveStories() {
        localStorage.setItem('snapchat_stories', JSON.stringify(this.stories));
    }

    loadSettings() {
        try {
            return JSON.parse(localStorage.getItem('snapchat_settings') || '{}');
        } catch {
            return {};
        }
    }

    saveSetting(key, value) {
        const settings = this.loadSettings();
        settings[key] = value;
        localStorage.setItem('snapchat_settings', JSON.stringify(settings));
    }

    // Utility functions
    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#ff4444' : '#FFFC00'};
            color: ${type === 'error' ? 'white' : '#000'};
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: 500;
            z-index: 9999;
            animation: slideDown 0.3s ease-out;
        `;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 3000);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnapchatClone();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}