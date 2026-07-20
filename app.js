// ==========================================
// Cafe Ayssh - Web Application Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // ---- STATE MANAGEMENT ----
    let cart = [];
    let currentTestimonialIndex = 0;
    const TAX_RATE = 0.15; // 15% GST
    let deliveryFee = 150; // Rs. 150
    let trackerInterval = null;

    // No mock database initialization (starting empty as requested)

    // Sync menu price adjustments from localStorage
    const syncMenuPrices = () => {
        const adjustments = JSON.parse(localStorage.getItem('ayssh_menu_adjustments') || '{}');
        Object.keys(adjustments).forEach(id => {
            const button = document.querySelector(`.add-to-cart-btn[data-id="${id}"]`);
            if (button) {
                // Update internal price data attribute
                button.setAttribute('data-price', adjustments[id]);
                // Update visual price tag on the card
                const cardContainer = button.closest('.menu-info');
                if (cardContainer) {
                    const priceTag = cardContainer.querySelector('.menu-item-price');
                    if (priceTag) {
                        priceTag.textContent = `Rs. ${adjustments[id]}`;
                    }
                }
            }
        });
    };
    syncMenuPrices();

    // ---- DOM ELEMENTS ----
    const header = document.querySelector('.header');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Cart Elements
    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartBadge = document.getElementById('cartBadge');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartTax = document.getElementById('cartTax');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Checkout Modal Elements
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutModalBtn = document.getElementById('closeCheckoutModal');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutType = document.getElementById('checkoutType');
    const addressGroup = document.getElementById('addressGroup');
    const checkoutAddress = document.getElementById('checkoutAddress');
    const checkoutSummaryTotal = document.getElementById('checkoutSummaryTotal');
    
    // Menu Elements
    const filterButtons = document.querySelectorAll('.filter-btn');
    const menuCards = document.querySelectorAll('.menu-card');
    
    // Reservation Elements
    const resForm = document.getElementById('resForm');
    const ticketModal = document.getElementById('ticketModal');
    const closeModalBtn = document.getElementById('closeModal');
    
    // Order Success Modal Elements
    const orderModal = document.getElementById('orderModal');
    const closeOrderModalBtn = document.getElementById('closeOrderModal');
    const orderSummaryItems = document.getElementById('orderSummaryItems');
    const orderPaidTotal = document.getElementById('orderPaidTotal');
    const invoiceDeliveryType = document.getElementById('invoiceDeliveryType');
    const invoicePhone = document.getElementById('invoicePhone');
    const invoiceAddress = document.getElementById('invoiceAddress');
    const invoiceAddressRow = document.getElementById('invoiceAddressRow');
    const invoicePayment = document.getElementById('invoicePayment');
    
    // Tracker Elements
    const trackerProgressBar = document.getElementById('trackerProgressBar');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const step4 = document.getElementById('step-4');
    
    // Testimonial Elements
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const sliderDots = document.querySelectorAll('.dot');
    
    // Map Element
    const mapPin = document.querySelector('.map-pin');
    const pinPopup = document.querySelector('.pin-popup');

    // ---- HEADER SCROLL EVENT ----
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ---- MOBILE NAV TOGGLE ----
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (navMenu.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });
    }

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            if (mobileMenuBtn) {
                mobileMenuBtn.querySelector('i').className = 'fa-solid fa-bars';
            }
        });
    });

    // ---- CART DRAWER CONTROLS ----
    const openCartDrawer = () => {
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeCartDrawer = () => {
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = 'auto';
    };

    cartToggle.addEventListener('click', openCartDrawer);
    closeCart.addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    // ---- ADD TO CART FUNCTIONALITY ----
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const button = e.target;
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            
            addToCart(id, name, price);
            
            // Visual feedback on button click
            const originalText = button.textContent;
            button.textContent = 'Added to Bag! ✓';
            button.style.backgroundColor = '#D4A373';
            button.style.color = '#14100D';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
                button.style.color = '';
            }, 1200);

            // Open the cart drawer automatically for micro-interaction feedback
            setTimeout(openCartDrawer, 400);
        }
    });

    const addToCart = (id, name, price) => {
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price,
                quantity: 1
            });
        }
        
        updateCartDOM();
    };

    const updateCartDOM = () => {
        // Calculate items counts
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItemsCount;

        // Render Cart Items
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty-message">
                    <i class="fa-solid fa-mug-hot"></i>
                    <p>Your bag is empty. Add some fresh delights!</p>
                </div>
            `;
            cartSubtotal.textContent = 'Rs. 0';
            cartTax.textContent = 'Rs. 0';
            cartTotal.textContent = 'Rs. 0';
            return;
        }

        let cartHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            cartHTML += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <span>Rs. ${item.price}</span>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn dec-qty" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn inc-qty" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <button class="remove-cart-item" data-id="${item.id}">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = cartHTML;

        // Calculations
        const tax = Math.round(subtotal * TAX_RATE);
        const total = subtotal + tax;

        cartSubtotal.textContent = `Rs. ${subtotal}`;
        cartTax.textContent = `Rs. ${tax}`;
        cartTotal.textContent = `Rs. ${total}`;

        // Attach event listeners for item logic
        attachCartItemEvents();
    };

    const attachCartItemEvents = () => {
        // Decrement button
        document.querySelectorAll('.dec-qty').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const item = cart.find(i => i.id === id);
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart = cart.filter(i => i.id !== id);
                }
                updateCartDOM();
            };
        });

        // Increment button
        document.querySelectorAll('.inc-qty').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const item = cart.find(i => i.id === id);
                item.quantity += 1;
                updateCartDOM();
            };
        });

        // Delete button
        document.querySelectorAll('.remove-cart-item').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                cart = cart.filter(i => i.id !== id);
                updateCartDOM();
            };
        });
    };

    // ---- CHECKOUT TRANSITION FLOW ----
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        closeCartDrawer();
        updateCheckoutModalTotal();
        checkoutModal.classList.add('open');
    });

    closeCheckoutModalBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('open');
    });

    // Delivery vs Pickup selection in Checkout form
    checkoutType.addEventListener('change', () => {
        if (checkoutType.value === 'pickup') {
            addressGroup.style.display = 'none';
            checkoutAddress.removeAttribute('required');
            deliveryFee = 0;
        } else {
            addressGroup.style.display = 'block';
            checkoutAddress.setAttribute('required', 'required');
            deliveryFee = 150;
        }
        updateCheckoutModalTotal();
    });

    const updateCheckoutModalTotal = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * TAX_RATE);
        const finalTotal = subtotal + tax + deliveryFee;
        checkoutSummaryTotal.textContent = `Rs. ${finalTotal}`;
    };

    // ---- FINAL CHECKOUT FORM SUBMISSION & DELIVERY TRACKER ----
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get checkout details
        const phone = document.getElementById('checkoutPhone').value;
        const address = checkoutAddress.value;
        const paymentValue = document.getElementById('checkoutPayment').value;
        const typeValue = checkoutType.value;

        // Payment text translation
        let paymentText = 'Cash on Delivery';
        if (paymentValue === 'card') paymentText = 'Credit / Debit Card';
        if (paymentValue === 'wallet') paymentText = 'Mobile Wallet (EasyPaisa/JazzCash)';

        // Render Invoice Modal Details
        let summaryHTML = '';
        let subtotal = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            summaryHTML += `
                <div class="order-summary-item">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>Rs. ${itemTotal}</span>
                </div>
            `;
        });
        
        const tax = Math.round(subtotal * TAX_RATE);
        const finalTotal = subtotal + tax + deliveryFee;

        // Delivery details in invoice
        invoicePhone.textContent = phone;
        invoicePayment.textContent = paymentText;
        if (typeValue === 'pickup') {
            invoiceDeliveryType.textContent = 'Self-Pickup (Free)';
            invoiceAddressRow.style.display = 'none';
        } else {
            invoiceDeliveryType.textContent = `Home Delivery (Rs. ${deliveryFee} fee added)`;
            invoiceAddressRow.style.display = 'flex';
            invoiceAddress.textContent = address;
        }

        orderSummaryItems.innerHTML = summaryHTML;
        // Append delivery and GST detail lines to summary
        orderSummaryItems.innerHTML += `
            <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 8px 0;">
            <div class="order-summary-item">
                <span style="color: var(--text-muted);">Cart Subtotal</span>
                <span>Rs. ${subtotal}</span>
            </div>
            <div class="order-summary-item">
                <span style="color: var(--text-muted);">GST (15%)</span>
                <span>Rs. ${tax}</span>
            </div>
            <div class="order-summary-item">
                <span style="color: var(--text-muted);">Delivery Charges</span>
                <span>Rs. ${deliveryFee}</span>
            </div>
        `;
        orderPaidTotal.textContent = `Rs. ${finalTotal}`;

        // Save to localStorage
        const orders = JSON.parse(localStorage.getItem('ayssh_orders') || '[]');
        
        // Generate Sequential Order ID
        let nextOrderNum = parseInt(localStorage.getItem('ayssh_order_counter') || '0');
        const orderId = '#ORD-' + nextOrderNum;
        localStorage.setItem('ayssh_order_counter', nextOrderNum + 1);

        const newOrder = {
            id: orderId,
            phone: phone,
            address: address || 'N/A',
            paymentType: paymentText,
            deliveryType: typeValue === 'pickup' ? 'Pickup' : 'Delivery',
            items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            subtotal: subtotal,
            tax: tax,
            deliveryFee: deliveryFee,
            total: finalTotal,
            status: 'Processing',
            timestamp: new Date().toISOString()
        };
        orders.push(newOrder);
        localStorage.setItem('ayssh_orders', JSON.stringify(orders));

        // Close Checkout form, open Success Modal
        checkoutModal.classList.remove('open');
        orderModal.classList.add('open');

        // Clear Cart State
        cart = [];
        updateCartDOM();

        // Launch Live Delivery Status Simulator
        startOrderDeliveryTracker(typeValue === 'pickup');
    });

    // ---- LIVE DELIVERY TRACKER LOGIC ----
    const startOrderDeliveryTracker = (isPickup) => {
        // Clear any previous interval
        if (trackerInterval) clearInterval(trackerInterval);

        // Update step titles dynamically if pickup
        if (isPickup) {
            step3.querySelector('span').textContent = 'Ready';
            step3.querySelector('.step-icon i').className = 'fa-solid fa-cookie-bite';
            step4.querySelector('span').textContent = 'Picked Up';
        } else {
            step3.querySelector('span').textContent = 'On the Way';
            step3.querySelector('.step-icon i').className = 'fa-solid fa-motorcycle';
            step4.querySelector('span').textContent = 'Delivered';
        }

        // Reset tracker visuals to step 1 active
        trackerProgressBar.style.width = '0%';
        resetStepsClasses();
        step1.classList.add('active');

        let currentStep = 1;

        // Simulator: Advance steps every 5 seconds
        trackerInterval = setInterval(() => {
            currentStep++;
            if (currentStep === 2) {
                // Kitchen step
                step1.classList.remove('active');
                step1.classList.add('completed');
                step2.classList.add('active');
                trackerProgressBar.style.width = '33%';
            } else if (currentStep === 3) {
                // Out for delivery / Ready step
                step2.classList.remove('active');
                step2.classList.add('completed');
                step3.classList.add('active');
                trackerProgressBar.style.width = '66%';
            } else if (currentStep === 4) {
                // Delivered / Picked up step
                step3.classList.remove('active');
                step3.classList.add('completed');
                step4.classList.add('active');
                step4.classList.add('completed');
                trackerProgressBar.style.width = '100%';
                
                // End Simulation
                clearInterval(trackerInterval);
            }
        }, 5000);
    };

    const resetStepsClasses = () => {
        const steps = [step1, step2, step3, step4];
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });
    };

    closeOrderModalBtn.addEventListener('click', () => {
        orderModal.classList.remove('open');
        if (trackerInterval) {
            clearInterval(trackerInterval);
        }
    });

    // ---- MENU CATEGORY FILTER ----
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active state from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active to clicked button
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            menuCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                // Card transitions
                card.style.opacity = '0';
                card.style.transform = 'scale(0.85) translateY(10px)';

                setTimeout(() => {
                    if (filterValue === 'all' || category === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1) translateY(0)';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                }, 300);
            });
        });
    });

    // ---- RESERVATION SUBMISSION ----
    if (resForm) {
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('resDate').setAttribute('min', todayStr);
        document.getElementById('resDate').value = todayStr;

        resForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Fetch inputs
            const name = document.getElementById('resName').value;
            const guests = document.getElementById('resGuests').value;
            const table = document.getElementById('resTable').value;
            const date = document.getElementById('resDate').value;
            const time = document.getElementById('resTime').value;

            // Generate Sequential Booking ID
            let nextBookingNum = parseInt(localStorage.getItem('ayssh_booking_counter') || '0');
            const randomId = '#AC-' + nextBookingNum;
            localStorage.setItem('ayssh_booking_counter', nextBookingNum + 1);

            // Populate Ticket Modal
            document.getElementById('ticketId').textContent = randomId;
            document.getElementById('ticketName').textContent = name;
            document.getElementById('ticketDate').textContent = date;
            document.getElementById('ticketTime').textContent = time;
            document.getElementById('ticketGuests').textContent = guests === '1' ? '1 Person' : guests + ' People';
            document.getElementById('ticketTable').textContent = table;

            // Save to localStorage
            const bookings = JSON.parse(localStorage.getItem('ayssh_bookings') || '[]');
            bookings.push({
                id: randomId,
                name: name,
                guests: guests === '1' ? '1 Person' : guests + ' People',
                table: table,
                date: date,
                time: time,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('ayssh_bookings', JSON.stringify(bookings));

            // Show ticket modal
            ticketModal.classList.add('open');

            // Reset form
            resForm.reset();
            document.getElementById('resDate').value = todayStr;
        });
    }

    closeModalBtn.addEventListener('click', () => {
        ticketModal.classList.remove('open');
    });

    // ---- TESTIMONIALS SLIDER ----
    const showTestimonial = (index) => {
        testimonialCards.forEach((card, idx) => {
            card.classList.remove('active');
            sliderDots[idx].classList.remove('active');
            if (idx === index) {
                card.classList.add('active');
                sliderDots[idx].classList.add('active');
            }
        });
        
        const slider = document.getElementById('testimonialsSlider');
        slider.style.transform = `translateX(-${index * 100}%)`;
    };

    sliderDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            currentTestimonialIndex = index;
            showTestimonial(index);
        });
    });

    // Auto rotate every 5 seconds
    setInterval(() => {
        currentTestimonialIndex = (currentTestimonialIndex + 1) % testimonialCards.length;
        showTestimonial(currentTestimonialIndex);
    }, 5000);

    // ---- MAP PIN MICRO-INTERACTION ----
    if (mapPin) {
        mapPin.addEventListener('click', () => {
            pinPopup.style.display = pinPopup.style.display === 'none' ? 'block' : 'none';
        });
        pinPopup.style.display = 'block';
    }

    // ==========================================
    // 3D Animations & Scrolling Effects (Added)
    // ==========================================

    // 1. Viewport Reveal Animations (Scroll Reveal)
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Stop observing once revealed
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12, // Trigger when 12% of the element is visible
            rootMargin: '0px 0px -40px 0px' // Offset bottom margin for better entrance timing
        });

        // Setup stagger animations dynamically for grids
        document.querySelectorAll('.menu-grid, .stats-grid').forEach(grid => {
            const items = grid.querySelectorAll('.reveal');
            items.forEach((item, index) => {
                item.style.transitionDelay = `${index * 0.1}s`;
            });
        });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }

    // 2. Scroll Progress Bar & Scroll To Top Button
    const progressBar = document.getElementById('scrollProgress');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    window.addEventListener('scroll', () => {
        // Progress Bar Width
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (progressBar && docHeight > 0) {
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        }

        // Show/Hide Scroll to Top Button
        if (scrollTopBtn) {
            if (scrollTop > 400) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        }
    });

    // Scroll back to top smoothly
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 3. 3D Tilt Hover Effects on Cards
    const tiltCards = document.querySelectorAll('.menu-card, .testimonial-card');

    tiltCards.forEach(card => {
        // Dynamic tilt calculation
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            
            // Mouse position relative to the element bounding box
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Element dimensions
            const width = rect.width;
            const height = rect.height;

            // Normalize coordinate system so the center of the card is (0,0)
            const centerX = width / 2;
            const centerY = height / 2;

            // Normalize values from -1 to 1
            const normalizedX = (x - centerX) / centerX; // -1 on left, +1 on right
            const normalizedY = (y - centerY) / centerY; // -1 on top, +1 on bottom

            // Rotations (max 8 degrees for premium look)
            const maxTilt = 8;
            const tiltY = (normalizedX * maxTilt).toFixed(2); // Y rotation depends on X cursor offset
            const tiltX = (normalizedY * -maxTilt).toFixed(2); // X rotation depends on Y cursor offset (inverted)

            // Temporary set quick transition for mouse movements
            card.style.transition = 'transform 0.1s ease-out, border-color 0.4s ease, box-shadow 0.4s ease';
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px) scale(1.02)`;

            // Push details inside the card in 3D
            const popElements = card.querySelectorAll('.menu-img-wrapper, .menu-item-title, .menu-item-price, .add-to-cart-btn, .quote, .user-info');
            popElements.forEach(el => {
                el.style.transform = 'translateZ(30px)';
            });
        });

        // Reset smooth state when mouse leaves
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.4s ease, box-shadow 0.4s ease';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
            
            const popElements = card.querySelectorAll('.menu-img-wrapper, .menu-item-title, .menu-item-price, .add-to-cart-btn, .quote, .user-info');
            popElements.forEach(el => {
                el.style.transform = 'translateZ(0px)';
            });
        });
    });

    // 4. Hero Mouse Parallax Effect
    const heroSection = document.querySelector('.hero-section');
    const heroDecoItems = document.querySelectorAll('.hero-deco');

    if (heroSection && heroDecoItems.length > 0) {
        heroSection.addEventListener('mousemove', (e) => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Normalized coordinates from -0.5 to 0.5
            const mouseX = (e.clientX / width) - 0.5;
            const mouseY = (e.clientY / height) - 0.5;

            heroDecoItems.forEach(item => {
                const speed = parseFloat(item.getAttribute('data-speed')) || 2;
                const xVal = (mouseX * speed * 25).toFixed(2);
                const yVal = (mouseY * speed * 25).toFixed(2);

                // Combine float keyframes with mouse parallax offsets
                item.style.transform = `translate3d(${xVal}px, ${yVal}px, 0)`;
            });
        });

        // Reset positions smoothly on mouse leave
        heroSection.addEventListener('mouseleave', () => {
            heroDecoItems.forEach(item => {
                item.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
                item.style.transform = 'translate3d(0, 0, 0)';
                // Remove transition after reset to keep mousemove smooth
                setTimeout(() => {
                    item.style.transition = '';
                }, 800);
            });
        });
    }

    // 5. Dynamic Single Page Section Switching (SPA)
    const showSection = (targetId) => {
        const sections = document.querySelectorAll('main > section');
        const targetSection = document.getElementById(targetId);
        
        if (!targetSection) return;

        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.style.display = 'block';
                // Force layout reflow
                sec.offsetHeight; 
                sec.classList.add('active-section');
                sec.classList.add('active'); // trigger reveal animations inside it!
                
                // Trigger reveal children inside this section too
                sec.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(child => {
                    child.classList.add('active');
                });
            } else {
                sec.classList.remove('active-section');
                sec.style.display = 'none';
            }
        });

        // Scroll to top of page smoothly and instantly
        window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Global listener for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            if (targetHref.length <= 1) return;
            
            const targetId = targetHref.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection && targetSection.tagName === 'SECTION') {
                e.preventDefault();
                showSection(targetId);
                
                // Sync Navbar Active Class
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${targetId}`) {
                        link.classList.add('active');
                    }
                });

                // Update location hash without scrolling automatically
                history.pushState(null, null, `#${targetId}`);

                // Close mobile menu if open
                const navMenu = document.getElementById('navMenu');
                if (navMenu && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                }
            }
        });
    });

    // Check initial hash on load
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
        showSection(initialHash);
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${initialHash}`) {
                link.classList.add('active');
            }
        });
    } else {
        // Show home by default
        showSection('home');
    }

    // ---- CHATBOT WIDGET CONTROLLERS ----
    const chatbotBubble = document.getElementById('chatbotBubble');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatbotForm = document.getElementById('chatbotForm');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotFeed = document.getElementById('chatbotFeed');
    const promptChips = document.querySelectorAll('.chatbot-prompt-chip');

    // Toggle Chatbot Window Open/Close
    chatbotBubble.addEventListener('click', () => {
        chatbotBubble.classList.add('active');
        chatbotWindow.classList.toggle('open');
        // Clear bubble notifications
        const notification = chatbotBubble.querySelector('.chatbot-notification');
        if (notification) notification.style.display = 'none';
        
        // Auto scroll to bottom
        chatbotFeed.scrollTop = chatbotFeed.scrollHeight;
    });

    closeChatbot.addEventListener('click', () => {
        chatbotWindow.classList.remove('open');
    });

    // Helper to append message bubble to feed
    const appendChatMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chatbot-msg ${sender}`;
        msgDiv.innerHTML = `<div class="chatbot-msg-bubble">${text}</div>`;
        chatbotFeed.appendChild(msgDiv);
        chatbotFeed.scrollTop = chatbotFeed.scrollHeight;
    };

    // Helper to render Typing Indicator
    const showTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-msg bot temp-typing';
        typingDiv.innerHTML = `
            <div class="chatbot-msg-bubble typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        chatbotFeed.appendChild(typingDiv);
        chatbotFeed.scrollTop = chatbotFeed.scrollHeight;
        return typingDiv;
    };

    // Chatbot Reply mapping dictionary
    const getBotResponse = (text) => {
        const cleanVal = text.toLowerCase().trim();

        if (cleanVal.includes('time') || cleanVal.includes('hour') || cleanVal.includes('timing') || cleanVal.includes('open') || cleanVal.includes('close')) {
            return "🕒 We are open daily from **8:00 AM to 11:00 PM**. Feel free to drop by for fresh brews or cakes anytime!";
        }
        if (cleanVal.includes('locate') || cleanVal.includes('address') || cleanVal.includes('where') || cleanVal.includes('map') || cleanVal.includes('karachi')) {
            return "📍 We are located at **102 Cocoa Bean Blvd, Clifton, Karachi**. Drop by to experience our premium coffee retreat!";
        }
        if (cleanVal.includes('book') || cleanVal.includes('reserve') || cleanVal.includes('table') || cleanVal.includes('seat')) {
            return "📅 Sure! You can book a table directly in our <a href='#reservation' class='chatbot-link' style='color: var(--primary); font-weight: 700; text-decoration: underline;'>Book Table</a> section. Select your slot and confirm instantly!";
        }
        if (cleanVal.includes('special') || cleanVal.includes('today') || cleanVal.includes('recommend') || cleanVal.includes('best')) {
            return "✨ Today's Special recommendation:\n• **Espresso Romano** matched with **Butter Almond Biscotti** ☕\n• Or try our popular **Chocolate Fudge Truffle** slice! 🍰";
        }
        if (cleanVal.includes('cake') || cleanVal.includes('sweet') || cleanVal.includes('chocolate') || cleanVal.includes('lemon')) {
            return "🍰 We serve three premium cakes:\n• **Chocolate Fudge Truffle** (Rs. 950)\n• **Velvet Rose Cake** (Rs. 1200)\n• **Lemon Drizzle Cake** (Rs. 850)";
        }
        if (cleanVal.includes('cookie') || cleanVal.includes('biscuit') || cleanVal.includes('coconut')) {
            return "🍪 Check out our artisanal crunchies:\n• **Choco-Chip Giant Cookie** (Rs. 180)\n• **Butter Almond Biscotti** (Rs. 220)\n• **Coconut Crunch Biscuits** (Rs. 150)";
        }
        if (cleanVal.includes('hello') || cleanVal.includes('hi') || cleanVal.includes('hey') || cleanVal.includes('hola')) {
            return "👋 Hey there! Welcome to Ayssh Cafe. Ask me about our cafe timings, location, table reservations, or specials!";
        }
        
        // Fallback response
        return "☕ I'm a helper bot for Ayssh Cafe! Ask me about our **timings**, **location**, **table reservations**, or **specials**, and I will assist you instantly.";
    };

    // Process Bot message with simulated typing delay (or Groq LPU API)
    const processBotReply = async (userText) => {
        const indicator = showTypingIndicator();
        
        // Hardcode your Groq API Key here (starts with gsk_...) so the chatbot works for all online visitors.
        // WARNING: Since this is a static site, this key will be visible in the browser source code.
        const HARDCODED_API_KEY = "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"; 
        const apiKey = localStorage.getItem('ayssh_groq_api_key') || HARDCODED_API_KEY;

        if (apiKey) {
            try {
                // System instructions to customize Groq for Ayssh Cafe
                const systemPrompt = `You are the friendly, elegant AI Assistant host for Ayssh Cafe in Clifton, Karachi.
• Cafe Timings: 8:00 AM to 11:00 PM.
• Menu Items: Premium Cappuccino (Rs. 450), Traditional Karak Chai (Rs. 250), Caramel Macchiato (Rs. 550), Chocolate Fudge Truffle (Rs. 950), Velvet Rose Cake (Rs. 1200), Lemon Drizzle Cake (Rs. 850), Choco-Chip Giant Cookie (Rs. 180), Butter Almond Biscotti (Rs. 220), Coconut Crunch Biscuits (Rs. 150).
• Table Reservations: Visitors can reserve tables online. If they ask about booking a table, provide them with this link: <a href='#reservation' class='chatbot-link' style='color: var(--primary); font-weight: 700; text-decoration: underline;'>Book Table</a>.
Keep your responses polite, warm, premium, concise, and helpful. Do not talk about unrelated things unless the user asks general questions, but always maintain your persona as the Ayssh Cafe host. Output standard HTML formatting or bold markers.`;

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userText }
                        ],
                        model: 'llama-3.1-8b-instant',
                        stream: false
                    })
                });

                const data = await response.json();
                indicator.remove();

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    let aiText = data.choices[0].message.content;
                    // Format bold markers and line breaks
                    aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    aiText = aiText.replace(/\n/g, '<br>');
                    appendChatMessage(aiText, 'bot');
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (err) {
                console.error('Groq API Error:', err);
                indicator.remove();
                // Fallback to local
                const rawReply = getBotResponse(userText);
                const formattedReply = rawReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                appendChatMessage(formattedReply + "<br><br><span style='font-size:0.75rem; color:var(--text-muted);'>(Note: API key connection error. Showing local response.)</span>", 'bot');
            }
        } else {
            // Standard local keyword matcher fallback
            setTimeout(() => {
                indicator.remove();
                const rawReply = getBotResponse(userText);
                const formattedReply = rawReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Append notice that user can connect real Groq
                const inviteNotice = "<br><br><span style='font-size:0.75rem; color:var(--text-muted);'>(You can connect a real Groq AI API key in the Admin Portal to chat with me about anything!)</span>";
                appendChatMessage(formattedReply + inviteNotice, 'bot');
            }, 900);
        }
    };

    // Submitting message through input form
    chatbotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = chatbotInput.value;
        if (!userText.trim()) return;

        appendChatMessage(userText, 'user');
        chatbotInput.value = '';
        processBotReply(userText);
    });

    // Submitting message through prompt chips
    promptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptType = chip.getAttribute('data-prompt');
            let userText = '';

            if (promptType === 'timings') userText = 'What are your timings?';
            if (promptType === 'location') userText = 'Where are you located?';
            if (promptType === 'book') userText = 'How do I book a table?';
            if (promptType === 'specials') userText = 'What are your specials?';

            appendChatMessage(userText, 'user');
            processBotReply(userText);
        });
    });

    // Intercept click on links dynamically added in bot replies
    chatbotFeed.addEventListener('click', (e) => {
        if (e.target.classList.contains('chatbot-link')) {
            e.preventDefault();
            // Close chatbot window
            chatbotWindow.classList.remove('open');
            // Navigate to SPA section
            const targetId = e.target.getAttribute('href').substring(1);
            showSection(targetId);
            // Sync Navbar Active Class
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${targetId}`) {
                    link.classList.add('active');
                }
            });
            // Update hash
            history.pushState(null, null, `#${targetId}`);
        }
    });

    // ---- DEDICATED FULL-PAGE CHATBOT CONTROLLERS ----
    const pageChatForm = document.getElementById('pageChatForm');
    const pageChatInput = document.getElementById('pageChatInput');
    const pageChatFeed = document.getElementById('pageChatFeed');
    const pagePromptChips = document.querySelectorAll('.page-prompt-chip');

    // Helper to append message bubble to page feed
    const appendPageChatMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `page-chat-msg ${sender}`;
        msgDiv.innerHTML = `<div class="page-chat-bubble">${text}</div>`;
        if (pageChatFeed) {
            pageChatFeed.appendChild(msgDiv);
            pageChatFeed.scrollTop = pageChatFeed.scrollHeight;
        }
    };

    // Helper to render Typing Indicator on page feed
    const showPageTypingIndicator = () => {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'page-chat-msg bot temp-typing';
        typingDiv.innerHTML = `
            <div class="page-chat-bubble typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        if (pageChatFeed) {
            pageChatFeed.appendChild(typingDiv);
            pageChatFeed.scrollTop = pageChatFeed.scrollHeight;
        }
        return typingDiv;
    };

    // Process Bot message with simulated typing delay (or Groq LPU API) for full-page
    const processPageBotReply = async (userText) => {
        const indicator = showPageTypingIndicator();
        
        const HARDCODED_API_KEY = "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"; 
        const apiKey = localStorage.getItem('ayssh_groq_api_key') || HARDCODED_API_KEY;

        if (apiKey) {
            try {
                // System instructions to customize Groq for Ayssh Cafe
                const systemPrompt = `You are the friendly, elegant AI Assistant host for Ayssh Cafe in Clifton, Karachi.
• Cafe Timings: 8:00 AM to 11:00 PM.
• Menu Items: Premium Cappuccino (Rs. 450), Traditional Karak Chai (Rs. 250), Caramel Macchiato (Rs. 550), Chocolate Fudge Truffle (Rs. 950), Velvet Rose Cake (Rs. 1200), Lemon Drizzle Cake (Rs. 850), Choco-Chip Giant Cookie (Rs. 180), Butter Almond Biscotti (Rs. 220), Coconut Crunch Biscuits (Rs. 150).
• Table Reservations: Visitors can reserve tables online. If they ask about booking a table, provide them with this link: <a href='#reservation' class='chatbot-link' style='color: var(--primary); font-weight: 700; text-decoration: underline;'>Book Table</a>.
Keep your responses polite, warm, premium, concise, and helpful. Do not talk about unrelated things unless the user asks general questions, but always maintain your persona as the Ayssh Cafe host. Output standard HTML formatting or bold markers.`;

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userText }
                        ],
                        model: 'llama-3.1-8b-instant',
                        stream: false
                    })
                });

                const data = await response.json();
                indicator.remove();

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    let aiText = data.choices[0].message.content;
                    // Format bold markers and line breaks
                    aiText = aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    aiText = aiText.replace(/\n/g, '<br>');
                    appendPageChatMessage(aiText, 'bot');
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (err) {
                console.error('Groq API Error:', err);
                indicator.remove();
                // Fallback to local
                const rawReply = getBotResponse(userText);
                const formattedReply = rawReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                appendPageChatMessage(formattedReply, 'bot');
            }
        } else {
            // Standard local keyword matcher fallback
            setTimeout(() => {
                indicator.remove();
                const rawReply = getBotResponse(userText);
                const formattedReply = rawReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                appendPageChatMessage(formattedReply, 'bot');
            }, 900);
        }
    };

    // Submitting message through page input form
    if (pageChatForm) {
        pageChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userText = pageChatInput.value;
            if (!userText.trim()) return;

            appendPageChatMessage(userText, 'user');
            pageChatInput.value = '';
            processPageBotReply(userText);
        });
    }

    // Submitting message through page prompt chips
    pagePromptChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const promptType = chip.getAttribute('data-prompt');
            let queryText = '';

            if (promptType === 'timings') queryText = 'What are your café timings?';
            else if (promptType === 'location') queryText = 'Where is the café located?';
            else if (promptType === 'book') queryText = 'How do I book a table?';
            else if (promptType === 'specials') queryText = 'What are today\'s specials?';

            if (queryText) {
                appendPageChatMessage(queryText, 'user');
                processPageBotReply(queryText);
            }
        });
    });

    // Intercept click on links dynamically added in page bot replies
    if (pageChatFeed) {
        pageChatFeed.addEventListener('click', (e) => {
            if (e.target.classList.contains('chatbot-link') || e.target.tagName === 'A') {
                const targetHref = e.target.getAttribute('href');
                if (targetHref && targetHref.startsWith('#')) {
                    e.preventDefault();
                    const targetId = targetHref.substring(1);
                    showSection(targetId);
                    // Sync Navbar Active Class
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${targetId}`) {
                            link.classList.add('active');
                        }
                    });
                    // Update hash
                    history.pushState(null, null, `#${targetId}`);
                }
            }
        });
    }
});


