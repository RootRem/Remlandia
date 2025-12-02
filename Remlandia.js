// ---------------- PLAYER ----------------
let player = {
    name: "",
    hp: 20,
    maxHp: 20,
    stamina: 100,
    maxStamina: 100,
    attack: 5,
    defense: 2,
    level: 1,
    xp: 0,
    xpToNext: 30,
    gold: 0,
    inventory: {}
};
const staminaCostFight = 10;

// Regenerate stamina periodically (already saves)
function regenerateStamina() {
    if (player.stamina < player.maxStamina) {
        player.stamina++;
        openProfile();  // update sidebar
        saveGame();
    }
}

//-----------PRICE LIST----------
const sellPrices = {
    "Sage": 3,
    "Apple": 1,
    "Wheat": 1,
    "Egg": 2,
    "Milk": 2,
    "Healing Potion": 5,
    "Apple Pie": 5,
};
const shopInventory = {
    "Stamina Potion": 3,
    "Healing Potion": 30
};

const buyPrices = {
    "Stamina Potion": 25,
    "Healing Potion": 10
};

// ---------------- ENEMIES ----------------
let enemies = {
    "Chicken": {
        name: "Chicken",
        hp: 7,
        attack: 1,
        xp: 2,
        drops: { "Egg": 1 },
        area: "farm"
    },
    "Cow": {
        name: "Cow",
        hp: 10,
        attack: 2,
        xp: 5,
        drops: { "Milk": 1 },
        area: "farm"
    },
    "Bandit": {
        name: "Bandit",
        hp: 30,
        attack: 5,
        xp: 10,
        drops: { "Gold": 5 },
        area: "banditCamp"
    }
};
// ---------------- RECIPES ----------------
const recipes = {
    "Healing Potion": {
        requires: { "Sage": 2 },
        craft: function() {
            addItem("Healing Potion", 1);
            gameLog("You crafted a Healing Potion!");
        }
    },
    "Apple Pie": {
        requires: { "Apple": 2, "Wheat": 1, "Egg": 1, "Milk": 1},
        craft: function(){
            addItem("Apple Pie", 1);
            gameLog("You baked an Apple Pie!");
        }
    }
};

// ---------------- INIT AREA ----------------
function initArea() {
    const currentArea = document.body.dataset.area; // e.g., "farm" or "banditCamp"
    chooseEnemyMenu(currentArea);
}
// ---------------- RESOURCE GATHERING ----------------
function farm() {
    // Example resource gathering
    const resources = [
        { name: "Wheat", chance: 0.37 },
        { name: "Apple", chance: 0.37 },
        { name: "Sage", chance: 0.25 }
    ];   
     const resource = getRandomResource(resources);
    if (!resource) {
        gameLog("You found nothing this time.");
        return;
    }

    const amount = 1; // you can randomize amount if you like
    addItem(resource, amount);
    gameLog(`You gathered ${amount} ${resource}!`);
    openProfile();
    saveGame();
}
function getRandomResource(resources) {
    const roll = Math.random(); // 0–1
    let cumulative = 0;

    // Make sure total chance doesn't exceed 1, and iterate
    for (let i = 0; i < resources.length; i++) {
        cumulative += resources[i].chance;
        if (roll < cumulative) {
            return resources[i].name;
        }
    }

    // fallback if nothing rolled
    return null;
}

// ---------------- COMBAT MENU ----------------
function chooseEnemyMenu(area) {
    const areaEnemies = Object.values(enemies).filter(e => e.area === area);

    let buttonsHTML = `<h3>Choose an action</h3><div class="enemyButtons">`;

    // Add a placeholder div for the gather button
    if (area === "farm") {
        buttonsHTML += `<button id="gatherBtn">Gather resources</button>`;
    }

    // Add fight buttons dynamically
    areaEnemies.forEach(e => {
        buttonsHTML += `<button onclick="startFight('${e.name}')">Fight ${e.name}</button>`;
    });

    buttonsHTML += `</div>`;
    updateSubmenu(buttonsHTML);

    // Attach event listener dynamically
    const gatherBtn = document.getElementById("gatherBtn");
    if (gatherBtn) gatherBtn.addEventListener("click", farm);
}
// ---------------- START FIGHT ----------------
function startFight(enemyName) {
    if (player.stamina < staminaCostFight) {
        gameLog("You are too tired to fight! (Not enough stamina)");
        return;
    }

    // Reduce stamina
    player.stamina -= staminaCostFight;
    openProfile();
    saveGame();

    // Create a fresh copy of the enemy
    let enemy = JSON.parse(JSON.stringify(enemies[enemyName]));

    gameLog(`A ${enemy.name} attacks!`);
    startCombat(enemy);
}

// ---------------- COMBAT SYSTEM ----------------
function startCombat(enemy) {
    updateSubmenu(`
        <h3>Combat vs ${enemy.name}</h3>
        <button onclick="attackEnemy()">Attack</button>
        <button onclick="usePotion(); updateInventoryDisplay();">Use Potion</button>
        <button onclick="eatPie(); updateInventoryDisplay();">Eat Pie</button>
    `);
    window.currentEnemy = enemy;
}

function attackEnemy() {
    const e = window.currentEnemy;
    if (!e) return;

    // Player hits enemy
    e.hp -= player.attack;

    if (e.hp <= 0) {
        // XP reward
        addXP(e.xp || 0);

        // Drops
        if (e.drops) {
            for (let item in e.drops) {
                const amount = e.drops[item];

                if (item.toLowerCase() === "gold") {
                    player.gold = (player.gold || 0) + amount;
                    gameLog(`You defeated the ${e.name} and received ${amount} gold!`);
                } else {
                    addItem(item, amount);
                    gameLog(`You defeated the ${e.name} and received ${amount} ${item}!`);
                }
            }
        }

        // Reset menu
        updateSubmenu("");
        openProfile();
        saveGame();
        chooseEnemyMenu(document.body.dataset.area);
        return;
    }

    // Enemy hits back
    player.hp -= e.attack;
    if (player.hp <= 0) {
        gameLog("You died! Game over.");
        updateSubmenu("");
        saveGame();
        return;
    }

    gameLog(`You hit the ${e.name}. Enemy HP: ${e.hp}. Your HP: ${player.hp}/${player.maxHp}`);
    openProfile();
    saveGame();
}

// ---------------- INVENTORY ----------------
function addItem(item, amount) {
    if (!player.inventory[item]) player.inventory[item] = 0;
    player.inventory[item] += amount;
}

function removeItem(item, amount) {
    if (!player.inventory[item] || player.inventory[item] <= 0) return;
    player.inventory[item] -= amount;
    if (player.inventory[item] <= 0) delete player.inventory[item];
}

function updateInventoryDisplay() {
    const invDiv = document.getElementById("inventoryDisplay");
    if (!invDiv) return;

    const keys = Object.keys(player.inventory);
    if (keys.length === 0) {
        invDiv.innerHTML = "<p>Inventory is empty.</p>";
        return;
    }

    let html = "";
    for (let item of keys) {
        const amount = player.inventory[item];
        html += `<div><strong>${item}: ${amount}</strong>`;

        if (item === "Healing Potion") html += ` <button onclick="usePotionHealing()">Use</button>`;
        if (item === "Stamina Potion") html += ` <button onclick="usePotionStamina()">Use</button>`;
        if (item === "Apple Pie") html += ` <button onclick="eatPie()">Eat</button>`;

        html += `</div>`;
    }
    invDiv.innerHTML = html;
}

// ---------------- SHOP ----------------
function sellItem(itemName) {
    if (!player.inventory[itemName] || player.inventory[itemName] <= 0) {
        gameLog("You have none of that item to sell!");
        return;
    }

    const price = sellPrices[itemName] || 0;

    removeItem(itemName, 1);
    player.gold += price;

    gameLog(`You sold 1 ${itemName} for ${price} gold.`);

    openProfile();
    updateShop();        // ← refresh BOTH panels
    updateInventoryDisplay();
    saveGame();
}

function buyItem(itemName) {
    const cost = buyPrices[itemName] || 0;

    if (player.gold < cost) {
        gameLog("Not enough gold!");
        return;
    }

    player.gold -= cost;
    addItem(itemName, 1);

    gameLog(`You bought 1 ${itemName} for ${cost} gold.`);

    openProfile();
    updateShop();        // ← refresh BOTH panels
    updateInventoryDisplay();
    saveGame();
}
function displayShopSell() {
    const shopSellDiv = document.getElementById("sellShop");
    if (!shopSellDiv) return;

    const keys = Object.keys(player.inventory);

    let html = "<h3>Sell Items</h3>";

    if (keys.length === 0) {
        html += "<p>You have nothing to sell.</p>";
    } else {
        for (let item of keys) {
            const amount = player.inventory[item];
            const price = sellPrices[item] || 0;

            html += `<div><strong>${item} (${amount})</strong> — <b>${price}g</b>
                     <button onclick="sellItem('${item}')">Sell 1</button>
                     </div>`;
        }
    }

    shopSellDiv.innerHTML = html;
}
function displayShopBuy() {
    const shopBuyDiv = document.getElementById("buyShop");
    if (!shopBuyDiv) return;

    let html = "<h3>Buy Items</h3>";

    for (let item in shopInventory) {
        const cost = buyPrices[item] || 0;

        html += `<div><strong>${item}</strong> — <b>${cost}g</b>
                 <button onclick="buyItem('${item}')">Buy 1</button>
                 </div>`;
    }

    shopBuyDiv.innerHTML = html;
}
// ---------------- CRAFTING ----------------
function openCrafting() {
    const craftDiv = document.getElementById("craftingDisplay");
    if (!craftDiv) return;

    let html = "<h3>Crafting</h3>";
    for (let recipe in recipes) {
        html += `<button onclick="craft('${recipe}'); updateInventoryDisplay();">${recipe}</button></div>`;
    }
    craftDiv.innerHTML = html;
}

function craft(name) {
    const r = recipes[name];
    if (!r) return;

    for (let item in r.requires) {
        if (!player.inventory[item] || player.inventory[item] < r.requires[item]) {
            gameLog("You don't have the required materials!");
            return;
        }
    }

    for (let item in r.requires) {
        removeItem(item, r.requires[item]);
    }

    r.craft();
    openProfile();
    updateInventoryDisplay();
    saveGame();
}
// ----------------XP ----------------
function addXP(xp) {
    player.xp += xp;
    gameLog(`You gained ${xp} XP!`);
    // Level up example
    if (player.xp >= player.xpToNext) {
        const oldXpToNext = player.xpToNext;  // store requirement BEFORE update
        player.level++;
    // carry-over XP calculation always uses the OLD requirement
        player.xp = player.xp - oldXpToNext;
        player.xpToNext = Math.floor(player.xpToNext * 2);

    // Stat increases
        player.maxHp += 5;
        player.attack += 1;
        player.defense += 1;
        player.maxStamina += 10;

    // Heal to full on level up
        //player.hp = player.maxHp;
        gameLog(`You leveled up to level ${player.level}!`);
    }
}

//-----------STAMINA RECHARGE---------
setInterval(regenerateStamina, 10000);
// ---------------- HELPER FUNCTIONS ----------------
function gameLog(message) {
    const log = document.getElementById("gameLog");
    if (log) {
        log.innerHTML += `<p>${message}</p>`;
        log.scrollTop = log.scrollHeight; // <-- automatically scroll to bottom
    }
    console.log(message);
}

function updateSubmenu(html) {
    const submenu = document.getElementById("submenu");
    if (submenu) submenu.innerHTML = html;
}
function updateShop() {
    displayShopBuy();
    displayShopSell();
}
function openProfile() {
    const profile = document.getElementById("profile");
    if (!profile) return;
    profile.innerHTML = `
        <p><b>Name:</b> ${player.name}</p>
        <p><b>HP:</b> ${player.hp}/${player.maxHp}</p>
        <p><b>Stamina:</b> ${player.stamina}/${player.maxStamina}</p>
        <p><b>Level:</b> ${player.level}</p>
        <p><b>XP:</b> ${player.xp}/${player.xpToNext}</p>
        <p><b>Gold:</b> ${player.gold}</p>
    `;
}

function saveGame() {
    localStorage.setItem("playerData", JSON.stringify(player));
}

function loadGame() {
    const data = localStorage.getItem("playerData");
    if (data) {
        const saved = JSON.parse(data);
        // Merge saved data with default player
        player = { ...player, ...saved };
        if (!player.inventory) player.inventory = {};
    }
}
function hasExistingSave() {
    return localStorage.getItem("playerData") !== null;
}
function startNewGame() {
    const nameField = document.getElementById("playerNameInput");
    const playerName = nameField.value.trim();

    if (!playerName) {
        alert("Please enter a name!");
        return;
    }

    // 1. Reset player stats (from your newGame() function)
    player = {
        name: playerName,          // name goes here now
        hp: 20,
        maxHp: 20,
        stamina: 100,
        maxStamina: 100,
        attack: 5,
        defense: 2,
        level: 1,
        xp: 0,
        xpToNext: 30,
        gold: 0,
        inventory: {}
    };

    // 2. Save the entire player object
    saveGame();

    // 3. Also store name separately if needed
    localStorage.setItem("playerName", playerName);

    // 4. Move to your game page
    window.location.href = "startpage.html";
}
// ---------------- POTIONS & FOOD ----------------
function usePotionHealing() {
    if (player.inventory["Healing Potion"] > 0) {
        player.inventory["Healing Potion"]--;
        player.hp = Math.min(player.maxHp, player.hp + 10);
        gameLog("You used a Healing Potion and restored 10 HP.");
    } else gameLog("You don't have any Healing Potions.");
    updateInventoryDisplay(); // refresh inventory once
    openProfile();            // refresh stats/UI
}
function usePotionStamina() {
    if (player.inventory["Stamina Potion"] > 0) {
        player.inventory["Stamina Potion"]--;
        player.stamina = Math.min(player.maxStamina, player.stamina + 20);
        gameLog("You used a Stamina Potion and restored 20 Stamina.");
    } else gameLog("You don't have any Stamina Potions.");
    updateInventoryDisplay(); // refresh inventory once
    openProfile();            // refresh stats/UI
}
function eatPie() {
    if (player.inventory["Apple Pie"] > 0) {
        player.inventory["Apple Pie"]--;
        player.hp = Math.min(player.maxHp, player.hp + 5);
        gameLog("You ate an Apple Pie and restored 5 HP.");
    } else gameLog("You don't have any Apple Pies.");
    updateInventoryDisplay(); // refresh inventory once
    openProfile();            // refresh stats/UI
}

// ---------------- INIT ----------------
window.addEventListener("load", () => {
    loadGame();
    openProfile();
    initArea();
});

