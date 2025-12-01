//-------------ENEMY POOL----------
const enemies = {
    "Chicken": {
        name: "Chicken",
        hp: 7,
        attack: 2,
        xp: 2
    },
    "Cow": {
        name: "Cow",
        hp: 10,
        attack: 3,
        xp: 5
    },
};
// ---------------- PLAYER DATA ----------------
let player = {
    name: "Keistutis",
    hp: 20,
    maxHp: 20,
    attack: 5,
    defense: 2,
    level: 1,
    xp: 0,
    xpToNext: 30,
    inventory: {
        
    }
};


// --------------- UTILITY FUNCTIONS ---------------
function gameLog(text) {
    const log = document.getElementById("log");
    log.innerText = text;
}

function updateSubmenu(html) {
    document.getElementById("submenu").innerHTML = html;
};


// ----------- PROFILE -------------
function openProfile(){
    
    let text = "<h3>My Info</h3>" + "Name:" + player.name  + "<br>Life:" + player.hp + "/" + player.maxHp + "<br>Level: " + player.level ;
    
    updateSubmenu(text);
};
// ----------------XP Function--------------
function addXP(amount) {
    player.xp += amount;

    while (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;
        levelUp();
    }
}
function levelUp() {
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.5);

    // Stat increases
    player.maxHp += 5;
    player.attack += 1;
    player.defense += 1;

    // Heal to full on level up
    player.hp = player.maxHp;

    gameLog(`🎉 LEVEL UP! You are now level ${player.level}!
         Stats increased! HP restored.`);
}

// ---------------- INVENTORY ----------------
function updateInventoryDisplay() {
    const invDiv = document.getElementById("inventoryDisplay");
    if (!invDiv) return;

    if (Object.keys(player.inventory).length === 0) {
        invDiv.innerHTML = "<p>Inventory is empty.</p>";
        return;
    }

    let html = "";
    for (let item in player.inventory) {
        html += `
            <div>
                <strong>${item}: ${player.inventory[item]}</strong>
                <button onclick="removeItem('${item}', 1, updateInventoryDisplay())">-1</button>
                <button onclick="removeItem('${item}', ${player.inventory[item]}, updateInventoryDisplay())">Remove All</button>
            </div>
        `;
    }

    invDiv.innerHTML = html;
}
// ----------remove item--------
function removeItem(itemName, amount) {
    // If item does not exist  nothing to remove
    if (!player.inventory[itemName]) {
        return false; 
    }

    player.inventory[itemName] -= amount;

    // If item drops to 0 or below  delete completely
    if (player.inventory[itemName] <= 0) {
        delete player.inventory[itemName];
    }

    saveGame(); // update save file
    return true;
}


// ---------------- CRAFTING ----------------
const recipes = {
    "Healing Potion": {
        requires: { "Herb": 2 },
        craft: function() {
            addItem("Healing Potion", 1);
            gameLog("You crafted a Healing Potion!");
        }
    },
    "Apple Pie": {
        requires: { "Apple": 2, "Flour": 1, "Egg": 1, "Milk": 1},
        craft: function(){
            addItem("Apple Pie", 1);
            gameLog("You baked an apple pie!");
        }
    }
};


function openCrafting() {
    let html = "<h3>Crafting</h3>";
    for (let recipe in recipes) {
        html += `<button onclick="craft('${recipe}'), updateInventoryDisplay()">${recipe}</button><br>`;
    }
    updateSubmenu(html);
}

function craft(name) {
    const r = recipes[name];

    // check ingredients
    for (let item in r.requires) {
        if (!player.inventory[item] || player.inventory[item] < r.requires[item]) {
            gameLog("You don't have the required materials!");
            return;
        }
    }

    // remove materials
    for (let item in r.requires) {
        player.inventory[item] -= r.requires[item];
    }

    r.craft();
}

function addItem(name, amount = 1) {
    player.inventory[name] = (player.inventory[name] || 0) + amount;
};

// ---------------- EXPLORATION ----------------
function farm() {
    const roll = Math.floor(Math.random() * 101);

    if (roll <= 10) {
        gameLog("You find an herb!");
        addItem("Herb");
    } else if (roll <= 20 &&  roll > 10) {
        gameLog("You find some flour!");
        addItem("Flour");
    }
    else if (roll <= 100 && roll > 20) {
        gameLog("You find an apple!");
        addItem("Apple");
}
}
// ---------------COMBAT MENU-----------
  function chooseEnemyMenu() {
    let html = "<h3>Choose an enemy to fight</h3>";
    html += `<select id='enemySelect'>`;

    for (let e in enemies) {
        html += `<option value='${e}'>${e}</option>`;
    }

    html += `</select><br><br>`;
    html += `<button onclick='startSelectedEnemy()'>Fight!</button>`;

    updateSubmenu(html);
}
function startSelectedEnemy() {
    let chosen = document.getElementById("enemySelect").value;

    // Deep copy the enemy so it's not modifying the original
    let enemy = JSON.parse(JSON.stringify(enemies[chosen]));

    gameLog(`A ${enemy.name} attacks!`);
    startCombat(enemy);
};

// ---------------- COMBAT SYSTEM ----------------
function startCombat(enemy) {
    updateSubmenu(`
        <h3>Combat vs ${enemy.name}</h3>
        <button onclick="attackEnemy()">Attack</button>
        <button onclick="usePotion()">Use Potion</button>
        <button onclick="eatPie()">Eat Pie</button>
    `);

    window.currentEnemy = enemy;
}

function attackEnemy() {
    const e = window.currentEnemy;

    // player hits enemy
    e.hp -= player.attack;
    if (e.hp <= 0 && e.name == "Chicken") {
        gameLog(`You defeated the ${e.name} and received 1 Egg and 2XP`);
        updateSubmenu("");
        chooseEnemyMenu();
        addItem("Egg"); // reward example
        addXP(2)
        return;
    } else if (e.hp <= 0 && e.name == "Cow") {
        gameLog(`You defeated the ${e.name} and received 1 Milk and 5XP`);
        updateSubmenu("");
        chooseEnemyMenu();
        addItem("Milk"); // reward example
        addXP(5)
        return;
    }

    // enemy hits back
    player.hp -= e.attack;
    if (player.hp <= 0) {
        gameLog("You died! Game over.");
        updateSubmenu("");
        return;
    }

    gameLog(`You hit the ${e.name}. Enemy HP: ${e.hp}. Your HP: ${player.hp}/${player.maxHp}`);
}

function usePotion() {
    if (!player.inventory["Healing Potion"]) {
        log("You have no Healing Potions!");
        return;
    }

    player.inventory["Healing Potion"]--;
    player.hp = Math.min(player.maxHp, player.hp + 10);
    gameLog(`You healed! HP is now ${player.hp}/${player.maxHp}`);
}

function eatPie(){
        if (!player.inventory["Apple Pie"]) {
        gameLog("You have no apple pies!");
        return;
    }

    player.inventory["Apple Pie"]--;
    player.hp = Math.min(player.maxHp, player.hp + 7);
    gameLog(`You healed! HP is now ${player.hp}/${player.maxHp}`);

}
//-----------SAVE FUNCTIONS---------------
// --- SAVE GAME ---
function saveGame() {
    localStorage.setItem("textRPGsave", JSON.stringify(player));
}
// --- LOAD GAME ---
let hasSave = false;

function loadGame() {
    const data = localStorage.getItem("textRPGsave");

    if (!data) {
        hasSave = false;
        return;
    }

    hasSave = true;
    const save = JSON.parse(data);

    // Restore every property
    player.name     = save.name;
    player.hp       = save.hp;
    player.maxHp    = save.maxHp;
    player.attack   = save.attack;
    player.defense  = save.defense;
    player.level    = save.level;
    player.xp       = save.xp;
    player.xpToNext = save.xpToNext;

    // Restore nested object
    player.inventory = save.inventory || {};
};
function hasExistingSave() {
    return localStorage.getItem("textRPGsave") !== null;
}
//-----------NEW GAME-------------
function newGame() {
    // Reset player to starting stats
    player = {
        name: "Keistutis",
        hp: 20,
        maxHp: 20,
        attack: 5,
        defense: 2,
        level: 1,
        xp: 0,
        xpToNext: 20,
        inventory: {}
    };

    saveGame();                 // Write the new save
    window.location.href = "index.html"; // Go to the starting page
};
