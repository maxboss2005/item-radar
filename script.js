// Application state
let appState = {
    items: [],
    currentLocation: null,
    currentItem: null,
    map: null,
    userMarker: null,
    itemMarker: null,
    watchId: null,
    currentImage: null,
    cameraStream: null,
    facingMode: 'environment'
};

// DOM Elements
const domElements = {
    itemName: document.getElementById('itemName'),
    takePhotoBtn: document.getElementById('takePhotoBtn'),
    uploadPhotoBtn: document.getElementById('uploadPhotoBtn'),
    photoUpload: document.getElementById('photoUpload'),
    photoPreview: document.getElementById('photoPreview'),
    getLocationBtn: document.getElementById('getLocationBtn'),
    saveItemBtn: document.getElementById('saveItemBtn'),
    savedItemsList: document.getElementById('savedItemsList'),
    searchItems: document.getElementById('searchItems'),
    itemCount: document.getElementById('itemCount'),
    map: document.getElementById('map'),
    centerMapBtn: document.getElementById('centerMapBtn'),
    distanceDisplay: document.getElementById('distanceDisplay'),
    cameraModal: document.getElementById('cameraModal'),
    cameraFeed: document.getElementById('cameraFeed'),
    photoCanvas: document.getElementById('photoCanvas'),
    captureBtn: document.getElementById('captureBtn'),
    switchCameraBtn: document.getElementById('switchCameraBtn'),
    closeModalButtons: document.querySelectorAll('.close-modal'),
    notificationToast: document.getElementById('notificationToast'),
    toastMessage: document.getElementById('toastMessage'),
    currentLocationInfo: document.getElementById('currentLocationInfo')
};

// Initialize the application
function init() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Load saved items from localStorage
    loadItems();
    
    // Initialize map
    initMap();
    
    // Get user's current location
    getCurrentLocation();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start watching user location
    startWatchingLocation();
    
    // Update item count
    updateItemCount();
    
    // Display initial items
    renderItems();
}

// Initialize the map
function initMap() {
    // Default center (London)
    const defaultCenter = [51.505, -0.09];
    
    // Initialize the map
    appState.map = L.map('map').setView(defaultCenter, 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(appState.map);
    
    // Add scale control
    L.control.scale().addTo(appState.map);
}

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by your browser', 'error');
        domElements.currentLocationInfo.textContent = 'Geolocation not supported';
        return;
    }
    
    domElements.currentLocationInfo.textContent = 'Getting location...';
    domElements.getLocationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            appState.currentLocation = { lat: latitude, lng: longitude };
            
            // Update location info
            domElements.currentLocationInfo.innerHTML = `
                <i class="fas fa-check-circle" style="color: #27ae60;"></i>
                Location saved: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
            `;
            
            // Update user marker on map
            updateUserMarker();
            
            // Center map on user
            if (appState.map) {
                appState.map.setView([latitude, longitude], 13);
            }
            
            domElements.getLocationBtn.disabled = false;
            
            // Update distance if an item is selected
            if (appState.currentItem) {
                updateDistance();
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            domElements.currentLocationInfo.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                Could not get location: ${error.message}
            `;
            domElements.getLocationBtn.disabled = false;
            showNotification('Could not get your location. Please try again.', 'error');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// Start watching location for real-time updates
function startWatchingLocation() {
    if (!navigator.geolocation) return;
    
    appState.watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            appState.currentLocation = { lat: latitude, lng: longitude };
            
            // Update user marker
            updateUserMarker();
            
            // Update distance if an item is selected
            if (appState.currentItem) {
                updateDistance();
                
                // Show notification if user is close to item (within 100m)
                const distance = calculateDistance(
                    appState.currentLocation.lat, 
                    appState.currentLocation.lng,
                    appState.currentItem.location.lat, 
                    appState.currentItem.location.lng
                );
                
                if (distance <= 100 && distance > 0) {
                    showNotification(`You're within ${Math.round(distance)}m of "${appState.currentItem.name}"!`, 'info');
                }
            }
        },
        (error) => {
            console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
    );
}

// Update user marker on map
function updateUserMarker() {
    if (!appState.currentLocation || !appState.map) return;
    
    const { lat, lng } = appState.currentLocation;
    
    // Remove existing marker
    if (appState.userMarker) {
        appState.map.removeLayer(appState.userMarker);
    }
    
    // Create new marker
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="background-color: #3498db; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #2980b9;"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });
    
    appState.userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(appState.map)
        .bindPopup('Your current location')
        .openPopup();
}

// Update item marker on map
function updateItemMarker(item) {
    if (!item || !appState.map) return;
    
    // Remove existing item marker
    if (appState.itemMarker) {
        appState.map.removeLayer(appState.itemMarker);
    }
    
    const { lat, lng } = item.location;
    
    // Create item marker
    const itemIcon = L.divIcon({
        className: 'item-marker',
        html: `<div style="background-color: #e74c3c; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #c0392b;"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });
    
    appState.itemMarker = L.marker([lat, lng], { icon: itemIcon })
        .addTo(appState.map)
        .bindPopup(`<strong>${item.name}</strong><br>Saved on ${formatDate(item.date)}`)
        .openPopup();
    
    // Fit map to show both markers
    if (appState.currentLocation) {
        const bounds = L.latLngBounds(
            [appState.currentLocation.lat, appState.currentLocation.lng],
            [lat, lng]
        );
        appState.map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Calculate distance between two coordinates (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Convert degrees to radians
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

// Update distance display
function updateDistance() {
    if (!appState.currentLocation || !appState.currentItem) {
        domElements.distanceDisplay.textContent = '--';
        return;
    }
    
    const distance = calculateDistance(
        appState.currentLocation.lat, 
        appState.currentLocation.lng,
        appState.currentItem.location.lat, 
        appState.currentItem.location.lng
    );
    
    let displayText;
    if (distance < 1000) {
        displayText = `${Math.round(distance)} meters`;
    } else {
        displayText = `${(distance / 1000).toFixed(2)} km`;
    }
    
    domElements.distanceDisplay.textContent = displayText;
}

// Load items from localStorage
function loadItems() {
    const savedItems = localStorage.getItem('lostAndFoundItems');
    if (savedItems) {
        appState.items = JSON.parse(savedItems);
    }
}

// Save items to localStorage
function saveItems() {
    localStorage.setItem('lostAndFoundItems', JSON.stringify(appState.items));
    updateItemCount();
}

// Update item count display
function updateItemCount() {
    domElements.itemCount.textContent = appState.items.length;
}

// Render items in the sidebar
function renderItems(filter = '') {
    const filteredItems = filter 
        ? appState.items.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase()))
        : appState.items;
    
    if (filteredItems.length === 0) {
        domElements.savedItemsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No items found</p>
                <p class="subtext">${filter ? 'Try a different search term' : 'Add your first item using the form above'}</p>
            </div>
        `;
        return;
    }
    
    domElements.savedItemsList.innerHTML = filteredItems.map((item, index) => {
        // Calculate distance if we have current location
        let distanceText = '';
        if (appState.currentLocation) {
            const distance = calculateDistance(
                appState.currentLocation.lat, 
                appState.currentLocation.lng,
                item.location.lat, 
                item.location.lng
            );
            
            if (distance < 1000) {
                distanceText = `${Math.round(distance)}m away`;
            } else {
                distanceText = `${(distance / 1000).toFixed(1)}km away`;
            }
        }
        
        return `
            <div class="item-card ${appState.currentItem === item ? 'active' : ''}" data-index="${index}">
                <div class="item-card-image">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}">` : 
                        `<div style="background-color: #c3cfe2; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-image" style="color: #4a6491; font-size: 2rem;"></i>
                        </div>`
                    }
                </div>
                <div class="item-card-content">
                    <div class="item-card-header">
                        <div class="item-card-name">${item.name}</div>
                        <div class="item-card-date">${formatDate(item.date)}</div>
                    </div>
                    <div class="item-card-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}
                    </div>
                    ${distanceText ? `
                        <div class="item-card-distance">
                            <i class="fas fa-ruler-combined"></i>
                            ${distanceText}
                        </div>
                    ` : ''}
                    <div class="item-card-actions">
                        <button class="delete-btn" data-index="${index}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners to item cards
    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if delete button was clicked
            if (e.target.closest('.delete-btn')) return;
            
            const index = parseInt(card.dataset.index);
            const item = filteredItems[index];
            
            // Find original index in appState.items
            const originalIndex = appState.items.findIndex(i => i.id === item.id);
            
            selectItem(originalIndex);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteItem(index);
        });
    });
}

// Select an item to display on map
function selectItem(index) {
    if (index < 0 || index >= appState.items.length) return;
    
    appState.currentItem = appState.items[index];
    
    // Update UI
    renderItems(domElements.searchItems.value);
    
    // Update map with item marker
    updateItemMarker(appState.currentItem);
    
    // Update distance
    updateDistance();
    
    showNotification(`Now viewing "${appState.currentItem.name}" on map`, 'success');
}

// Delete an item
function deleteItem(index) {
    if (index < 0 || index >= appState.items.length) return;
    
    const itemName = appState.items[index].name;
    
    if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
        // Remove item from array
        appState.items.splice(index, 1);
        
        // If the deleted item was currently selected, clear selection
        if (appState.currentItem && appState.items.indexOf(appState.currentItem) === -1) {
            appState.currentItem = null;
            
            // Remove item marker from map
            if (appState.itemMarker) {
                appState.map.removeLayer(appState.itemMarker);
                appState.itemMarker = null;
            }
            
            // Clear distance display
            domElements.distanceDisplay.textContent = '--';
        }
        
        // Save to localStorage and re-render
        saveItems();
        renderItems(domElements.searchItems.value);
        
        showNotification(`"${itemName}" has been deleted`, 'success');
    }
}

// Save a new item
function saveItem() {
    // Validate input
    const name = domElements.itemName.value.trim();
    if (!name) {
        showNotification('Please enter an item name', 'error');
        domElements.itemName.focus();
        return;
    }
    
    if (!appState.currentLocation) {
        showNotification('Please get your current location first', 'error');
        return;
    }
    
    // Create new item object
    const newItem = {
        id: Date.now(), // Simple unique ID
        name: name,
        image: appState.currentImage,
        location: { ...appState.currentLocation },
        date: new Date().toISOString()
    };
    
    // Add to items array
    appState.items.push(newItem);
    
    // Save to localStorage
    saveItems();
    
    // Reset form
    domElements.itemName.value = '';
    appState.currentImage = null;
    domElements.photoPreview.innerHTML = `
        <i class="fas fa-image"></i>
        <p>No photo selected</p>
    `;
    
    // Render updated items list
    renderItems();
    
    // Select the new item
    selectItem(appState.items.length - 1);
    
    // Show success message
    showNotification(`"${name}" saved successfully!`, 'success');
}

// Open camera modal
function openCamera() {
    domElements.cameraModal.style.display = 'flex';
    
    // Start camera
    startCamera();
}

// Start camera stream
function startCamera() {
    const constraints = {
        video: { facingMode: appState.facingMode },
        audio: false
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            appState.cameraStream = stream;
            domElements.cameraFeed.srcObject = stream;
        })
        .catch((error) => {
            console.error('Error accessing camera:', error);
            showNotification('Could not access camera. Please check permissions.', 'error');
            closeCameraModal();
        });
}

// Capture photo from camera
function capturePhoto() {
    const canvas = domElements.photoCanvas;
    const video = domElements.cameraFeed;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    appState.currentImage = imageData;
    
    // Update preview
    domElements.photoPreview.innerHTML = `<img src="${imageData}" alt="Captured photo">`;
    
    // Close modal and stop camera
    closeCameraModal();
    
    showNotification('Photo captured successfully!', 'success');
}

// Switch camera (front/back)
function switchCamera() {
    // Stop current stream
    if (appState.cameraStream) {
        appState.cameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Toggle facing mode
    appState.facingMode = appState.facingMode === 'environment' ? 'user' : 'environment';
    
    // Restart camera with new facing mode
    startCamera();
}

// Close camera modal
function closeCameraModal() {
    domElements.cameraModal.style.display = 'none';
    
    // Stop camera stream
    if (appState.cameraStream) {
        appState.cameraStream.getTracks().forEach(track => track.stop());
        appState.cameraStream = null;
    }
}

// Handle photo upload
function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        appState.currentImage = event.target.result;
        domElements.photoPreview.innerHTML = `<img src="${event.target.result}" alt="Uploaded photo">`;
        showNotification('Photo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// Show notification toast
function showNotification(message, type = 'success') {
    const toast = domElements.notificationToast;
    const toastMsg = domElements.toastMessage;
    
    // Set message
    toastMsg.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        toast.style.backgroundColor = '#e74c3c';
    } else if (type === 'info') {
        toast.style.backgroundColor = '#3498db';
    } else {
        toast.style.backgroundColor = '#27ae60';
    }
    
    // Show toast
    toast.style.display = 'block';
    
    // Hide after 4 seconds
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Set up all event listeners
function setupEventListeners() {
    // Take photo button
    domElements.takePhotoBtn.addEventListener('click', openCamera);
    
    // Upload photo button
    domElements.uploadPhotoBtn.addEventListener('click', () => {
        domElements.photoUpload.click();
    });
    
    // Photo upload input
    domElements.photoUpload.addEventListener('change', handlePhotoUpload);
    
    // Get location button
    domElements.getLocationBtn.addEventListener('click', getCurrentLocation);
    
    // Save item button
    domElements.saveItemBtn.addEventListener('click', saveItem);
    
    // Center map button
    domElements.centerMapBtn.addEventListener('click', () => {
        if (appState.currentLocation && appState.map) {
            appState.map.setView([appState.currentLocation.lat, appState.currentLocation.lng], 13);
            showNotification('Map centered on your location', 'info');
        } else {
            showNotification('Location not available', 'error');
        }
    });
    
    // Search items
    domElements.searchItems.addEventListener('input', (e) => {
        renderItems(e.target.value);
    });
    
    // Camera modal buttons
    domElements.captureBtn.addEventListener('click', capturePhoto);
    domElements.switchCameraBtn.addEventListener('click', switchCamera);
    
    // Close modal buttons
    domElements.closeModalButtons.forEach(btn => {
        btn.addEventListener('click', closeCameraModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === domElements.cameraModal) {
            closeCameraModal();
        }
    });
    
    // Allow saving with Enter key in item name field
    domElements.itemName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveItem();
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);