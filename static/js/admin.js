// Admin Panel JavaScript - Connected to Backend API
class AdminPanel {
    constructor() {
        this.watches = [];
        this.currentEditId = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        await this.loadInventory();
        this.updateStats();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('watchForm').addEventListener('submit', (e) => this.handleWatchForm(e));
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Image upload handling
        document.getElementById('imageFile').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    switchTab(event) {
        const tabName = event.target.textContent.toLowerCase().replace(/\s+/g, '-');
        let targetTab;
        
        if (tabName.includes('inventory')) targetTab = 'inventory';
        else if (tabName.includes('add')) targetTab = 'add-watch';
        else if (tabName.includes('inquiries')) targetTab = 'inquiries';
        
        if (!targetTab) return;

        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(targetTab).classList.add('active');
        event.target.classList.add('active');
    }

    async loadInventory() {
        try {
            this.setLoading(true);
            const response = await fetch('/api/admin/watches', {
                headers: {
                    'Authorization': 'Bearer admin-token' // Simple auth for demo
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.watches = result.data;
                this.renderInventory();
                this.updateStats();
            } else {
                this.showMessage('Failed to load inventory: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showMessage('Failed to connect to server. Using offline mode.', 'error');
            // Fallback to sample data for demo
            this.loadSampleData();
        } finally {
            this.setLoading(false);
        }
    }

    loadSampleData() {
        // Fallback sample data if API fails
        this.watches = [
            {
                id: 1,
                brand: "Rolex",
                model: "Submariner Date",
                reference: "116610LN",
                year: 2019,
                condition: "excellent",
                price: 12500,
                market_price: 13200,
                description: "Classic black bezel Submariner in excellent condition with box and papers.",
                image: "⌚",
                accessories: "Box, papers, warranty card",
                status: "available"
            },
            {
                id: 2,
                brand: "Omega",
                model: "Speedmaster Professional",
                reference: "311.30.42.30.01.005",
                year: 2020,
                condition: "very-good",
                price: 4200,
                market_price: 4500,
                description: "The iconic Moonwatch with hesalite crystal and manual wind movement.",
                image: "🌙",
                accessories: "Box, papers",
                status: "available"
            },
            {
                id: 3,
                brand: "Patek Philippe",
                model: "Calatrava",
                reference: "5196P",
                year: 2018,
                condition: "excellent",
                price: 28500,
                market_price: 30000,
                description: "Platinum dress watch with small seconds and leather strap.",
                image: "👑",
                accessories: "Full set",
                status: "available"
            },
            {
                id: 4,
                brand: "Audemars Piguet",
                model: "Royal Oak",
                reference: "15400ST",
                year: 2017,
                condition: "good",
                price: 22000,
                market_price: 24000,
                description: "Iconic octagonal bezel sports watch in stainless steel.",
                image: "💎",
                accessories: "Box only",
                status: "available"
            }
        ];
        this.renderInventory();
        this.updateStats();
    }

    renderInventory() {
        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';

        this.watches.forEach(watch => {
            const row = document.createElement('div');
            row.className = 'watch-row';
            row.innerHTML = `
                <div>${watch.brand} ${watch.model}</div>
                <div>${watch.reference}</div>
                <div>${watch.year || 'N/A'}</div>
                <div>${this.formatCondition(watch.condition)}</div>
                <div>$${watch.price.toLocaleString()}</div>
                <div class="watch-actions">
                    <button class="btn btn-small btn-secondary" onclick="adminPanel.editWatch(${watch.id})">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="adminPanel.deleteWatch(${watch.id})">Delete</button>
                </div>
            `;
            inventoryList.appendChild(row);
        });
    }

    formatCondition(condition) {
        const conditionMap = {
            'new': 'New/Unworn',
            'excellent': 'Excellent',
            'very-good': 'Very Good',
            'good': 'Good',
            'fair': 'Fair'
        };
        return conditionMap[condition] || condition;
    }

    updateStats() {
        const availableWatches = this.watches.filter(w => w.status === 'available');
        const totalWatches = availableWatches.length;
        const totalValue = availableWatches.reduce((sum, watch) => sum + watch.price, 0);
        const avgPrice = totalValue / totalWatches || 0;

        document.getElementById('totalWatches').textContent = totalWatches;
        document.getElementById('totalValue').textContent = '$' + totalValue.toLocaleString();
        document.getElementById('avgPrice').textContent = '$' + Math.round(avgPrice).toLocaleString();
        // Keep recent inquiries as static for now
        document.getElementById('recentInquiries').textContent = '12';
    }

    async handleWatchForm(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const formData = new FormData(event.target);
        
        // Validate required fields
        const brand = formData.get('brand')?.toString().trim();
        const model = formData.get('model')?.toString().trim();
        const reference = formData.get('reference')?.toString().trim();
        const condition = formData.get('condition')?.toString().trim();
        const price = formData.get('price')?.toString().trim();
        
        if (!brand || !model || !reference || !condition || !price) {
            this.showMessage('Please fill in all required fields (Brand, Model, Reference, Condition, Price)', 'error');
            return;
        }
        
        const watchData = {
            brand: brand,
            model: model,
            reference: reference,
            year: formData.get('year') ? parseInt(formData.get('year').toString()) : null,
            condition: condition,
            price: parseInt(price),
            market_price: formData.get('marketPrice') ? parseInt(formData.get('marketPrice').toString()) : null,
            description: formData.get('description')?.toString() || '',
            image: formData.get('image')?.toString() || '⌚',
            image_url: formData.get('imageUrl')?.toString() || null,
            accessories: formData.get('accessories')?.toString() || ''
        };

        try {
            this.setLoading(true);
            
            if (this.currentEditId) {
                // Update existing watch
                await this.updateWatch(this.currentEditId, watchData);
            } else {
                // Create new watch
                await this.createWatch(watchData);
            }
            
            // Reset form and state
            event.target.reset();
            this.currentEditId = null;
            this.clearSearchResults();
            this.makeFormFieldsEditable();
            this.updateSubmitButton();
            
            // Reload inventory
            await this.loadInventory();
            
        } catch (error) {
            console.error('Error saving watch:', error);
            this.showMessage('Failed to save watch: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async createWatch(watchData) {
        const response = await fetch('/api/admin/watches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token'
            },
            body: JSON.stringify(watchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to create watch');
        }

        this.showMessage('Watch added successfully!', 'success');
        return result.data;
    }

    async updateWatch(id, watchData) {
        const response = await fetch(`/api/admin/watches/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer admin-token'
            },
            body: JSON.stringify(watchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to update watch');
        }

        this.showMessage('Watch updated successfully!', 'success');
        return result.data;
    }

    async editWatch(id) {
        const watch = this.watches.find(w => w.id === id);
        if (!watch) {
            this.showMessage('Watch not found', 'error');
            return;
        }

        // Switch to add-watch tab
        this.switchToTab('add-watch');

        // Populate form with watch data
        document.getElementById('brand').value = watch.brand;
        document.getElementById('model').value = watch.model;
        document.getElementById('reference').value = watch.reference;
        document.getElementById('year').value = watch.year || '';
        document.getElementById('condition').value = watch.condition;
        document.getElementById('price').value = watch.price;
        document.getElementById('marketPrice').value = watch.market_price || '';
        document.getElementById('description').value = watch.description || '';
        document.getElementById('image').value = watch.image || '⌚';
        document.getElementById('accessories').value = watch.accessories || '';
        
        // Handle existing image
        if (watch.image_url) {
            document.getElementById('imageUrl').value = watch.image_url;
            this.showImagePreview(watch.image_url);
        } else {
            document.getElementById('imageUrl').value = '';
            document.getElementById('imagePreview').style.display = 'none';
        }

        // Make fields editable
        this.makeFormFieldsEditable();

        // Set edit mode
        this.currentEditId = id;

        this.showMessage('Editing mode activated. Make your changes and submit.', 'success');
    }

    async deleteWatch(id) {
        if (!confirm('Are you sure you want to delete this watch?')) {
            return;
        }

        try {
            this.setLoading(true);
            
            const response = await fetch(`/api/admin/watches/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer admin-token'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete watch');
            }

            this.showMessage('Watch deleted successfully!', 'success');
            await this.loadInventory();
            
        } catch (error) {
            console.error('Error deleting watch:', error);
            this.showMessage('Failed to delete watch: ' + error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    switchToTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        
        // Activate corresponding tab button
        const tabButtons = document.querySelectorAll('.tab-button');
        if (tabName === 'add-watch') {
            tabButtons[1].classList.add('active');
        } else if (tabName === 'inventory') {
            tabButtons[0].classList.add('active');
        } else if (tabName === 'inquiries') {
            tabButtons[2].classList.add('active');
        }
    }

    makeFormFieldsEditable() {
        document.getElementById('brand').readOnly = false;
        document.getElementById('model').readOnly = false;
        document.getElementById('reference').readOnly = false;
    }

    clearSearchResults() {
        document.getElementById('searchResults').innerHTML = '';
    }

    updateSubmitButton() {
        const submitBtn = document.querySelector('#watchForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = this.currentEditId ? 'Update Watch' : 'Add Watch to Inventory';
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const submitBtn = document.querySelector('#watchForm button[type="submit"]');
        if (submitBtn) {
            if (loading) {
                submitBtn.innerHTML = '<span class="loading"></span> Saving...';
                submitBtn.disabled = true;
            } else {
                submitBtn.innerHTML = this.currentEditId ? 'Update Watch' : 'Add Watch to Inventory';
                submitBtn.disabled = false;
            }
        }
    }

    showMessage(text, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(message, mainContent.firstChild);

        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    // WatchCharts search functionality
    async searchWatchCharts() {
        const brand = document.getElementById('searchBrand').value;
        const reference = document.getElementById('searchReference').value;
        
        if (!brand || !reference) {
            this.showMessage('Please select a brand and enter a reference number.', 'error');
            return;
        }

        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<div style="text-align: center; padding: 1rem;"><span class="loading"></span> Searching WatchCharts database...</div>';

        // Simulate API call to WatchCharts (replace with real API call)
        setTimeout(() => {
            const mockResults = this.generateMockSearchResults(brand, reference);
            this.displaySearchResults(mockResults);
        }, 2000);
    }

    generateMockSearchResults(brand, reference) {
        const brandNames = {
            'rolex': 'Rolex',
            'patek-philippe': 'Patek Philippe',
            'audemars-piguet': 'Audemars Piguet',
            'omega': 'Omega',
            'cartier': 'Cartier',
            'breitling': 'Breitling',
            'tag-heuer': 'TAG Heuer'
        };

        const models = {
            'rolex': ['Submariner Date', 'GMT-Master II', 'Daytona', 'Datejust'],
            'omega': ['Speedmaster Professional', 'Seamaster', 'Constellation'],
            'patek-philippe': ['Calatrava', 'Nautilus', 'Aquanaut'],
            'audemars-piguet': ['Royal Oak', 'Royal Oak Offshore'],
            'cartier': ['Tank', 'Santos', 'Ballon Bleu'],
            'breitling': ['Navitimer', 'Superocean', 'Avenger'],
            'tag-heuer': ['Carrera', 'Formula 1', 'Monaco']
        };

        return [
            {
                uuid: 'mock-uuid-1',
                brand: brandNames[brand],
                model: models[brand][0],
                reference: reference,
                marketPrice: Math.floor(Math.random() * 50000) + 5000,
                description: `${brandNames[brand]} ${models[brand][0]} ${reference}`
            }
        ];
    }

    displaySearchResults(results) {
        const resultsDiv = document.getElementById('searchResults');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--soft-gray);">No results found. Try a different reference number.</div>';
            return;
        }

        resultsDiv.innerHTML = '<h4 style="color: var(--accent-gold); margin-bottom: 0.5rem;">Search Results:</h4>';
        
        results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${result.brand} ${result.model}</strong><br>
                        <span style="color: var(--soft-gray);">Ref: ${result.reference}</span><br>
                        <span style="color: var(--accent-gold);">Market Price: $${result.marketPrice.toLocaleString()}</span>
                    </div>
                    <button class="btn btn-small" onclick="adminPanel.selectWatchFromSearch(${index})">Select</button>
                </div>
            `;
            resultsDiv.appendChild(item);
        });

        // Store results for later use
        this.currentSearchResults = results;
    }

    selectWatchFromSearch(index) {
        const selected = this.currentSearchResults[index];
        
        // Populate form with selected watch data
        document.getElementById('brand').value = selected.brand;
        document.getElementById('model').value = selected.model;
        document.getElementById('reference').value = selected.reference;
        document.getElementById('marketPrice').value = selected.marketPrice;
        document.getElementById('price').value = Math.floor(selected.marketPrice * 0.9); // Suggest 10% below market

        // Visual feedback
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.search-result-item')[index].classList.add('selected');

        this.showMessage('Watch data loaded from WatchCharts! Please complete the remaining fields.', 'success');
    }

    // Image upload handling
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showMessage('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
            event.target.value = '';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('Image file size must be less than 5MB', 'error');
            event.target.value = '';
            return;
        }

        try {
            // Show loading state
            const preview = document.getElementById('imagePreview');
            preview.style.display = 'block';
            preview.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="loading"></span> Uploading image...</div>';

            // Create FormData for upload
            const formData = new FormData();
            formData.append('image', file);

            // Upload to server
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer admin-token'
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to upload image');
            }

            // Update hidden field with image URL
            document.getElementById('imageUrl').value = result.imageUrl;

            // Show preview
            this.showImagePreview(result.imageUrl);

            this.showMessage('Image uploaded successfully!', 'success');

        } catch (error) {
            console.error('Error uploading image:', error);
            this.showMessage('Failed to upload image: ' + error.message, 'error');
            event.target.value = '';
            document.getElementById('imagePreview').style.display = 'none';
        }
    }

    showImagePreview(imageUrl) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        
        img.src = imageUrl;
        preview.style.display = 'block';
        preview.innerHTML = `
            <img id="previewImg" src="${imageUrl}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid var(--border-gray);">
            <div style="margin-top: 0.5rem;">
                <button type="button" class="btn-small btn-danger" onclick="removeImage()">Remove Image</button>
            </div>
        `;
    }

    removeImage() {
        document.getElementById('imageFile').value = '';
        document.getElementById('imageUrl').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        this.showMessage('Image removed', 'success');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            window.close();
        }
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel;
document.addEventListener('DOMContentLoaded', function() {
    adminPanel = new AdminPanel();
});

// Global functions for onclick handlers
function switchTab(tabName) {
    if (adminPanel) {
        adminPanel.switchToTab(tabName);
    }
}

function searchWatchCharts() {
    if (adminPanel) {
        adminPanel.searchWatchCharts();
    }
}

function logout() {
    if (adminPanel) {
        adminPanel.logout();
    }
}

function removeImage() {
    if (adminPanel) {
        adminPanel.removeImage();
    }
}
