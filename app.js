document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic
    const navigation_links = document.querySelectorAll('nav a');
    const application_sections = document.querySelectorAll('section');

    navigation_links.forEach(nav_link => {
        nav_link.addEventListener('click', (click_event) => {
            click_event.preventDefault();
            const target_section_id = nav_link.getAttribute('href').substring(1);
            
            navigation_links.forEach(other_link => other_link.classList.remove('active'));
            nav_link.classList.add('active');
            
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

    // 3. Dynamic Strategy Form Logic
    const allocContainer = document.getElementById('allocation-container');
    const btnAddAlloc = document.getElementById('btn-add-allocation');

    function addAllocationRow() {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.marginBottom = '0.5rem';
        row.className = 'alloc-row';
        
        row.innerHTML = `
            <input type="text" class="alloc-ticker" placeholder="Ticker (e.g. ACM)" required style="flex: 2;">
            <input type="number" class="alloc-weight" placeholder="%" required min="1" max="100" style="flex: 1;">
            <button type="button" class="btn-remove-row" style="background: var(--danger); color: white; border: none; padding: 0 0.5rem; cursor: pointer;">X</button>
        `;
        
        row.querySelector('.btn-remove-row').addEventListener('click', () => {
            row.remove();
        });
        
        allocContainer.appendChild(row);
    }
    
    // Start with one row
    addAllocationRow();
    btnAddAlloc.addEventListener('click', addAllocationRow);

    // 4. Strategy Form Submission
    document.getElementById('strategy-form').addEventListener('submit', async (form_submit_event) => {
        form_submit_event.preventDefault();
        const errorDiv = document.getElementById('strat-error');
        errorDiv.style.display = 'none';
        
        // Gather allocations
        const allocs = {};
        let total = 0;
        const rows = document.querySelectorAll('.alloc-row');
        
        rows.forEach(row => {
            const ticker = row.querySelector('.alloc-ticker').value.toUpperCase();
            const weight = parseFloat(row.querySelector('.alloc-weight').value);
            if (ticker && weight) {
                allocs[ticker] = weight;
                total += weight;
            }
        });
        
        if (total !== 100) {
            errorDiv.textContent = `Total allocation must be exactly 100% (currently ${total}%).`;
            errorDiv.style.display = 'block';
            return;
        }

        const strategy_form_data = {
            name: document.getElementById('strat-name').value,
            description: document.getElementById('strat-desc').value,
            allocations: allocs
        };

        const strategy_api_response = await fetch('/api/strategies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(strategy_form_data)
        });

        if (strategy_api_response.ok) {
            form_submit_event.target.reset();
            allocContainer.innerHTML = '';
            addAllocationRow(); // reset rows
            fetchUserStrategies();
        } else {
            const errData = await strategy_api_response.json();
            errorDiv.textContent = errData.error || "Failed to save strategy.";
            errorDiv.style.display = 'block';
        }
    });

    // 5. Wish Form Submission
    document.getElementById('wish-form').addEventListener('submit', async (form_submit_event) => {
        form_submit_event.preventDefault();
        const wish_form_data = {
            ticker: document.getElementById('wish-ticker').value.toUpperCase(),
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

    // 6. Simulate Market Button
    document.getElementById('btn-simulate').addEventListener('click', async () => {
        const btn = document.getElementById('btn-simulate');
        btn.disabled = true;
        btn.textContent = "Simulating...";
        
        await fetch('/api/simulate', { method: 'POST' });
        
        // Refresh all data
        await fetchMarketStocks();
        await fetchUserStrategies();
        
        btn.textContent = "Simulate Next Day \u25BA";
        btn.disabled = false;
    });
});

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
            <div class="stock-name" style="color: var(--text-secondary); margin-bottom: 0.5rem;">
                ${stock_item.name}
            </div>
            <div class="price">$${stock_item.price.toFixed(2)}</div>
        `;
        market_grid_container.appendChild(stock_card_element);
    });
}

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
        
        // Format allocations JSON into a readable string
        let allocationStr = '';
        if (strategy_item.allocations && Object.keys(strategy_item.allocations).length > 0) {
            const parts = [];
            for (const [ticker, weight] of Object.entries(strategy_item.allocations)) {
                parts.push(`${weight}% ${ticker}`);
            }
            allocationStr = parts.join(', ');
        }
        
        const profitClass = strategy_item.profit >= 0 ? 'positive' : 'negative';
        const sign = strategy_item.profit >= 0 ? '+' : '';
        
        strategy_card_element.innerHTML = `
            <div class="item-content" style="width: 100%;">
                <div style="display: flex; justify-content: space-between;">
                    <h4>${strategy_item.name}</h4>
                    <div style="text-align: right;">
                        <div style="font-size: 1.1rem; font-weight: bold;">$${strategy_item.current_value.toFixed(2)}</div>
                        <div class="change ${profitClass}" style="font-size: 0.9rem;">
                            ${sign}$${strategy_item.profit.toFixed(2)} (${sign}${strategy_item.profit_percent.toFixed(2)}%)
                        </div>
                    </div>
                </div>
                <p>${strategy_item.description}</p>
                ${allocationStr ? `<p style="margin-top: 0.5rem; font-size: 0.85rem; background: #eee; padding: 0.2rem 0.5rem; display: inline-block; border-radius: 4px;">Allocations: ${allocationStr}</p>` : ''}
                <div style="margin-top: 1rem;">
                    <button class="btn-delete" onclick="deleteUserStrategy(${strategy_item.id})">Delete Strategy</button>
                </div>
            </div>
        `;
        strategy_list_container.appendChild(strategy_card_element);
    });
}

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
        
        wish_card_element.innerHTML = `
            <div class="item-content">
                <div class="stock-header" style="margin-bottom: 0.5rem;">
                    <span class="ticker">${wish_item.ticker}</span>
                    <span style="font-weight: 600; color: var(--accent-primary);">
                        Target: $${wish_item.target_price.toFixed(2)}
                    </span>
                </div>
                ${wish_item.notes ? `<p>${wish_item.notes}</p>` : ''}
            </div>
            <button class="btn-delete" onclick="deleteUserWish(${wish_item.id})">Delete</button>
        `;
        wish_list_container.appendChild(wish_card_element);
    });
}

async function deleteUserStrategy(strategy_id_to_delete) {
    if (confirm('Are you sure you want to delete this strategy?')) {
        await fetch(`/api/strategies/${strategy_id_to_delete}`, { method: 'DELETE' });
        fetchUserStrategies();
    }
}

async function deleteUserWish(wish_id_to_delete) {
    if (confirm('Are you sure you want to delete this wish?')) {
        await fetch(`/api/wishes/${wish_id_to_delete}`, { method: 'DELETE' });
        fetchUserWishes();
    }
}
