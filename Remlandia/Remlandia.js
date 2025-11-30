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
    xpToNext: 20,
    inventory: {
        
    }
};
//-----------SAVE FUNCTIONS---------------
// --- SAVE GAME ---
function saveGame() {
    localStorage.setItem("myGameSave", JSON.stringify(player));
}
// --- LOAD GAME ---
function loadGame() {
    const save = localStorage.getItem("myGameSave");
    if (!save) {
        return;
    }
        const data = JSON.parse(save);
    player.name = data.name;
    player.hp = data.hp;
    player.xp = data.xp;
    player.level = data.level; // restore
}

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
function openInventory() {
    let text = "<h3>Inventory</h3>";
    for (let item in player.inventory) {
        text += `${item}: ${player.inventory[item]}<br>`;
    }
    updateSubmenu(text);
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
        html += `<button onclick="craft('${recipe}')">${recipe}</button><br>`;
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
    openInventory();
}

function addItem(name, amount = 1) {
    player.inventory[name] = (player.inventory[name] || 0) + amount;
};

// ---------------- EXPLORATION ----------------
function farm() {
    const roll = Math.floor(Math.random() * 5);

    if (roll == 0) {
        gameLog("You find an herb!");
        addItem("Herb");
    } else if (roll == 1) {
        gameLog("You find some flour!");
        addItem("Flour");
    }
    else if (roll == 2) {
        gameLog("You find an apple!");
        addItem("Apple");
}
}
// ---------------COMBAT MENU-----------
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
        addItem("Egg"); // reward example
        addXP(2)
        return;
    } else if (e.hp <= 0 && e.name == "Cow") {
        gameLog(`You defeated the ${e.name} and received 1 Milk and 5XP`);
        updateSubmenu("");
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

// ---------------- SAVE / LOAD ----------------
function saveGame() {
    localStorage.setItem("textRPGsave", JSON.stringify(player));
}

function loadGame() {
    let data = localStorage.getItem("textRPGsave");
    if (data) {
        player = JSON.parse(data);
    } else {
    }
};