document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic
    const navigation_links = document.querySelectorAll('nav a');
    const application_sections = document.querySelectorAll('section');

    navigation_links.forEach(nav_link => {
        nav_link.addEventListener('click', (click_event) => {
            click_event.preventDefault();
            
            // Determine target section
            const target_section_id = nav_link.getAttribute('href').substring(1);
            
            // Update active link
            navigation_links.forEach(other_link => other_link.classList.remove('active'));
            nav_link.classList.add('active');
            
            // Show target section, hide others
            application_sections.forEach(section_element => {
                section_element.classList.remove('active-section');
                if (section_element.id === target_section_id) {
                    section_element.classList.add('active-section');
                }
            });
        });
    });

    // 2. Fetch Initial Data
    fetchMarketStocks();
    fetchUserStrategies();
    fetchUserWishes();

    // 3. Strategy Form Submission
    document.getElementById('strategy-form').addEventListener('submit', async (form_submit_event) => {
        form_submit_event.preventDefault();
        
        const strategy_form_data = {
            name: document.getElementById('strat-name').value,
            description: document.getElementById('strat-desc').value,
            allocation: document.getElementById('strat-alloc').value
        };

        const strategy_api_response = await fetch('/api/strategies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(strategy_form_data)
        });

        if (strategy_api_response.ok) {
            form_submit_event.target.reset();
            fetchUserStrategies();
        }
    });

    // 4. Wish Form Submission
    document.getElementById('wish-form').addEventListener('submit', async (form_submit_event) => {
        form_submit_event.preventDefault();
        
        const wish_form_data = {
            ticker: document.getElementById('wish-ticker').value,
            target_price: parseFloat(document.getElementById('wish-price').value),
            notes: document.getElementById('wish-notes').value
        };

        const wish_api_response = await fetch('/api/wishes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wish_form_data)
        });

        if (wish_api_response.ok) {
            form_submit_event.target.reset();
            fetchUserWishes();
        }
    });
});

/**
 * Fetches and displays the mock market data in the UI grid.
 */
async function fetchMarketStocks() {
    const market_api_response = await fetch('/api/stocks');
    const market_stocks_data = await market_api_response.json();
    const market_grid_container = document.getElementById('market-grid');
    
    market_grid_container.innerHTML = '';

    market_stocks_data.forEach(stock_item => {
        const is_positive_change = stock_item.change.startsWith('+');
        const stock_card_element = document.createElement('div');
        stock_card_element.className = 'card';
        stock_card_element.innerHTML = `
            <div class="stock-header">
                <span class="ticker">${stock_item.ticker}</span>
                <span class="change ${is_positive_change ? 'positive' : 'negative'}">${stock_item.change}</span>
            </div>
            <div class="stock-name" style="color: var(--text-secondary); margin-bottom: 1rem;">
                ${stock_item.name}
            </div>
            <div class="price">$${stock_item.price.toFixed(2)}</div>
        `;
        market_grid_container.appendChild(stock_card_element);
    });
}

/**
 * Fetches user strategies from the backend and displays them.
 */
async function fetchUserStrategies() {
    const strategy_api_response = await fetch('/api/strategies');
    const strategy_list_data = await strategy_api_response.json();
    const strategy_list_container = document.getElementById('strategies-list');
    
    strategy_list_container.innerHTML = '';

    if (strategy_list_data.length === 0) {
        strategy_list_container.innerHTML = '<p style="color: var(--text-secondary);">No strategies created yet.</p>';
        return;
    }

    strategy_list_data.forEach(strategy_item => {
        const strategy_card_element = document.createElement('div');
        strategy_card_element.className = 'list-item';
        
        let allocationHtml = '';
        if (strategy_item.allocation) {
            allocationHtml = `<p style="margin-top: 0.5rem; color: var(--accent-secondary);">Allocation: ${strategy_item.allocation}</p>`;
        }
        
        strategy_card_element.innerHTML = `
            <div class="item-content">
                <h4>${strategy_item.name}</h4>
                <p>${strategy_item.description}</p>
                ${allocationHtml}
            </div>
            <button class="btn-delete" onclick="deleteUserStrategy(${strategy_item.id})">Delete</button>
        `;
        strategy_list_container.appendChild(strategy_card_element);
    });
}

/**
 * Fetches user wishes from the backend and displays them.
 */
async function fetchUserWishes() {
    const wish_api_response = await fetch('/api/wishes');
    const wish_list_data = await wish_api_response.json();
    const wish_list_container = document.getElementById('wishes-list');
    
    wish_list_container.innerHTML = '';

    if (wish_list_data.length === 0) {
        wish_list_container.innerHTML = '<p style="color: var(--text-secondary);">No wishes created yet.</p>';
        return;
    }

    wish_list_data.forEach(wish_item => {
        const wish_card_element = document.createElement('div');
        wish_card_element.className = 'list-item';
        
        let notesHtml = '';
        if (wish_item.notes) {
            notesHtml = `<p>${wish_item.notes}</p>`;
        }
        
        wish_card_element.innerHTML = `
            <div class="item-content">
                <div class="stock-header" style="margin-bottom: 0.5rem;">
                    <span class="ticker">${wish_item.ticker}</span>
                    <span style="font-weight: 600; color: var(--accent-primary);">
                        Target: $${wish_item.target_price.toFixed(2)}
                    </span>
                </div>
                ${notesHtml}
            </div>
            <button class="btn-delete" onclick="deleteUserWish(${wish_item.id})">Delete</button>
        `;
        wish_list_container.appendChild(wish_card_element);
    });
}

/**
 * Deletes a specific user strategy.
 */
async function deleteUserStrategy(strategy_id_to_delete) {
    if (confirm('Are you sure you want to delete this strategy?')) {
        await fetch(`/api/strategies/${strategy_id_to_delete}`, { method: 'DELETE' });
        fetchUserStrategies();
    }
}

/**
 * Deletes a specific user wish.
 */
async function deleteUserWish(wish_id_to_delete) {
    if (confirm('Are you sure you want to delete this wish?')) {
        await fetch(`/api/wishes/${wish_id_to_delete}`, { method: 'DELETE' });
        fetchUserWishes();
    }
}
