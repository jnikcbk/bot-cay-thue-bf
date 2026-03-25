const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// ===== CONFIG =====
const PREFIX = '!';
const DATA_FILE = './data.json';

// ===== LOAD DATA =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { users: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
let db = loadData();

// ===== USER =====
function defaultUser() {
  return {
    hp: 100,
    maxHp: 100,
    level: 1,
    exp: 0,
    money: 0,
    inventory: {},
    weapon: null,
    lastDaily: 0,
    cooldowns: {}
  };
}

function getUser(id) {
  if (!db.users[id]) db.users[id] = defaultUser();
  return db.users[id];
}

// ===== ITEM =====
const ITEMS = {
  wood: { name: 'Gỗ', sell: 2 },
  stone: { name: 'Đá', sell: 2 },
  iron: { name: 'Sắt', sell: 8 },
  diamond: { name: 'Kim cương', sell: 30 },
  potion: { name: 'Bình máu', sell: 50 },

  sword: { name: 'Kiếm sắt', attack: 8 }
};

// ===== UTILS =====
function addItem(user, item, amount = 1) {
  user.inventory[item] = (user.inventory[item] || 0) + amount;
}

function removeItem(user, item, amount = 1) {
  if (!user.inventory[item]) return false;
  user.inventory[item] -= amount;
  if (user.inventory[item] <= 0) delete user.inventory[item];
  return true;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function embed(title, desc, color = 0x00b8ff) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp();
}

// ===== BOT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Online: ${client.user.tag}`);
});

// ===== COMMAND =====
client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(msg.author.id);

  // HELP
  if (cmd === 'help') {
    return msg.reply({
      embeds: [embed('Menu',
        '`!start`\n!info\n!inv\n!daily\n!wood\n!mine\n!fight\n!heal\n!top')]
    });
  }

  // START
  if (cmd === 'start') {
    db.users[msg.author.id] = defaultUser();
    saveData();
    return msg.reply('Đã tạo tài khoản');
  }

  // INFO
  if (cmd === 'info') {
    return msg.reply({
      embeds: [embed(
        `Info ${msg.author.username}`,
        `HP: ${user.hp}/${user.maxHp}\nLevel: ${user.level}\nMoney: ${user.money}$`
      )]
    });
  }

  // INVENTORY
  if (cmd === 'inv') {
    let text = Object.entries(user.inventory)
      .map(([k, v]) => `${ITEMS[k]?.name || k} x${v}`)
      .join('\n') || 'Trống';

    return msg.reply({ embeds: [embed('Kho đồ', text)] });
  }

  // DAILY
  if (cmd === 'daily') {
    const now = Date.now();
    if (now - user.lastDaily < 43200000)
      return msg.reply('Đã nhận rồi');

    user.lastDaily = now;
    user.money += 500;
    addItem(user, 'potion', 1);
    saveData();

    return msg.reply('Nhận 500$ + 1 potion');
  }

  // WOOD
  if (cmd === 'wood') {
    const amount = rand(2, 6);
    addItem(user, 'wood', amount);
    user.money += rand(1, 5);
    saveData();

    return msg.reply(`Bạn chặt được ${amount} gỗ`);
  }

  // MINE
  if (cmd === 'mine') {
    const ores = ['stone', 'iron', 'diamond'];
    const item = ores[rand(0, ores.length - 1)];
    const amount = rand(1, 3);

    addItem(user, item, amount);
    saveData();

    return msg.reply(`Bạn đào được ${ITEMS[item].name} x${amount}`);
  }

  // FIGHT
  if (cmd === 'fight') {
    let dmg = rand(5, 15);
    user.hp -= rand(5, 10);

    if (user.hp <= 0) {
      user.hp = 100;
      saveData();
      return msg.reply('Bạn chết ☠️');
    }

    user.money += 20;
    saveData();

    return msg.reply(`Bạn đánh quái gây ${dmg} dmg`);
  }

  // HEAL
  if (cmd === 'heal') {
    if (!user.inventory.potion)
      return msg.reply('Không có potion');

    removeItem(user, 'potion', 1);
    user.hp = Math.min(user.maxHp, user.hp + 30);
    saveData();

    return msg.reply(`Hồi máu: ${user.hp}`);
  }

  // TOP
  if (cmd === 'top') {
    const list = Object.entries(db.users)
      .sort((a, b) => b[1].money - a[1].money)
      .slice(0, 5)
      .map((u, i) => `#${i + 1} <@${u[0]}> - ${u[1].money}$`)
      .join('\n');

    return msg.reply({ embeds: [embed('Top tiền', list)] });
  }

});

// ===== LOGIN =====
client.login(process.env.TOKEN);
