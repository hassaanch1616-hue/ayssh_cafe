/* ==========================================================================
   Ayssh Cafe - Customer Storefront Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- MENU ITEMS CATALOG DATABASE ---
    const MENU_ITEMS = [
        { 
            id: "1", 
            title: "Premium Cappuccino", 
            category: "Coffee & Tea", 
            basePrice: 450, 
            image: "assets/coffee.jpg", 
            desc: "A velvety double espresso base blended with rich steamed milk and a dense layer of micro-foam, dusted with cinnamon." 
        },
        { 
            id: "2", 
            title: "Traditional Karak Chai", 
            category: "Coffee & Tea", 
            basePrice: 250, 
            image: "assets/karak_chai.jpg", 
            desc: "Freshly brewed strong black tea simmered with milk, cardamom, and saffron for a classic warming Desi experience." 
        },
        { 
            id: "3", 
            title: "Caramel Macchiato", 
            category: "Coffee & Tea", 
            basePrice: 550, 
            image: "assets/caramel_macchiato.jpg", 
            desc: "Freshly pulled espresso layered over sweet vanilla-infused steamed milk, finished with a luscious drizzle of buttery caramel sauce." 
        },
        { 
            id: "4", 
            title: "Chocolate Fudge Truffle", 
            category: "Decadent Cakes", 
            basePrice: 950, 
            image: "assets/cake.jpg", 
            desc: "Dense, moist layers of premium chocolate cake covered in velvety chocolate truffle ganache and sweet chocolate chips." 
        },
        { 
            id: "5", 
            title: "Velvet Rose Cake", 
            category: "Decadent Cakes", 
            basePrice: 1200, 
            image: "assets/rose_cake.jpg", 
            desc: "A sophisticated crimson sponge cake with layers of smooth vanilla cream cheese frosting, topped with aromatic edible rose petals." 
        },
        { 
            id: "6", 
            title: "Lemon Drizzle Cake", 
            category: "Decadent Cakes", 
            basePrice: 850, 
            image: "assets/lemon_cake.jpg", 
            desc: "Zesty lemon-infused sponge cake soaked in sweet organic lemon syrup, finished with a delicate crisp glaze drizzle." 
        },
        { 
            id: "7", 
            title: "Choco-Chip Giant Cookie", 
            category: "Artisanal Cookies", 
            basePrice: 180, 
            image: "assets/cookies.jpg", 
            desc: "Freshly baked massive, chewy cookie loaded with gooey Belgian semi-sweet dark chocolate chips and a hint of sea salt." 
        },
        { 
            id: "8", 
            title: "Butter Almond Biscotti", 
            category: "Artisanal Cookies", 
            basePrice: 220, 
            image: "assets/almond_biscotti.jpg", 
            desc: "Twice-baked premium Italian-style biscotti packed with roasted almonds and butter, perfect for dipping in your Karak Chai or coffee." 
        },
        { 
            id: "9", 
            title: "Coconut Crunch Biscuits", 
            category: "Artisanal Cookies", 
            basePrice: 150, 
            image: "assets/coconut_biscuits.jpg", 
            desc: "Crisp and delicate oven-baked biscuits loaded with sweet toasted shredded coconut and finished with granulated sugar." 
        }
    ];

    // --- FIREBASE CONFIGURATION & INITIALIZATION ---
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCRA1A9Qqse2xlpVLzNXFXzCbQ-3tfzP9Q",
        authDomain: "ayssh-cafe.firebaseapp.com",
        databaseURL: "https://ayssh-cafe-default-rtdb.firebaseio.com",
        projectId: "ayssh-cafe",
        storageBucket: "ayssh-cafe.firebasestorage.app",
        messagingSenderId: "857217612395",
        appId: "1:857217612395:web:c794969d6f9c0b1fc8cf2e",
        measurementId: "G-HYZRXKPL52"
    };

    let db = null;
    const isFirebaseConfigured = FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId;

    if (isFirebaseConfigured) {
        try {
            firebase.initializeApp(FIREBASE_CONFIG);
            db = firebase.firestore();
            console.log("Firebase Firestore initialized on customer storefront.");

            // Real-Time Listeners to sync status changes from Admin in real-time
            db.collection('orders').onSnapshot(snapshot => {
                const orders = [];
                snapshot.forEach(doc => {
                    orders.push(doc.data());
                });
                localStorage.setItem('ayssh_orders', JSON.stringify(orders));
                refreshTrackingDashboard();
            });

            db.collection('bookings').onSnapshot(snapshot => {
                const bookings = [];
                snapshot.forEach(doc => {
                    bookings.push(doc.data());
                });
                localStorage.setItem('ayssh_bookings', JSON.stringify(bookings));
                refreshTrackingDashboard();
            });
        } catch (err) {
            console.error("Firebase Front-end Initialization Error:", err);
        }
    } else {
        console.log("Firebase not configured. Operating in localStorage mode.");
    }

    // --- STATE MANAGEMENT ---
    let cart = JSON.parse(localStorage.getItem('ayssh_cart') || '[]');
    let activeCategory = 'All';

    // --- DOM ELEMENT REFERENCES ---
    const menuGrid = document.getElementById('menuGrid');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const cartTrigger = document.getElementById('cartTrigger');
    const cartBadge = document.getElementById('cartBadge');
    const cartDrawer = document.getElementById('cartDrawer');
    const closeCartDrawer = document.getElementById('closeCartDrawer');
    const uiOverlay = document.getElementById('uiOverlay');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalVal = document.getElementById('cartTotalVal');
    const checkoutActionBtn = document.getElementById('checkoutActionBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const reservationForm = document.getElementById('reservationForm');
    
    // Header transition on scroll
    const mainHeader = document.getElementById('mainHeader');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    // --- SPA VIEW TAB SWITCHING ---
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.getAttribute('data-target');
            switchTab(targetTab);
        });
    });

    // SPA switchTab helper function
    function switchTab(tabId) {
        // Toggle tab content display
        document.querySelectorAll('.tab-content').forEach(tc => {
            tc.classList.remove('active');
        });
        const activeTabEl = document.getElementById(tabId);
        if (activeTabEl) {
            activeTabEl.classList.add('active');
        }

        // Toggle active style on links
        navLinks.forEach(nl => {
            if (nl.getAttribute('data-target') === tabId) {
                nl.classList.add('active');
            } else {
                nl.classList.remove('active');
            }
        });

        // Reset scroll position and save state
        window.scrollTo(0, 0);
        localStorage.setItem('ayssh_active_tab', tabId);
    }

    // Initial default tab restore
    const savedActiveTab = localStorage.getItem('ayssh_active_tab') || 'tab-home';
    switchTab(savedActiveTab);

    // Dynamic redirection bindings
    document.getElementById('navBookBtn').addEventListener('click', () => switchTab('tab-book'));
    document.getElementById('heroMenuBtn').addEventListener('click', () => switchTab('tab-menu'));
    document.getElementById('heroBookBtn').addEventListener('click', () => switchTab('tab-book'));
    document.getElementById('storyMenuBtn').addEventListener('click', () => switchTab('tab-menu'));

    // --- MENU CONTROLLER ---
    function getAdjustedPrice(itemId, basePrice) {
        const adjustments = JSON.parse(localStorage.getItem('ayssh_menu_adjustments') || '{}');
        return adjustments[itemId] ? parseInt(adjustments[itemId]) : basePrice;
    }

    function renderMenu() {
        menuGrid.innerHTML = '';
        const filteredItems = MENU_ITEMS.filter(item => {
            return activeCategory === 'All' || item.category === activeCategory;
        });

        if (filteredItems.length === 0) {
            menuGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No items in this category.</div>`;
            return;
        }

        filteredItems.forEach(item => {
            const finalPrice = getAdjustedPrice(item.id, item.basePrice);
            const originalPriceHTML = finalPrice !== item.basePrice ? `<span>Rs. ${item.basePrice}</span>` : '';
            
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="menu-card-img">
                    <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/coffee.jpg'">
                    <span class="menu-card-badge">${item.category}</span>
                </div>
                <div class="menu-card-body">
                    <h3 class="menu-card-title">${item.title}</h3>
                    <p class="menu-card-desc">${item.desc}</p>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">${originalPriceHTML}Rs. ${finalPrice}</span>
                        <button class="btn add-to-cart-btn" data-id="${item.id}">
                            <i class="fa-solid fa-plus"></i> Add
                        </button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });

        // Add event listeners to the Add to Cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                addToCart(id);
            });
        });
    }

    // Category Selector
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.getAttribute('data-category');
            renderMenu();
        });
    });

    // --- CART SYSTEM ---
    function updateCartBadge() {
        const totalQty = cart.reduce((total, item) => total + item.quantity, 0);
        if (totalQty > 0) {
            cartBadge.textContent = totalQty;
            cartBadge.style.display = 'flex';
        } else {
            cartBadge.style.display = 'none';
        }
    }

    function addToCart(itemId) {
        const item = MENU_ITEMS.find(i => i.id === itemId);
        if (!item) return;

        const currentPrice = getAdjustedPrice(item.id, item.basePrice);
        const existingItem = cart.find(c => c.id === itemId);

        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.price = currentPrice;
        } else {
            cart.push({
                id: item.id,
                title: item.title,
                price: currentPrice,
                quantity: 1,
                image: item.image
            });
        }

        localStorage.setItem('ayssh_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCart();
        showToast(`Added ${item.title} to cart.`);
    }

    function updateCartQty(itemId, change) {
        const existingItem = cart.find(c => c.id === itemId);
        if (!existingItem) return;

        existingItem.quantity += change;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(c => c.id !== itemId);
        }

        localStorage.setItem('ayssh_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCart();
    }

    function removeFromCart(itemId) {
        cart = cart.filter(c => c.id !== itemId);
        localStorage.setItem('ayssh_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCart();
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <p>Your shopping bag is empty.</p>
                </div>
            `;
            cartTotalVal.textContent = 'Rs. 0';
            checkoutForm.style.display = 'none';
            checkoutActionBtn.textContent = 'Proceed to Checkout';
            return;
        }

        cart.forEach(item => {
            const finalPrice = getAdjustedPrice(item.id, item.price);
            const subtotal = finalPrice * item.quantity;
            total += subtotal;

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/coffee.jpg'">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">Rs. ${finalPrice}</div>
                    <div class="cart-item-qty">
                        <button class="qty-btn dec-qty" data-id="${item.id}">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn inc-qty" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-cart-item" data-id="${item.id}" aria-label="Remove item">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });

        cartTotalVal.textContent = `Rs. ${total.toLocaleString()}`;

        // Bind events to buttons
        document.querySelectorAll('.dec-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                updateCartQty(id, -1);
            });
        });

        document.querySelectorAll('.inc-qty').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                updateCartQty(id, 1);
            });
        });

        document.querySelectorAll('.remove-cart-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    // --- DRAWER OPEN/CLOSE ---
    function openDrawer() {
        cartDrawer.classList.add('open');
        uiOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    window.closeDrawer = function() {
        cartDrawer.classList.remove('open');
        uiOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset checkout state
        checkoutForm.style.display = 'none';
        checkoutActionBtn.textContent = cart.length > 0 ? 'Proceed to Checkout' : 'Cart is Empty';
    }

    cartTrigger.addEventListener('click', openDrawer);
    closeCartDrawer.addEventListener('click', window.closeDrawer);
    uiOverlay.addEventListener('click', window.closeDrawer);

    // --- ORDER CHECKOUT SUBMISSION ---
    checkoutActionBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("Your cart is empty!");
            return;
        }

        const isFormVisible = checkoutForm.style.display === 'block';

        if (!isFormVisible) {
            // Show details form
            checkoutForm.style.display = 'block';
            checkoutActionBtn.textContent = 'Confirm & Place Order';
            
            setTimeout(() => {
                cartDrawer.querySelector('.drawer-body').scrollTo({
                    top: checkoutForm.offsetTop,
                    behavior: 'smooth'
                });
            }, 100);
        } else {
            // Submit the order
            const customerName = document.getElementById('checkoutName').value.trim();
            const customerPhone = document.getElementById('checkoutPhone').value.trim();
            const deliveryType = document.getElementById('checkoutDelivery').value;

            if (!customerName || !customerPhone) {
                showToast("Please fill in your name and phone number!");
                return;
            }

            // Create Order
            let nextOrderNum = parseInt(localStorage.getItem('ayssh_order_counter') || '0') + 1;
            localStorage.setItem('ayssh_order_counter', nextOrderNum.toString());

            const orderId = "ORD-" + String(nextOrderNum).padStart(4, '0');
            const total = cart.reduce((sum, item) => sum + (getAdjustedPrice(item.id, item.price) * item.quantity), 0);
            
            const itemsArray = cart.map(item => ({
                name: item.title,
                quantity: item.quantity
            }));

            const order = {
                id: orderId,
                name: customerName,
                phone: customerPhone,
                deliveryType: deliveryType,
                items: itemsArray,
                total: total,
                status: "Processing",
                timestamp: new Date().toISOString()
            };

            // 1. Save to global orders in localStorage
            const allOrders = JSON.parse(localStorage.getItem('ayssh_orders') || '[]');
            allOrders.push(order);
            localStorage.setItem('ayssh_orders', JSON.stringify(allOrders));

            // 2. Keep track of user details locally
            localStorage.setItem('ayssh_last_phone', customerPhone);

            // 3. Write to Firestore if configured
            if (db) {
                db.collection('orders').doc(orderId).set(order)
                    .then(() => console.log("Order saved to Firestore successfully"))
                    .catch(err => console.error("Error saving order to Firestore:", err));
            }

            // Clear Cart
            cart = [];
            localStorage.removeItem('ayssh_cart');
            updateCartBadge();
            renderCart();
            
            // Close drawer
            window.closeDrawer();
            
            // Show toast & switch to tracking
            showToast(`Order Placed successfully! Code: ${orderId}`);
            
            // Auto switch to tracking section and query this order
            document.getElementById('trackingSearchInput').value = orderId;
            switchTab('tab-track');
            performTrackingSearch(orderId);
        }
    });

    // --- TABLE BOOKING SUBMISSION ---
    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const reserveName = document.getElementById('reserveName').value.trim();
        const reservePhone = document.getElementById('reservePhone').value.trim();
        const reserveGuests = document.getElementById('reserveGuests').value;
        const reserveTable = document.getElementById('reserveTable').value;
        const reserveDate = document.getElementById('reserveDate').value;
        const reserveTime = document.getElementById('reserveTime').value;

        if (!reserveName || !reservePhone || !reserveDate) {
            showToast("Please fill out all reservation fields!");
            return;
        }

        // Create Booking
        let nextBookingNum = parseInt(localStorage.getItem('ayssh_booking_counter') || '0') + 1;
        localStorage.setItem('ayssh_booking_counter', nextBookingNum.toString());

        const bookingId = "BK-" + String(nextBookingNum).padStart(4, '0');

        const booking = {
            id: bookingId,
            name: reserveName,
            phone: reservePhone,
            guests: parseInt(reserveGuests),
            table: reserveTable,
            date: reserveDate,
            time: reserveTime,
            timestamp: new Date().toISOString()
        };

        // 1. Save to global bookings in localStorage
        const allBookings = JSON.parse(localStorage.getItem('ayssh_bookings') || '[]');
        allBookings.push(booking);
        localStorage.setItem('ayssh_bookings', JSON.stringify(allBookings));

        // Keep track of user details locally
        localStorage.setItem('ayssh_last_phone', reservePhone);

        // 3. Write to Firestore if configured
        if (db) {
            db.collection('bookings').doc(bookingId).set(booking)
                .then(() => console.log("Booking saved to Firestore successfully"))
                .catch(err => console.error("Error saving booking to Firestore:", err));
        }

        // Reset reservation form
        reservationForm.reset();
        
        // Show success Toast & display in tracking
        showToast(`Table reserved successfully! Code: ${bookingId}`);

        // Search booking code in tracking tab
        document.getElementById('trackingSearchInput').value = bookingId;
        switchTab('tab-track');
        performTrackingSearch(bookingId);
    });

    // --- TRACKING AND STATUS CHECK SYSTEM ---
    const trackingSearchInput = document.getElementById('trackingSearchInput');
    const trackingSearchBtn = document.getElementById('trackingSearchBtn');
    const trackingDashboard = document.getElementById('trackingDashboard');

    // Auto-load last searched phone number/data if exist
    const lastPhone = localStorage.getItem('ayssh_last_phone');
    if (lastPhone) {
        trackingSearchInput.value = lastPhone;
        performTrackingSearch(lastPhone);
    }

    trackingSearchBtn.addEventListener('click', () => {
        const query = trackingSearchInput.value.trim();
        if (!query) {
            showToast("Please enter a phone number or ID.");
            return;
        }
        performTrackingSearch(query);
    });

    trackingSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = trackingSearchInput.value.trim();
            if (query) performTrackingSearch(query);
        }
    });

    function refreshTrackingDashboard() {
        const query = trackingSearchInput.value.trim();
        if (query) {
            renderTrackingResults(query);
        }
    }

    function performTrackingSearch(query) {
        renderTrackingResults(query);
    }

    function renderTrackingResults(query) {
        trackingDashboard.innerHTML = '';
        const lowercaseQuery = query.toLowerCase();

        // Load all database records
        const allOrders = JSON.parse(localStorage.getItem('ayssh_orders') || '[]');
        const allBookings = JSON.parse(localStorage.getItem('ayssh_bookings') || '[]');

        // Filter matches (matches phone exactly or matches ID)
        const matchedOrders = allOrders.filter(o => {
            return o.id.toLowerCase() === lowercaseQuery || o.phone === query;
        });

        const matchedBookings = allBookings.filter(b => {
            return b.id.toLowerCase() === lowercaseQuery || b.phone === query;
        });

        if (matchedOrders.length === 0 && matchedBookings.length === 0) {
            trackingDashboard.innerHTML = `
                <div class="empty-cart-msg" style="padding: 40px 0; background: var(--bg-tertiary); border: 1px dashed var(--border-color); border-radius: 12px; grid-column: 1/-1;">
                    <i class="fa-solid fa-magnifying-glass-minus"></i>
                    <p>No active orders or reservations found for "${query}".</p>
                    <span style="font-size:0.8rem; color: var(--text-muted); display:block; margin-top:10px;">Double-check your input or try placing an order first.</span>
                </div>
            `;
            return;
        }

        // Render matched orders
        matchedOrders.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        matchedOrders.forEach(order => {
            const orderDateStr = new Date(order.timestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const itemsSummary = Array.isArray(order.items)
                ? order.items.map(it => `${it.name} (x${it.quantity})`).join(', ')
                : order.items;

            // Map status to progress bar details
            let progressWidth = '0%';
            let stepProcessingClass = 'step-node completed';
            let stepPreparingClass = 'step-node';
            let stepDispatchingClass = 'step-node';
            let stepCompletedClass = 'step-node';

            const status = order.status || 'Processing';

            if (status === 'Processing') {
                progressWidth = '10%';
                stepProcessingClass = 'step-node active';
            } else if (status === 'Preparing') {
                progressWidth = '45%';
                stepProcessingClass = 'step-node completed';
                stepPreparingClass = 'step-node active';
            } else if (status === 'Dispatching') {
                progressWidth = '80%';
                stepProcessingClass = 'step-node completed';
                stepPreparingClass = 'step-node completed';
                stepDispatchingClass = 'step-node active';
            } else if (status === 'Completed') {
                progressWidth = '100%';
                stepProcessingClass = 'step-node completed';
                stepPreparingClass = 'step-node completed';
                stepDispatchingClass = 'step-node completed';
                stepCompletedClass = 'step-node completed';
            }

            const orderCard = document.createElement('div');
            orderCard.className = 'history-card';
            orderCard.innerHTML = `
                <div class="history-card-header">
                    <div class="history-card-title">
                        <i class="fa-solid fa-receipt" style="color: var(--primary); font-size: 1.4rem;"></i>
                        <h3>Order <span class="history-id">${order.id}</span></h3>
                    </div>
                    <span class="history-date">${orderDateStr}</span>
                </div>
                
                <div class="history-card-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Customer Name</div>
                            <div class="detail-value">${order.name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Delivery Mode</div>
                            <div class="detail-value">${order.deliveryType}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Items Summary</div>
                            <div class="detail-value">${itemsSummary}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Total Amount</div>
                            <div class="detail-value" style="color: var(--primary); font-size: 1.15rem;">Rs. ${order.total.toLocaleString()}</div>
                        </div>
                    </div>

                    <!-- Progress Stepper -->
                    <div class="progress-stepper">
                        <div class="progress-line" style="width: ${progressWidth};"></div>
                        <div class="${stepProcessingClass}">
                            <div class="step-circle"><i class="fa-solid fa-receipt"></i></div>
                            <div class="step-label">Received</div>
                        </div>
                        <div class="${stepPreparingClass}">
                            <div class="step-circle"><i class="fa-solid fa-fire-burner"></i></div>
                            <div class="step-label">Kitchen</div>
                        </div>
                        <div class="${stepDispatchingClass}">
                            <div class="step-circle"><i class="fa-solid fa-truck-ramp-box"></i></div>
                            <div class="step-label">Ready / Way</div>
                        </div>
                        <div class="${stepCompletedClass}">
                            <div class="step-circle"><i class="fa-solid fa-circle-check"></i></div>
                            <div class="step-label">Completed</div>
                        </div>
                    </div>
                </div>
            `;
            trackingDashboard.appendChild(orderCard);
        });

        // Render matched bookings
        matchedBookings.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        matchedBookings.forEach(booking => {
            const bookingDateStr = new Date(booking.timestamp).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const bookingCard = document.createElement('div');
            bookingCard.className = 'history-card';
            bookingCard.style.borderColor = 'rgba(201, 160, 84, 0.4)';
            
            bookingCard.innerHTML = `
                <div class="history-card-header">
                    <div class="history-card-title">
                        <i class="fa-solid fa-calendar-check" style="color: var(--primary); font-size: 1.4rem;"></i>
                        <h3>Table Booking <span class="history-id">${booking.id}</span></h3>
                    </div>
                    <span class="history-date">${bookingDateStr}</span>
                </div>
                
                <div class="history-card-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Guest Name</div>
                            <div class="detail-value">${booking.name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Party Size</div>
                            <div class="detail-value">${booking.guests} Guests</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Table Layout</div>
                            <div class="detail-value">${booking.table}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Reserved Date & Slot</div>
                            <div class="detail-value">${booking.date} (${booking.time})</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; display:flex; justify-content:flex-end;">
                        <button class="btn btn-secondary cancel-booking-btn" data-id="${booking.id}" style="padding: 8px 18px; font-size: 0.8rem; border-color: rgba(231, 76, 60, 0.4); color: #e74c3c;">
                            <i class="fa-solid fa-xmark"></i> Cancel Reservation
                        </button>
                    </div>
                </div>
            `;
            trackingDashboard.appendChild(bookingCard);
        });

        // Bind cancel buttons
        document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                cancelReservation(id);
            });
        });
    }

    // Cancellation Handler
    function cancelReservation(id) {
        if (confirm(`Are you sure you want to cancel reservation ${id}?`)) {
            // Delete reservation in local storage
            let allBookings = JSON.parse(localStorage.getItem('ayssh_bookings') || '[]');
            allBookings = allBookings.filter(b => b.id !== id);
            localStorage.setItem('ayssh_bookings', JSON.stringify(allBookings));

            // Sync with Firestore
            if (db) {
                db.collection('bookings').doc(id).delete()
                    .then(() => console.log(`Reservation ${id} deleted from Firestore`))
                    .catch(err => console.error("Error deleting reservation from Firestore:", err));
            }

            showToast(`Reservation ${id} successfully cancelled.`);
            refreshTrackingDashboard();
        }
    }

    // --- AI ASSISTANT CHATBOT LOGIC ---
    const chatInputForm = document.getElementById('chatInputForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (chatInputForm) {
        chatInputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) {
                sendUserMessage(text);
                chatInput.value = '';
            }
        });
    }

    // Handle suggested chips click
    document.querySelectorAll('.chat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.getAttribute('data-msg');
            sendUserMessage(msg);
        });
    });

    function sendUserMessage(text) {
        // 1. Render User message in UI
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-message user-msg';
        msgEl.innerHTML = `<p>${escapeHTML(text)}</p><span class="time-stamp">${getCurrentTimeStr()}</span>`;
        chatMessages.appendChild(msgEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 2. Render typing indicator
        const typingEl = document.createElement('div');
        typingEl.className = 'typing-indicator';
        typingEl.id = 'chatTypingIndicator';
        typingEl.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 3. Generate response with delay
        setTimeout(() => {
            // Remove typing indicator
            const indicator = document.getElementById('chatTypingIndicator');
            if (indicator) indicator.remove();

            const botResponse = generateAIResponse(text);
            const botEl = document.createElement('div');
            botEl.className = 'chat-message bot-msg';
            botEl.innerHTML = `<p>${botResponse}</p><span class="time-stamp">${getCurrentTimeStr()}</span>`;
            chatMessages.appendChild(botEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    function generateAIResponse(text) {
        const query = text.toLowerCase();

        // 1. Timings Queries
        if (query.includes('timings') || query.includes('time') || query.includes('open') || query.includes('hour')) {
            return "Ayssh Cafe is open daily from <strong>12:00 PM to 12:00 AM</strong>. Join us for lunch, high tea, or dinner!";
        }

        // 2. Best Sellers
        if (query.includes('best seller') || query.includes('popular') || query.includes('recommend') || query.includes('favorite') || query.includes('special')) {
            return "Our customer favorites are the <strong>Caramel Macchiato (Rs. 550)</strong>, <strong>Traditional Karak Chai (Rs. 250)</strong>, and the decadent <strong>Velvet Rose Cake (Rs. 1,200)</strong>! You should definitely try them.";
        }

        // 3. Coffee
        if (query.includes('coffee') || query.includes('cappuccino') || query.includes('macchiato') || query.includes('espresso')) {
            return "We brew premium specialty espresso! You can choose our <strong>Premium Cappuccino (Rs. 450)</strong> or our sweet <strong>Caramel Macchiato (Rs. 550)</strong>. All our beans are roasted in-house.";
        }

        // 4. Tea / Chai
        if (query.includes('tea') || query.includes('chai') || query.includes('karak') || query.includes('noon')) {
            return "We are famous for our <strong>Traditional Karak Chai (Rs. 250)</strong> simmered with milk, cardamom, and saffron. We also serve Kashmiri Noon Chai.";
        }

        // 5. Cakes
        if (query.includes('cake') || query.includes('truffle') || query.includes('rose') || query.includes('lemon')) {
            return "Our cakes are baked fresh daily! We have: <br>• <strong>Velvet Rose Cake</strong> (Rs. 1,200)<br>• <strong>Chocolate Fudge Truffle</strong> (Rs. 950)<br>• <strong>Lemon Drizzle Cake</strong> (Rs. 850)";
        }

        // 6. Cookies
        if (query.includes('cookie') || query.includes('biscotti') || query.includes('biscuit') || query.includes('almond')) {
            return "Indulge in our oven-baked cookies:<br>• <strong>Choco-Chip Giant Cookie</strong> (Rs. 180)<br>• <strong>Butter Almond Biscotti</strong> (Rs. 220)<br>• <strong>Coconut Crunch Biscuits</strong> (Rs. 150)";
        }

        // 7. Booking / Reservation
        if (query.includes('book') || query.includes('reserve') || query.includes('table') || query.includes('seat')) {
            return "You can book a table instantly! Just head over to our <strong>'Book Table'</strong> tab, select your guests, layout preference (Window view, Cozy corner), date, and slot, and we'll save your table.";
        }

        // 8. Location
        if (query.includes('location') || query.includes('located') || query.includes('where') || query.includes('place') || query.includes('address')) {
            return "Ayssh Cafe is located in the premium commercial hub at <strong>Block C, Heritage Boulevard, Lahore</strong>. Find us next to the old fountain!";
        }

        // Default response
        return "I'd love to help you with that! You can ask me about our coffee brew types, gourmet cake flavors, timings, location, or how to reserve a table.";
    }

    function getCurrentTimeStr() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHTML(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }

    // --- HELPER TOAST NOTIFICATION ---
    function showToast(message) {
        const toast = document.getElementById('customToast');
        const toastMsg = document.getElementById('toastMsg');
        
        toastMsg.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // --- INITIALIZE APPLICATION PAGE ---
    renderMenu();
    updateCartBadge();
    renderCart();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reserveDate').setAttribute('min', today);
});
