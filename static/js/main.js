// Main Website JavaScript - Connected to Backend API
class WatchWebsite {
    constructor() {
        this.watches = [];
        this.isLoading = false;
        this.init();
    }

    async init() {
        await this.loadWatches();
        this.setupEventListeners();
    }

    async loadWatches() {
        try {
            this.setLoading(true);
            const response = await fetch('/api/watches');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.watches = result.data;
                this.renderWatches();
            } else {
                console.error('Failed to load watches:', result.error);
                this.loadSampleData();
            }
        } catch (error) {
            console.error('Error loading watches:', error);
            // Fallback to sample data if API fails
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
                description: "Classic black bezel Submariner in excellent condition with box and papers.",
                image: "⌚"
            },
            {
                id: 2,
                brand: "Omega",
                model: "Speedmaster Professional",
                reference: "311.30.42.30.01.005",
                year: 2020,
                condition: "very-good",
                price: 4200,
                description: "The iconic Moonwatch with hesalite crystal and manual wind movement.",
                image: "🌙"
            },
            {
                id: 3,
                brand: "Patek Philippe",
                model: "Calatrava",
                reference: "5196P",
                year: 2018,
                condition: "excellent",
                price: 28500,
                description: "Platinum dress watch with small seconds and leather strap.",
                image: "👑"
            },
            {
                id: 4,
                brand: "Audemars Piguet",
                model: "Royal Oak",
                reference: "15400ST",
                year: 2017,
                condition: "good",
                price: 22000,
                description: "Iconic octagonal bezel sports watch in stainless steel.",
                image: "💎"
            }
        ];
        this.renderWatches();
    }

    renderWatches() {
        const grid = document.getElementById('watchGrid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.watches.forEach(watch => {
            const watchCard = this.createWatchCard(watch);
            grid.appendChild(watchCard);
        });
    }

    createWatchCard(watch) {
        const card = document.createElement('div');
        card.className = 'watch-card';
        
        // Determine what to show in the image area
        let imageContent;
        if (watch.image_url) {
            imageContent = `<img src="${watch.image_url}" alt="${watch.brand} ${watch.model}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
        } else {
            imageContent = `<div class="watch-placeholder">${watch.image}</div>`;
        }
        
        card.innerHTML = `
            <div class="watch-image">
                ${imageContent}
            </div>
            <div class="watch-info">
                <h3>${watch.brand} ${watch.model}</h3>
                <div class="watch-ref">Ref: ${watch.reference}</div>
                <div class="watch-condition">${watch.year} • ${this.formatCondition(watch.condition)}</div>
                <div class="watch-price">$${watch.price.toLocaleString()}</div>
                <div class="watch-actions">
                    <a href="#" class="btn-small btn-inquire" onclick="watchWebsite.inquireWatch(${watch.id})">Inquire</a>
                    <a href="#" class="btn-small btn-details" onclick="watchWebsite.showWatchDetails(${watch.id})">Details</a>
                </div>
            </div>
        `;
        return card;
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

    setupEventListeners() {
        // Modal close functionality
        const modal = document.getElementById('watchModal');
        const closeBtn = document.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
            }
        }
        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }

        // Sell form submission
        const sellForm = document.getElementById('sellForm');
        if (sellForm) {
            sellForm.addEventListener('submit', (e) => this.handleSellForm(e));
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    showWatchDetails(watchId) {
        const watch = this.watches.find(w => w.id === watchId);
        if (!watch) return;
        
        const modal = document.getElementById('watchModal');
        const content = document.getElementById('modalContent');
        
        // Determine what to show in the modal image area
        let modalImageContent;
        if (watch.image_url) {
            modalImageContent = `<img src="${watch.image_url}" alt="${watch.brand} ${watch.model}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 10px;">`;
        } else {
            modalImageContent = `<div class="watch-placeholder" style="width: 150px; height: 150px; font-size: 4rem;">${watch.image}</div>`;
        }
        
        content.innerHTML = `
            <h2>${watch.brand} ${watch.model}</h2>
            <div style="margin: 1rem 0;">
                <div class="watch-image" style="height: 300px; display: flex; justify-content: center; align-items: center;">
                    ${modalImageContent}
                </div>
            </div>
            <p><strong>Reference:</strong> ${watch.reference}</p>
            <p><strong>Year:</strong> ${watch.year}</p>
            <p><strong>Condition:</strong> ${this.formatCondition(watch.condition)}</p>
            <p><strong>Price:</strong> $${watch.price.toLocaleString()}</p>
            <br>
            <p><strong>Description:</strong></p>
            <p>${watch.description}</p>
            <br>
            <div style="display: flex; gap: 1rem;">
                <button class="btn-primary" onclick="watchWebsite.inquireWatch(${watch.id})">Inquire via WhatsApp</button>
                <button class="btn-secondary" onclick="document.getElementById('watchModal').style.display='none'">Close</button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    inquireWatch(watchId) {
        const watch = this.watches.find(w => w.id === watchId);
        if (!watch) return;
        
        const message = `Hi! I'm interested in the ${watch.brand} ${watch.model} (Ref: ${watch.reference}) listed for $${watch.price.toLocaleString()}. Could you provide more details?`;
        this.openWhatsApp(message);
    }

    openWhatsApp(message = "Hi! I'm interested in your luxury watches. Could you help me?") {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/1234567890?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    }

    async handleSellForm(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const watchData = {
            brand: formData.get('brand'),
            model: formData.get('model'),
            year: formData.get('year'),
            condition: formData.get('condition'),
            accessories: formData.get('accessories'),
            description: formData.get('description'),
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email')
        };

        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
        submitBtn.disabled = true;

        try {
            // Simulate API call (replace with actual endpoint)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create WhatsApp message
            const message = `New Watch Submission:
Brand: ${watchData.brand}
Model: ${watchData.model}
Year: ${watchData.year}
Condition: ${watchData.condition}
Accessories: ${watchData.accessories}
Description: ${watchData.description}
Contact: ${watchData.name} (${watchData.phone}, ${watchData.email})`;

            // Show success message
            this.showMessage('Thank you! We\'ll contact you within 24 hours with a quote.', 'success');

            // Reset form
            event.target.reset();

            // Open WhatsApp with pre-filled message
            this.openWhatsApp(message);

        } catch (error) {
            this.showMessage('Failed to submit. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const grid = document.getElementById('watchGrid');
        if (loading && grid) {
            grid.innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="loading"></span> Loading watches...</div>';
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
        
        // Find a good place to insert the message
        const sellForm = document.getElementById('sellForm');
        if (sellForm) {
            sellForm.insertBefore(message, sellForm.firstChild);
        }

        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    openAdmin() {
        window.open('admin.html', '_blank');
    }

    // Refresh watches data (can be called periodically or on focus)
    async refreshWatches() {
        await this.loadWatches();
    }
}

// Initialize website when DOM is loaded
let watchWebsite;
document.addEventListener('DOMContentLoaded', function() {
    watchWebsite = new WatchWebsite();
});

// Global functions for onclick handlers
function openWhatsApp(message) {
    if (watchWebsite) {
        watchWebsite.openWhatsApp(message);
    }
}

function openAdmin() {
    if (watchWebsite) {
        watchWebsite.openAdmin();
    }
}

// Refresh data when page becomes visible (helps with sync)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && watchWebsite) {
        watchWebsite.refreshWatches();
    }
});
