<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Bot - Code Mới & Đẹp Hơn</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; line-height: 1.6; }
        pre { background: #1e2937; padding: 20px; border-radius: 12px; overflow-x: auto; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #22d3ee; font-size: 2.5rem; margin: 0; }
        .badge { background: #22d3ee; color: #0f172a; padding: 5px 12px; border-radius: 9999px; font-size: 0.9rem; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 RPG Bot - Phiên Bản Đẹp & Hoàn Chỉnh Hơn</h1>
        <p style="margin: 10px 0; opacity: 0.9;">Đã rebuild toàn bộ code • Thêm rất nhiều lệnh • Giao diện embed siêu đẹp • Hệ thống Level + EXP • Shop • Equip • Và lệnh <strong>!mhelp</strong></p>
        <span class="badge">discord.js v14 • Tiếng Việt 100% • Dễ dùng</span>
    </div>

<pre><code>const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// ===== CONFIG =====
const PREFIX = '!';
const DATA_FILE = './data.json';
const BOT_COLOR = 0x22d3ee; // Màu neon đẹp

// ===== LOAD / SAVE DATA =====
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { users: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

let db = loadData();

// ===== DEFAULT USER =====
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

// ===== ITEMS =====
const ITEMS = {
  wood:     { name: 'Gỗ',       sell: 2,  buy: 4 },
  stone:    { name: 'Đá',       sell: 2,  buy: 4 },
  iron:     { name: 'Sắt',      sell: 8,  buy: 15 },
  diamond:  { name: 'Kim cương',sell: 30, buy: 60 },
  potion:   { name: 'Bình máu', sell: 50, buy: 80, heal: 40 },
  sword:    { name: 'Kiếm sắt', sell: 120, buy: 200, attack: 10 },
  bow:      { name: 'Cung gỗ',  sell: 250, buy: 350, attack: 15 }
};

// Map tên tiếng Việt ↔ key (cho người dùng gõ dễ dàng)
const NAME_TO_KEY = {};
Object.entries(ITEMS).forEach(([key, item]) => {
  NAME_TO_KEY[key] = key;
  NAME_TO_KEY[item.name.toLowerCase()] = key;
});

// ===== UTILS =====
function addItem(user, item, amount = 1) {
  user.inventory[item] = (user.inventory[item] || 0) + amount;
}

function removeItem(user, item, amount = 1) {
  if (!user.inventory[item] || user.inventory[item] &lt; amount) return false;
  user.inventory[item] -= amount;
  if (user.inventory[item] &lt;= 0) delete user.inventory[item];
  return true;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRequiredExp(level) {
  return level * 75 + 25; // Công thức đẹp, dễ lên level
}

function gainExp(user, amount) {
  if (amount &lt;= 0) return '';
  user.exp += amount;
  let levelUpText = '';

  while (user.exp &gt;= getRequiredExp(user.level)) {
    user.exp -= getRequiredExp(user.level);
    user.level++;
    user.maxHp += 25;
    user.hp = user.maxHp; // Hồi full HP khi lên level
    levelUpText += `🎉 **LEVEL UP!** Đạt level **${user.level}** (+25 HP max)\n`;
  }
  return levelUpText;
}

function createEmbed(title, description, color = BOT_COLOR) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'RPG Bot • Chúc bạn chơi vui!' });
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
  console.log(`✅ Bot đã online: ${client.user.tag} | ${new Date().toLocaleString('vi-VN')}`);
});

// ===== COMMAND HANDLER =====
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const user = getUser(msg.author.id);

  // ==================== MHELP & HELP ====================
  if (cmd === 'mhelp' || cmd === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setTitle('📜 MENU TRỢ GIÚP - RPG BOT')
      .setColor(BOT_COLOR)
      .setDescription('**Prefix:** `!`\nDùng lệnh để bắt đầu hành trình phiêu lưu của bạn!')
      .addFields(
        { name: '🌟 **Cơ bản**', value: '`!start` • Tạo / reset nhân vật\n`!profile` • Thông tin chi tiết\n`!inv` • Kho đồ\n`!top` • Bảng xếp hạng', inline: true },
        { name: '💰 **Kinh tế**', value: '`!daily` • Thưởng hàng ngày\n`!shop` • Cửa hàng\n`!buy &lt;item&gt; [số]` • Mua\n`!sell &lt;item&gt; [số]` • Bán', inline: true },
        { name: '🪓 **Thu thập**', value: '`!wood` • Chặt gỗ\n`!mine` • Đào mỏ', inline: true },
        { name: '⚔️ **Chiến đấu**', value: '`!fight` • Đánh quái\n`!heal` • Hồi máu\n`!equip &lt;vũ khí&gt;` • Trang bị\n`!unequip` • Tháo vũ khí', inline: true }
      )
      .setImage('https://i.imgur.com/2fP8v6c.png') // Bạn có thể thay bằng link ảnh RPG
      .setFooter({ text: `Đang chơi cùng ${msg.author.username} • ${new Date().getFullYear()}` });
    return msg.reply({ embeds: [helpEmbed] });
  }

  // ==================== START ====================
  if (cmd === 'start') {
    db.users[msg.author.id] = defaultUser();
    saveData();
    return msg.reply({ embeds: [createEmbed('✅ Tài khoản đã được tạo/reset!', `Chào mừng **${msg.author.username}** đến với thế giới RPG!\n\nBắt đầu phiêu lưu ngay nào!`)] });
  }

  // ==================== PROFILE ====================
  if (cmd === 'profile' || cmd === 'info') {
    const required = getRequiredExp(user.level);
    const progress = Math.floor((user.exp / required) * 100);
    const weaponText = user.weapon 
      ? `${ITEMS[user.weapon].name} (+${ITEMS[user.weapon].attack} ATK)` 
      : 'Chưa trang bị';

    const embed = createEmbed(`📋 HỒ SƠ CỦA ${msg.author.username}`, '')
      .addFields(
        { name: '❤️ HP', value: `\`${user.hp}/${user.maxHp}\``, inline: true },
        { name: '⭐ Level', value: `\`${user.level}\``, inline: true },
        { name: '💰 Tiền', value: `\`${user.money}$\``, inline: true },
        { name: '⚔️ Vũ khí', value: weaponText, inline: false },
        { name: '📊 EXP', value: `\`${user.exp}/${required}\` **(${progress}%)**`, inline: false }
      );
    return msg.reply({ embeds: [embed] });
  }

  // ==================== INVENTORY ====================
  if (cmd === 'inv') {
    let text = Object.entries(user.inventory)
      .map(([k, v]) => `• ${ITEMS[k]?.name || k} ×${v}`)
      .join('\n') || 'Kho đồ trống... Hãy đi thu thập nào!';
    return msg.reply({ embeds: [createEmbed('🎒 Kho đồ', text)] });
  }

  // ==================== DAILY ====================
  if (cmd === 'daily') {
    const now = Date.now();
    if (now - user.lastDaily &lt; 86400000) { // 24 giờ
      const timeLeft = Math.floor((86400000 - (now - user.lastDaily)) / 3600000);
      return msg.reply(`⏳ Bạn đã nhận daily rồi! Chờ **${timeLeft} giờ** nữa nhé.`);
    }
    user.lastDaily = now;
    user.money += 800;
    addItem(user, 'potion', 2);
    const lvlMsg = gainExp(user, 30);
    saveData();

    let desc = `✅ Nhận **800$** + **2 Bình máu**\n+30 EXP`;
    if (lvlMsg) desc += `\n\n${lvlMsg}`;
    return msg.reply({ embeds: [createEmbed('🌅 Daily Reward', desc)] });
  }

  // ==================== WOOD ====================
  if (cmd === 'wood') {
    const amount = rand(3, 8);
    addItem(user, 'wood', amount);
    const moneyG = rand(2, 7);
    user.money += moneyG;
    const expG = rand(5, 12);
    const lvlMsg = gainExp(user, expG);
    saveData();

    let desc = `🪓 Chặt được **${amount} Gỗ**!\n+${moneyG}$ và +${expG} EXP`;
    if (lvlMsg) desc += `\n\n${lvlMsg}`;
    return msg.reply({ embeds: [createEmbed('🌲 Chặt gỗ', desc)] });
  }

  // ==================== MINE ====================
  if (cmd === 'mine') {
    const ores = ['stone', 'iron', 'diamond'];
    const item = ores[rand(0, ores.length - 1)];
    const amount = rand(1, 4);
    addItem(user, item, amount);
    const moneyG = rand(3, 10);
    user.money += moneyG;
    const expG = rand(8, 18);
    const lvlMsg = gainExp(user, expG);
    saveData();

    let desc = `⛏️ Đào được **${ITEMS[item].name}** ×${amount}!\n+${moneyG}$ và +${expG} EXP`;
    if (lvlMsg) desc += `\n\n${lvlMsg}`;
    return msg.reply({ embeds: [createEmbed('⛰️ Đào mỏ', desc)] });
  }

  // ==================== FIGHT ====================
  if (cmd === 'fight') {
    const weapon = user.weapon ? ITEMS[user.weapon] : null;
    const baseDmg = rand(10, 22);
    const weaponAtk = weapon ? weapon.attack : 5;
    const totalDmg = baseDmg + weaponAtk;

    const counterDmg = rand(6, 14);
    user.hp -= counterDmg;

    if (user.hp &lt;= 0) {
      user.hp = user.maxHp;
      saveData();
      return msg.reply({ embeds: [createEmbed('☠️ Bạn đã chết!', 'Quái vật quá mạnh!\nHP đã được hồi phục đầy đủ.', 0xff4444)] });
    }

    const moneyG = rand(35, 65) + Math.floor(totalDmg / 2);
    const expG = rand(18, 35) + Math.floor(totalDmg / 3);
    user.money += moneyG;
    const lvlMsg = gainExp(user, expG);

    let extra = '';
    if (rand(1, 8) === 1) {
      addItem(user, 'potion', 1);
      extra = '\n🎁 Nhận thêm **1 Bình máu** ngẫu nhiên!';
    }

    saveData();
    let desc = `⚔️ Bạn gây **${totalDmg} sát thương**!\nQuái vật bị đánh bại!\n+${moneyG}$ • +${expG} EXP${extra}`;
    if (lvlMsg) desc += `\n\n${lvlMsg}`;

    return msg.reply({ embeds: [createEmbed('🔥 Chiến đấu', desc)] });
  }

  // ==================== HEAL ====================
  if (cmd === 'heal') {
    if (!user.inventory.potion) {
      return msg.reply({ embeds: [createEmbed('❌ Không có bình máu!', 'Hãy mua ở shop hoặc đi farm!', 0xffaa00)] });
    }
    removeItem(user, 'potion', 1);
    const healAmount = ITEMS.potion.heal;
    user.hp = Math.min(user.maxHp, user.hp + healAmount);
    saveData();
    return msg.reply({ embeds: [createEmbed('💊 Hồi máu', `Đã hồi **+${healAmount} HP**\nHP hiện tại: **${user.hp}/${user.maxHp}**`)] });
  }

  // ==================== SHOP ====================
  if (cmd === 'shop') {
    let list = Object.entries(ITEMS)
      .filter(([, v]) => v.buy !== undefined)
      .map(([key, v]) => `**${v.name}**\n• Mua: \`${v.buy}$\` • Bán: \`${v.sell}$\`${v.attack ? ` • ATK +${v.attack}` : ''}`)
      .join('\n\n');
    return msg.reply({ embeds: [createEmbed('🛒 CỬA HÀNG', list)] });
  }

  // ==================== BUY ====================
  if (cmd === 'buy') {
    if (!args[0]) return msg.reply('❗ Cách dùng: `!buy <item> [số lượng]`');
    const itemInput = args[0].toLowerCase();
    const itemKey = NAME_TO_KEY[itemInput];
    if (!itemKey || !ITEMS[itemKey].buy) return msg.reply('❌ Item không có trong cửa hàng!');

    const amount = parseInt(args[1]) || 1;
    if (amount &lt; 1) amount = 1;

    const cost = ITEMS[itemKey].buy * amount;
    if (user.money &lt; cost) return msg.reply(`❌ Không đủ tiền! Cần **${cost}$**`);

    user.money -= cost;
    addItem(user, itemKey, amount);
    saveData();

    return msg.reply({ embeds: [createEmbed('✅ Mua thành công!', `Đã mua **${ITEMS[itemKey].name}** ×${amount}\nTrả **${cost}$**`)] });
  }

  // ==================== SELL ====================
  if (cmd === 'sell') {
    if (!args[0]) return msg.reply('❗ Cách dùng: `!sell <item> [số lượng]`');
    const itemInput = args[0].toLowerCase();
    const itemKey = NAME_TO_KEY[itemInput];
    if (!itemKey) return msg.reply('❌ Item không tồn tại!');

    const amount = parseInt(args[1]) || 1;
    if (amount &lt; 1) amount = 1;

    if (!user.inventory[itemKey] || user.inventory[itemKey] &lt; amount) {
      return msg.reply('❌ Bạn không có đủ item để bán!');
    }

    const earn = ITEMS[itemKey].sell * amount;
    user.money += earn;
    removeItem(user, itemKey, amount);
    saveData();

    return msg.reply({ embeds: [createEmbed('✅ Bán thành công!', `Đã bán **${ITEMS[itemKey].name}** ×${amount}\nNhận **${earn}$**`)] });
  }

  // ==================== EQUIP ====================
  if (cmd === 'equip') {
    if (!args[0]) return msg.reply('❗ Cách dùng: `!equip <vũ khí>`');
    const itemInput = args[0].toLowerCase();
    const itemKey = NAME_TO_KEY[itemInput];
    if (!itemKey || !ITEMS[itemKey].attack) return msg.reply('❌ Chỉ có thể trang bị vũ khí!');

    if (!user.inventory[itemKey]) return msg.reply('❌ Bạn không có vũ khí này trong kho!');

    user.weapon = itemKey;
    saveData();
    return msg.reply({ embeds: [createEmbed('🗡️ Trang bị thành công!', `Đã trang bị **${ITEMS[itemKey].name}** (+${ITEMS[itemKey].attack} ATK)`)] });
  }

  // ==================== UNEQUIP ====================
  if (cmd === 'unequip') {
    if (!user.weapon) return msg.reply('❌ Bạn chưa trang bị vũ khí nào!');
    user.weapon = null;
    saveData();
    return msg.reply({ embeds: [createEmbed('✅ Tháo vũ khí', 'Bạn đã tháo vũ khí ra khỏi tay.') ] });
  }

  // ==================== TOP ====================
  if (cmd === 'top') {
    const list = Object.entries(db.users)
      .sort((a, b) => b[1].money - a[1].money)
      .slice(0, 8)
      .map((entry, i) => `**#${i + 1}** <@${entry[0]}> — **${entry[1].money}$**`)
      .join('\n');

    return msg.reply({ embeds: [createEmbed('🏆 BẢNG XẾP HẠNG TIỀN', list || 'Chưa có ai!')] });
  }
});

client.login(process.env.TOKEN);
</code></pre>

    <p style="text-align: center; margin-top: 30px; opacity: 0.8;">
        ✅ Code đã được rebuild hoàn toàn • Đẹp hơn • Nhiều lệnh hơn • Hệ thống EXP/Level • Shop • Equip • !mhelp siêu đẹp<br>
        Chỉ cần copy paste vào file bot.js là chạy ngay! Chúc bạn vui vẻ với bot RPG mới 🔥
    </p>
</body>
</html>
