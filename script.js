// TraceIt - Real-Time Item Finder
// Core Application Logic

class TraceItApp {
    constructor() {
        // State management
        this.items = new Map();
        this.currentLocation = null;
        this.currentItem = null;
        this.liveTracking = false;
        this.cameraActive = false;
        this.soundEnabled = true;
        this.vibrationEnabled = false;
        this.watchId = null;
        this.trackingInterval = null;
        
        // Hardware simulation (when real hardware unavailable)
        this.simulatedDevices = new Map();
        this.simulatedLocation = null;
        
        // DOM Elements
        this.elements = {};
        
        // Initialize app
        this.init();
    }

    // Initialize the application
    init() {
        this.cacheDOM();
        this.loadItems();
        this.initHardware();
        this.setupEventListeners();
        this.updateStats();
        this.logActivity('App initialized', 'system');
    }

    // Cache DOM elements
    cacheDOM() {
        this.elements = {
            // Dashboard
            itemCount: document.getElementById('itemCount'),
            locationStatus: document.getElementById('locationStatus'),
            bluetoothStatus: document.getElementById('bluetoothStatus'),
            lastUpdate: document.getElementById('lastUpdate'),
            activityLog: document.getElementById('activityLog'),
            
            // Hardware status
            gpsStatus: document.getElementById('gpsStatus'),
            compassStatus: document.getElementById('compassStatus'),
            bluetoothSignal: document.getElementById('bluetoothSignal'),
            
            // Save item form
            currentLocation: document.getElementById('currentLocation'),
            currentLat: document.getElementById('currentLat'),
            currentLng: document.getElementById('currentLng'),
            
            // Live finder
            radarContainer: document.getElementById('radarContainer'),
            targetMarker: document.getElementById('targetMarker'),
            distanceRing: document.getElementById('distanceRing'),
            directionArrow: document.getElementById('directionArrow'),
            distanceValue: document.getElementById('distanceValue'),
            directionValue: document.getElementById('directionValue'),
            rssiValue: document.getElementById('rssiValue'),
            lastSeenValue: document.getElementById('lastSeenValue'),
            proximityFeedback: document.getElementById('proximityFeedback'),
            
            // Camera
            cameraFeed: document.getElementById('cameraFeed'),
            cameraCanvas: document.getElementById('cameraCanvas'),
            matchFill: document.getElementById('matchFill')
        };
    }

    // Initialize hardware sensors
    initHardware() {
        console.log('Initializing hardware sensors...');
        
        // Start watching geolocation (real GPS)
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.handleLocationUpdate(position);
                },
                (error) => {
                    console.warn('GPS unavailable, using simulation:', error.message);
                    this.simulateLocation();
                    this.elements.gpsStatus.textContent = 'Simulated';
                    this.elements.locationStatus.textContent = 'Simulated';
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        } else {
            console.log('Geolocation API not available, using simulation');
            this.simulateLocation();
        }

        // Initialize orientation/compass
        if ('ondeviceorientationabsolute' in window) {
            window.addEventListener('deviceorientationabsolute', (e) => {
                this.handleOrientation(e);
            });
        } else if ('ondeviceorientation' in window) {
            window.addEventListener('deviceorientation', (e) => {
                this.handleOrientation(e);
            });
        } else {
            console.log('Device orientation not available');
            this.elements.compassStatus.textContent = 'Simulated';
        }

        // Initialize motion sensors
        if ('ondevicemotion' in window) {
            window.addEventListener('devicemotion', (e) => {
                this.handleMotion(e);
            });
        }

        // Bluetooth simulation setup
        this.initBluetoothSimulation();
    }

    // Handle real GPS location updates
    handleLocationUpdate(position) {
        this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
        };

        // Update UI
        if (this.elements.currentLocation) {
            this.elements.currentLocation.textContent = 'Location acquired';
        }
        if (this.elements.currentLat && this.elements.currentLng) {
            this.elements.currentLat.textContent = this.currentLocation.lat.toFixed(6);
            this.elements.currentLng.textContent = this.currentLocation.lng.toFixed(6);
        }

        // Update simulated location for consistency
        this.simulatedLocation = this.currentLocation;

        // Log activity
        this.logActivity('Location updated', 'gps');
        this.updateLastUpdateTime();
    }

    // Simulate location when GPS is unavailable
    simulateLocation() {
        // Start from a default location (San Francisco)
        this.simulatedLocation = {
            lat: 37.7749,
            lng: -122.4194,
            accuracy: 50,
            timestamp: new Date()
        };

        this.currentLocation = this.simulatedLocation;

        // Create simulated movement
        setInterval(() => {
            if (this.simulatedLocation) {
                // Small random movement (simulating walking)
                const latChange = (Math.random() - 0.5) * 0.0001;
                const lngChange = (Math.random() - 0.5) * 0.0001;
                
                this.simulatedLocation.lat += latChange;
                this.simulatedLocation.lng += lngChange;
                this.simulatedLocation.timestamp = new Date();
                
                this.currentLocation = this.simulatedLocation;
                
                // Update UI if needed
                if (this.elements.currentLat && this.elements.currentLng) {
                    this.elements.currentLat.textContent = this.currentLocation.lat.toFixed(6);
                    this.elements.currentLng.textContent = this.currentLocation.lng.toFixed(6);
                }
            }
        }, 5000);
    }

    // Handle device orientation (compass)
    handleOrientation(event) {
        if (event.alpha !== null) {
            const heading = event.alpha;
            // Update compass direction
            if (this.elements.directionArrow) {
                this.elements.directionArrow.style.transform = `rotate(${heading}deg)`;
            }
        }
    }

    // Handle device motion
    handleMotion(event) {
        // This can be used for step detection or movement analysis
        if (event.acceleration && event.acceleration.x !== null) {
            // Calculate movement intensity
            const intensity = Math.sqrt(
                Math.pow(event.acceleration.x, 2) +
                Math.pow(event.acceleration.y, 2) +
                Math.pow(event.acceleration.z, 2)
            );
            
            // If user is moving significantly, update location more frequently
            if (intensity > 2 && this.liveTracking) {
                this.updateTracking();
            }
        }
    }

    // Initialize Bluetooth device simulation
    initBluetoothSimulation() {
        console.log('Initializing Bluetooth simulation');
        
        // In production, this would use Web Bluetooth API
        // For simulation, create virtual Bluetooth devices
        
        setInterval(() => {
            // Update simulated Bluetooth signal strength
            this.updateBluetoothSimulation();
        }, 2000);
    }

    updateBluetoothSimulation() {
        // Simulate Bluetooth RSSI values for tracked items
        this.items.forEach((item, id) => {
            if (!this.simulatedDevices.has(id)) {
                this.simulatedDevices.set(id, {
                    rssi: -70 + Math.random() * 40, // Random RSSI between -70 and -30
                    lastUpdate: new Date(),
                    distance: this.calculateDistance(item.location, this.currentLocation)
                });
            } else {
                const device = this.simulatedDevices.get(id);
                // Update RSSI based on distance
                const distance = this.calculateDistance(item.location, this.currentLocation);
                device.distance = distance;
                device.rssi = this.calculateRSSIFromDistance(distance);
                device.lastUpdate = new Date();
            }
        });
    }

    // Calculate RSSI based on distance (simulated)
    calculateRSSIFromDistance(distance) {
        // Simple path loss model: RSSI = -10 * n * log10(d) + C
        const n = 2.0; // Path loss exponent
        const C = -40; // RSSI at 1 meter
        const rssi = -10 * n * Math.log10(Math.max(distance, 1)) + C;
        return Math.min(Math.max(rssi, -100), -30) + (Math.random() * 10 - 5); // Add some noise
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(coord1, coord2) {
        if (!coord1 || !coord2) return 0;
        
        const R = 6371e3; // Earth's radius in meters
        const φ1 = coord1.lat * Math.PI / 180;
        const φ2 = coord2.lat * Math.PI / 180;
        const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
        const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Setup event listeners
    setupEventListeners() {
        // Photo upload
        const photoUpload = document.getElementById('photoUpload');
        if (photoUpload) {
            photoUpload.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        }

        // Watch for item selection in finder
        const finderSelect = document.getElementById('finderItemSelect');
        if (finderSelect) {
            finderSelect.addEventListener('change', () => {
                this.selectFinderItem();
            });
        }
    }

    // Page navigation
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            
            // Initialize page-specific content
            switch(pageId) {
                case 'dashboard':
                    this.updateStats();
                    break;
                case 'trackedItems':
                    this.loadTrackedItems();
                    break;
                case 'saveItem':
                    this.initSaveItemPage();
                    break;
                case 'liveFinder':
                    this.initLiveFinderPage();
                    break;
            }
        }
    }

    // Initialize save item page
    initSaveItemPage() {
        // Update current location display
        if (this.currentLocation) {
            this.elements.currentLocation.textContent = 'Location ready';
            this.elements.currentLat.textContent = this.currentLocation.lat.toFixed(6);
            this.elements.currentLng.textContent = this.currentLocation.lng.toFixed(6);
        }
    }

    // Initialize live finder page
    initLiveFinderPage() {
        this.populateFinderItems();
        this.stopLiveTracking(); // Ensure tracking is stopped
    }

    // Populate items in finder dropdown
    populateFinderItems() {
        const select = document.getElementById('finderItemSelect');
        if (!select) return;
        
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add items
        this.items.forEach((item, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }

    // Handle item selection in finder
    selectFinderItem() {
        const select = document.getElementById('finderItemSelect');
        const itemId = select.value;
        
        if (!itemId) {
            this.currentItem = null;
            this.updateProximityFeedback('Select an item to begin tracking');
            return;
        }
        
        this.currentItem = this.items.get(itemId);
        if (this.currentItem) {
            this.updateProximityFeedback(`Tracking ${this.currentItem.name}`);
            this.updateLastSeenTime(this.currentItem);
        }
    }

    // Start live tracking
    startLiveTracking() {
        if (!this.currentItem) {
            alert('Please select an item to track first');
            return;
        }
        
        this.liveTracking = true;
        
        // Enable/disable buttons
        document.getElementById('startTrackingBtn').disabled = true;
        document.getElementById('stopTrackingBtn').disabled = false;
        
        // Start tracking loop
        this.trackingInterval = setInterval(() => {
            this.updateTracking();
        }, 1000); // Update every second
        
        this.logActivity(`Started tracking ${this.currentItem.name}`, 'tracking');
        this.updateProximityFeedback(`Tracking ${this.currentItem.name} - Getting signal...`);
    }

    // Stop live tracking
    stopLiveTracking() {
        this.liveTracking = false;
        
        // Enable/disable buttons
        document.getElementById('startTrackingBtn').disabled = false;
        document.getElementById('stopTrackingBtn').disabled = true;
        
        // Clear tracking interval
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        
        // Reset radar
        this.resetRadar();
        
        this.logActivity('Stopped tracking', 'tracking');
        this.updateProximityFeedback('Tracking stopped');
    }

    // Stop finder completely
    stopLiveFinder() {
        this.stopLiveTracking();
        this.currentItem = null;
        
        // Reset finder selection
        const select = document.getElementById('finderItemSelect');
        if (select) select.value = '';
    }

    // Update tracking display
    updateTracking() {
        if (!this.currentItem || !this.currentLocation) return;
        
        // Calculate current distance
        const distance = this.calculateDistance(this.currentItem.location, this.currentLocation);
        
        // Get simulated Bluetooth data
        let rssi = -70;
        if (this.simulatedDevices.has(this.currentItem.id)) {
            const device = this.simulatedDevices.get(this.currentItem.id);
            rssi = device.rssi;
        }
        
        // Calculate direction
        const direction = this.calculateDirection(this.currentItem.location, this.currentLocation);
        
        // Update UI
        this.updateRadar(distance, direction);
        this.updateStatsDisplay(distance, direction, rssi);
        this.updateProximityFeedbackBasedOnDistance(distance);
        
        // Update sound and vibration
        this.updateProximityEffects(distance);
        
        // Update last seen time
        this.updateLastSeenTime(this.currentItem);
    }

    // Update radar visualization
    updateRadar(distance, direction) {
        if (!this.elements.targetMarker || !this.elements.distanceRing) return;
        
        const radar = document.querySelector('.radar');
        if (!radar) return;
        
        const radarSize = radar.offsetWidth;
        const maxDistance = 100; // Maximum distance to show on radar (meters)
        
        // Calculate position on radar
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const angle = (direction * Math.PI) / 180;
        
        const x = normalizedDistance * Math.sin(angle);
        const y = normalizedDistance * Math.cos(angle);
        
        // Update target marker position
        const markerX = 50 + x * 50;
        const markerY = 50 - y * 50;
        
        this.elements.targetMarker.style.left = `${markerX}%`;
        this.elements.targetMarker.style.top = `${markerY}%`;
        
        // Update distance ring
        const ringSize = normalizedDistance * 100;
        this.elements.distanceRing.style.width = `${ringSize}%`;
        this.elements.distanceRing.style.height = `${ringSize}%`;
        this.elements.distanceRing.style.left = `${markerX}%`;
        this.elements.distanceRing.style.top = `${markerY}%`;
        
        // Update direction arrow
        if (this.elements.directionArrow) {
            this.elements.directionArrow.style.transform = `rotate(${direction}deg)`;
        }
    }

    // Reset radar to initial state
    resetRadar() {
        if (this.elements.targetMarker) {
            this.elements.targetMarker.style.left = '50%';
            this.elements.targetMarker.style.top = '50%';
        }
        
        if (this.elements.distanceRing) {
            this.elements.distanceRing.style.width = '0%';
            this.elements.distanceRing.style.height = '0%';
        }
        
        // Reset stats display
        this.elements.distanceValue.textContent = '-- m';
        this.elements.directionValue.textContent = '--°';
        this.elements.rssiValue.textContent = '-- dBm';
    }

    // Calculate direction from user to item
    calculateDirection(itemLocation, userLocation) {
        if (!itemLocation || !userLocation) return 0;
        
        const dLng = (itemLocation.lng - userLocation.lng) * Math.PI / 180;
        const lat1 = userLocation.lat * Math.PI / 180;
        const lat2 = itemLocation.lat * Math.PI / 180;
        
        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        
        return bearing;
    }

    // Update statistics display
    updateStatsDisplay(distance, direction, rssi) {
        this.elements.distanceValue.textContent = `${Math.round(distance)} m`;
        this.elements.directionValue.textContent = `${Math.round(direction)}°`;
        this.elements.rssiValue.textContent = `${Math.round(rssi)} dBm`;
    }

    // Update proximity feedback message
    updateProximityFeedback(message) {
        if (this.elements.proximityFeedback) {
            const span = this.elements.proximityFeedback.querySelector('span');
            if (span) span.textContent = message;
        }
    }

    // Update proximity feedback based on distance
    updateProximityFeedbackBasedOnDistance(distance) {
        let message = '';
        let color = '#10b981';
        
        if (distance < 1) {
            message = 'Item is within 1 meter!';
            color = '#10b981'; // Green
        } else if (distance < 5) {
            message = 'Item is very close';
            color = '#10b981';
        } else if (distance < 20) {
            message = 'Item is nearby';
            color = '#f59e0b'; // Yellow
        } else if (distance < 100) {
            message = 'Item is within 100 meters';
            color = '#f59e0b';
        } else {
            message = 'Item is far away';
            color = '#ef4444'; // Red
        }
        
        this.updateProximityFeedback(message);
        if (this.elements.proximityFeedback) {
            this.elements.proximityFeedback.style.borderLeft = `4px solid ${color}`;
        }
    }

    // Update proximity effects (sound and vibration)
    updateProximityEffects(distance) {
        if (distance < 10) {
            // Play beeping sound when close
            if (this.soundEnabled) {
                this.playProximityBeep(distance);
            }
            
            // Vibrate when very close
            if (this.vibrationEnabled && distance < 2) {
                this.vibrateDevice();
            }
        }
    }

    // Play proximity beep (frequency increases as distance decreases)
    playProximityBeep(distance) {
        const beep = document.getElementById('proximityBeep');
        if (beep) {
            // Calculate playback rate based on distance
            const rate = Math.max(0.5, 2 - (distance / 10));
            beep.playbackRate = rate;
            
            // Play sound
            beep.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    // Vibrate device (if supported)
    vibrateDevice() {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    // Toggle sound
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundToggle');
        if (btn) {
            if (this.soundEnabled) {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
                btn.style.color = '#10b981';
            } else {
                btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                btn.style.color = '#ef4444';
            }
        }
    }

    // Toggle vibration
    toggleVibration() {
        this.vibrationEnabled = !this.vibrationEnabled;
        const btn = document.getElementById('vibrationToggle');
        if (btn) {
            if (this.vibrationEnabled) {
                btn.style.color = '#10b981';
            } else {
                btn.style.color = '#ef4444';
            }
        }
    }

    // Save new item
    saveItem() {
        const name = document.getElementById('itemName').value;
        const category = document.getElementById('itemCategory').value;
        const attachMethod = document.getElementById('attachMethod').value;
        
        if (!name.trim()) {
            alert('Please enter an item name');
            return;
        }
        
        if (!this.currentLocation) {
            alert('Please wait for location to be acquired');
            return;
        }
        
        // Create item object
        const item = {
            id: Date.now().toString(),
            name: name.trim(),
            category: category,
            location: {...this.currentLocation},
            attachMethod: attachMethod,
            photo: this.getPhotoData(),
            createdAt: new Date(),
            lastSeen: new Date()
        };
        
        // Save to storage
        this.items.set(item.id, item);
        this.saveItemsToStorage();
        
        // Initialize simulated Bluetooth device
        this.simulatedDevices.set(item.id, {
            rssi: -50,
            lastUpdate: new Date(),
            distance: 0
        });
        
        // Log activity
        this.logActivity(`Saved item: ${item.name}`, 'save');
        
        // Show success and return to dashboard
        alert(`${item.name} saved successfully!`);
        this.showPage('dashboard');
        this.updateStats();
    }

    // Get photo data from preview
    getPhotoData() {
        const preview = document.getElementById('photoPreview');
        const img = preview.querySelector('img');
        
        if (img && img.src.startsWith('data:')) {
            return img.src;
        }
        
        return null;
    }

    // Load tracked items
    loadTrackedItems() {
        const grid = document.getElementById('itemsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.items.size === 0) {
            grid.innerHTML = `
                <div class="no-items">
                    <i class="fas fa-box-open"></i>
                    <h3>No items saved yet</h3>
                    <p>Save your first item to start tracking</p>
                    <button class="btn primary" onclick="showPage('saveItem')">Save New Item</button>
                </div>
            `;
            return;
        }
        
        // Create item cards
        this.items.forEach((item, id) => {
            const card = this.createItemCard(item);
            grid.appendChild(card);
        });
    }

    // Create item card HTML
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        
        const timeAgo = this.getTimeAgo(item.lastSeen);
        const categoryNames = {
            keys: 'Keys',
            wallet: 'Wallet',
            phone: 'Phone',
            bag: 'Bag',
            laptop: 'Laptop',
            other: 'Other'
        };
        
        card.innerHTML = `
            <div class="item-image">
                ${item.photo ? 
                    `<img src="${item.photo}" alt="${item.name}">` :
                    `<i class="fas fa-${this.getCategoryIcon(item.category)}"></i>`
                }
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <span class="category-badge">${categoryNames[item.category] || 'Other'}</span>
                <p class="item-location">
                    <i class="fas fa-map-marker-alt"></i> 
                    ${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}
                </p>
                <p class="item-time">Last seen: ${timeAgo}</p>
                <div class="item-actions">
                    <button class="item-btn" onclick="app.findItem('${item.id}')">
                        <i class="fas fa-search"></i> Find
                    </button>
                    <button class="item-btn" onclick="app.updateItemLocation('${item.id}')">
                        <i class="fas fa-sync-alt"></i> Update
                    </button>
                    <button class="item-btn danger" onclick="app.deleteItem('${item.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Get category icon
    getCategoryIcon(category) {
        const icons = {
            keys: 'key',
            wallet: 'wallet',
            phone: 'mobile-alt',
            bag: 'briefcase',
            laptop: 'laptop',
            other: 'cube'
        };
        return icons[category] || 'cube';
    }

    // Find item (go to live finder)
    findItem(itemId) {
        const item = this.items.get(itemId);
        if (item) {
            this.currentItem = item;
            this.showPage('liveFinder');
            
            // Select item in dropdown
            const select = document.getElementById('finderItemSelect');
            if (select) {
                select.value = itemId;
                this.selectFinderItem();
            }
        }
    }

    // Update item location
    updateItemLocation(itemId) {
        const item = this.items.get(itemId);
        if (item && this.currentLocation) {
            item.location = {...this.currentLocation};
            item.lastSeen = new Date();
            this.saveItemsToStorage();
            this.loadTrackedItems(); // Refresh display
            this.logActivity(`Updated location for ${item.name}`, 'update');
        }
    }

    // Delete item
    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            const item = this.items.get(itemId);
            this.items.delete(itemId);
            this.simulatedDevices.delete(itemId);
            this.saveItemsToStorage();
            this.loadTrackedItems();
            this.updateStats();
            
            if (item) {
                this.logActivity(`Deleted item: ${item.name}`, 'delete');
            }
        }
    }

    // Update dashboard stats
    updateStats() {
        this.elements.itemCount.textContent = this.items.size;
        
        // Update last update time
        this.updateLastUpdateTime();
    }

    // Update last update time
    updateLastUpdateTime() {
        const now = new Date();
        this.elements.lastUpdate.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Update last seen time for item
    updateLastSeenTime(item) {
        if (!item || !this.elements.lastSeenValue) return;
        
        const timeAgo = this.getTimeAgo(item.lastSeen);
        this.elements.lastSeenValue.textContent = timeAgo;
    }

    // Get time ago string
    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        if (seconds < 60) return 'Just now';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    // Log activity
    logActivity(message, type = 'info') {
        const activityLog = this.elements.activityLog;
        if (!activityLog) return;
        
        const activity = document.createElement('div');
        activity.className = 'activity-item';
        
        const icons = {
            system: 'cog',
            gps: 'location-dot',
            save: 'save',
            update: 'sync-alt',
            delete: 'trash',
            tracking: 'satellite',
            info: 'info-circle'
        };
        
        const icon = icons[type] || 'info-circle';
        
        activity.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div class="activity-info">
                <h4>${message}</h4>
                <p>${new Date().toLocaleTimeString()}</p>
            </div>
        `;
        
        // Add to top
        activityLog.insertBefore(activity, activityLog.firstChild);
        
        // Keep only last 10 activities
        while (activityLog.children.length > 10) {
            activityLog.removeChild(activityLog.lastChild);
        }
    }

    // Load items from storage
    loadItems() {
        try {
            const saved = localStorage.getItem('traceit_items');
            if (saved) {
                const itemsArray = JSON.parse(saved);
                itemsArray.forEach(item => {
                    // Convert date strings back to Date objects
                    item.createdAt = new Date(item.createdAt);
                    item.lastSeen = new Date(item.lastSeen);
                    this.items.set(item.id, item);
                });
            }
        } catch (error) {
            console.error('Error loading items:', error);
        }
    }

    // Save items to storage
    saveItemsToStorage() {
        const itemsArray = Array.from(this.items.values());
        localStorage.setItem('traceit_items', JSON.stringify(itemsArray));
    }

    // Camera functionality
    startCameraScan() {
        document.getElementById('cameraModal').classList.add('active');
    }

    closeCameraModal() {
        document.getElementById('cameraModal').classList.remove('active');
        this.stopCamera();
    }

    async toggleCamera() {
        const toggleBtn = document.getElementById('cameraToggle');
        
        if (!this.cameraActive) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                
                this.cameraFeed.srcObject = stream;
                this.cameraActive = true;
                toggleBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
                toggleBtn.classList.add('danger');
                
                // Start object detection simulation
                this.startObjectDetection();
                
            } catch (error) {
                console.error('Camera error:', error);
                alert('Cannot access camera. Please check permissions.');
            }
        } else {
            this.stopCamera();
            toggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Camera';
            toggleBtn.classList.remove('danger');
        }
    }

    stopCamera() {
        if (this.cameraFeed.srcObject) {
            this.cameraFeed.srcObject.getTracks().forEach(track => track.stop());
            this.cameraFeed.srcObject = null;
        }
        this.cameraActive = false;
    }

    // Simulated object detection
    startObjectDetection() {
        if (!this.cameraActive) return;
        
        // In a real implementation, this would use TensorFlow.js or similar
        // For simulation, we'll simulate detection
        setInterval(() => {
            if (this.cameraActive) {
                this.simulateObjectDetection();
            }
        }, 2000);
    }

    simulateObjectDetection() {
        const results = document.getElementById('detectionResults');
        const matchFill = document.getElementById('matchFill');
        
        if (!results || !matchFill) return;
        
        // Simulate detection
        const randomMatch = Math.random() * 100;
        matchFill.style.width = `${randomMatch}%`;
        
        if (randomMatch > 70) {
            results.innerHTML = `
                <div class="detection-item">
                    <i class="fas fa-check-circle" style="color: #10b981"></i>
                    <strong>Possible match detected!</strong>
                    <p>High confidence match with saved items</p>
                </div>
            `;
        } else if (randomMatch > 40) {
            results.innerHTML = `
                <div class="detection-item">
                    <i class="fas fa-exclamation-circle" style="color: #f59e0b"></i>
                    <strong>Partial match detected</strong>
                    <p>Moderate confidence - continue scanning</p>
                </div>
            `;
        } else {
            results.innerHTML = `
                <div class="detection-item">
                    <i class="fas fa-times-circle" style="color: #ef4444"></i>
                    <strong>No matches found</strong>
                    <p>Try moving the camera to different angles</p>
                </div>
            `;
        }
    }

    captureScan() {
        if (!this.cameraActive) return;
        
        const canvas = this.cameraCanvas;
        const video = this.cameraFeed;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Save capture for future comparison
        const imageData = canvas.toDataURL('image/jpeg');
        
        this.logActivity('Camera scan captured', 'system');
        
        // In a real implementation, this would:
        // 1. Save the image as a reference
        // 2. Compare with saved item images
        // 3. Update item location based on visual recognition
    }

    // Photo capture/upload
    capturePhoto() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Camera not available');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Create temporary video element
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                // After a moment, capture frame
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);
                    
                    // Convert to data URL
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    
                    // Update preview
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `<img src="${dataUrl}" alt="Captured photo">`;
                    
                    // Stop stream
                    stream.getTracks().forEach(track => track.stop());
                    
                }, 1000);
            })
            .catch(error => {
                console.error('Camera error:', error);
                alert('Cannot access camera. Please check permissions.');
            });
    }

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Uploaded photo">`;
        };
        reader.readAsDataURL(file);
    }

    uploadPhoto() {
        document.getElementById('photoUpload').click();
    }

    // Update current location manually
    updateLocation() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleLocationUpdate(position);
                    alert('Location updated successfully!');
                },
                (error) => {
                    alert('Unable to get location: ' + error.message);
                }
            );
        }
    }
}

// Global app instance and helper functions
let app;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    app = new TraceItApp();
});

// Global functions for HTML event handlers
function showPage(pageId) {
    app.showPage(pageId);
}

function startCameraScan() {
    app.startCameraScan();
}

function closeCameraModal() {
    app.closeCameraModal();
}

function toggleCamera() {
    app.toggleCamera();
}

function captureScan() {
    app.captureScan();
}

function capturePhoto() {
    app.capturePhoto();
}

function uploadPhoto() {
    app.uploadPhoto();
}

function saveItem() {
    app.saveItem();
}

function loadTrackedItems() {
    app.loadTrackedItems();
}

function startLiveTracking() {
    app.startLiveTracking();
}

function stopLiveTracking() {
    app.stopLiveTracking();
}

function stopLiveFinder() {
    app.stopLiveFinder();
}

function selectFinderItem() {
    app.selectFinderItem();
}

function toggleSound() {
    app.toggleSound();
}

function toggleVibration() {
    app.toggleVibration();
}

function updateLocation() {
    app.updateLocation();
}

// For item card buttons (needs to be in global scope)
window.app = app;

// Helper function for item card buttons
function findItem(itemId) {
    app.findItem(itemId);
}

function updateItemLocation(itemId) {
    app.updateItemLocation(itemId);
}

function deleteItem(itemId) {
    app.deleteItem(itemId);
}

// Add these to window for HTML onclick handlers
window.findItem = findItem;
window.updateItemLocation = updateItemLocation;
window.deleteItem = deleteItem;
window.activateCameraScan = startCameraScan;
