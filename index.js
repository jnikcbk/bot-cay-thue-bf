const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

// ==================== USER DATA MANAGEMENT (UPGRADED) ====================

/**
 * Khởi tạo dữ liệu người dùng mới
 */
function defaultUser() {
    return {
        // Chỉ số sinh tồn
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        
        // Tài chính & Kho đồ
        money: 36, // Tặng 500$ khởi nghiệp cho người chơi mới
        inventory: {},
        weapon: null,
        
        // Thời gian hồi chiêu & Sự kiện
        lastDaily: 0,
        cooldowns: {
            work: 0,
            mine: 0,
            wood: 0
        },
        
        // Thông tin mở rộng (Dành cho KaizenMC / Pokemon)
        title: 'Tân Thủ', // Danh hiệu mặc định
        points: 0,        // Điểm tiềm năng để cộng vào ATK/HP sau này
        joinedAt: Date.now()
    };
}

/**
 * Lấy dữ liệu người dùng và tự động cập nhật thuộc tính thiếu
 */
function getUser(id) {
    // Nếu chưa có trong DB, tạo mới hoàn toàn
    if (!db.users[id]) {
        db.users[id] = defaultUser();
    } else {
        // CƠ CHẾ "DATA PATCHING" (Vá dữ liệu)
        // Nếu bạn thêm thuộc tính mới vào defaultUser, 
        // dòng này sẽ giúp người chơi cũ cũng có thuộc tính đó mà không bị lỗi undefined.
        const defaultData = defaultUser();
        Object.keys(defaultData).forEach(key => {
            if (db.users[id][key] === undefined) {
                db.users[id][key] = defaultData[key];
            }
        });
    }
    return db.users[id];
}

// ==================== HỆ THỐNG VẬT PHẨM (EXPANDED) ====================
const ITEMS = {
  // --- NGUYÊN LIỆU CƠ BẢN ---
  wood:         { name: 'Gỗ',           emoji: '🌲', sell: 5,    buy: 10 },
  stone:        { name: 'Đá cuội',      emoji: '🪨', sell: 3,    buy: 8 },
  iron:         { name: 'Quặng Sắt',    emoji: '⛓️', sell: 25,   buy: 50 },
  gold:         { name: 'Thỏi Vàng',    emoji: '🟡', sell: 80,   buy: 150 },
  diamond:      { name: 'Kim cương',    emoji: '💎', sell: 300,  buy: 600 },
  netherite:   { name: 'Mảnh Netherite',emoji: '⬛', sell: 1200, buy: 2500 },

  // --- VẬT PHẨM HỒI PHỤC ---
  potion:       { name: 'Bình Máu',     emoji: '🧪', sell: 50,   buy: 100,  heal: 50 },
  super_potion: { name: 'Siêu Bình Máu',emoji: '⚗️', sell: 150,  buy: 350,  heal: 150 },
  bread:        { name: 'Bánh Mì',      emoji: '🍞', sell: 10,   buy: 30,   heal: 15 },

  // --- VŨ KHÍ & TRANG BỊ ---
  sword:        { name: 'Kiếm Sắt',     emoji: '⚔️', sell: 400,  buy: 1200, attack: 15 },
  diamond_sword:{ name: 'Kiếm Kim Cương',emoji: '💎', sell: 1500, buy: 4500, attack: 45 },
  bow:          { name: 'Cung Gỗ',      emoji: '🏹', sell: 250,  buy: 800,  attack: 20 },
  god_slayer:   { name: 'Diệt Thần Đao', emoji: '🔥', sell: 10000, buy: 50000, attack: 150 },

  // --- ĐÁ TIẾN HÓA & HIẾM (Dành cho hệ Pokémon) ---
  fire_stone:   { name: 'Đá Lửa',       emoji: '🔥', sell: 500,  buy: 2000 },
  water_stone:  { name: 'Đá Nước',      emoji: '💧', sell: 500,  buy: 2000 },
  thunder_stone:{ name: 'Đá Điện',      emoji: '⚡', sell: 500,  buy: 2000 },
  fossil:       { name: 'Hóa Thạch',    emoji: '🦴', sell: 1000, buy: 5000 },
  honeycomb:    { name: 'Tổ Ong',       emoji: '🐝', sell: 150,  buy: 400 }
};

// --- MAPPING TÊN THÔNG MINH ---
const NAME_TO_KEY = {};
Object.entries(ITEMS).forEach(([key, item]) => {
  // Map theo ID (ví dụ: !buy iron)
  NAME_TO_KEY[key.toLowerCase()] = key;
  
  // Map theo Tên hiển thị (ví dụ: !buy Quặng Sắt)
  NAME_TO_KEY[item.name.toLowerCase()] = key;

  // Map theo Tên không dấu (Dành cho người dùng lười gõ dấu)
  const nonAccentName = item.name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
  NAME_TO_KEY[nonAccentName] = key;
});
// ==================== UTILS (UPGRADED) ====================

/**
 * Thêm vật phẩm vào kho đồ (Tự động khởi tạo nếu chưa có)
 */
function addItem(user, item, amount = 1) {
    if (!user.inventory) user.inventory = {}; // Bảo hiểm nếu inventory bị undefined
    user.inventory[item] = (user.inventory[item] || 0) + amount;
}

/**
 * Xóa vật phẩm khỏi kho đồ (Tự động xóa key nếu số lượng = 0)
 */
function removeItem(user, item, amount = 1) {
    if (!user.inventory[item] || user.inventory[item] < amount) return false;
    user.inventory[item] -= amount;
    if (user.inventory[item] <= 0) delete user.inventory[item];
    return true;
}

/**
 * Tạo số ngẫu nhiên trong khoảng [min, max]
 */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Định dạng số thành tiền tệ (VD: 1000000 -> 1,000,000$)
 */
function formatMoney(amount) {
    return `${amount.toLocaleString()}$`;
}

/**
 * Công thức tính EXP cần để lên cấp tiếp theo
 */
function getRequiredExp(level) {
    // Công thức tăng tiến: Càng cấp cao càng khó lên
    return level * 150 + 50; 
}

/**
 * Xử lý nhận EXP và thăng cấp (Hỗ trợ nhảy nhiều cấp một lúc)
 */
function gainExp(user, amount) {
    if (amount <= 0) return '';
    user.exp += amount;
    let levelUpCount = 0;

    // Vòng lặp kiểm tra lên cấp liên tục
    while (user.exp >= getRequiredExp(user.level)) {
        user.exp -= getRequiredExp(user.level);
        user.level++;
        user.maxHp += 30; // Mỗi cấp tăng 30 máu tối đa
        user.hp = user.maxHp; // Hồi đầy máu khi lên cấp
        levelUpCount++;
    }

    if (levelUpCount > 0) {
        return `\n🎉 **LEVEL UP!** Bạn đã thăng **${levelUpCount} cấp**!\n🔹 Hiện tại: **Level ${user.level}** (+${levelUpCount * 30} Max HP)`;
    }
    return '';
}

/**
 * Hàm tạo Embed chuẩn chỉnh cho toàn bot
 * @param {string} title - Tiêu đề
 * @param {string} description - Nội dung
 * @param {string} color - Mã màu HEX (Mặc định là màu Blurple)
 */
function createEmbed(title, description, color = '#5865F2') {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ 
            text: 'Minh Meo Eternal • Hệ thống RPG OMNIVERSE', 
            iconURL: client.user.displayAvatarURL() 
        });
}

/**
 * Tạo thanh tiến trình (Progress Bar) cho EXP hoặc HP
 */
function createProgressBar(current, max, length = 10) {
    const percent = Math.min(Math.floor((current / max) * length), length);
    const filled = '▰'.repeat(percent);
    const empty = '▱'.repeat(length - percent);
    return `\`${filled}${empty}\` **${Math.floor((current / max) * 100)}%**`;
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

  // ==================== HELP / MHELP (ULTIMATE UPGRADE) ====================
if (cmd === 'bucactaodi' || cmd === 'mhelp' || cmd === 'trogiup') {
    const helpEmbed = new EmbedBuilder()
        .setColor('#5865F2') // Màu Blurple đặc trưng của Discord
        .setTitle('📜 HỆ THỐNG LỆNH OMNIVERSE RPG')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(
            `>>> Chào mừng **${msg.author.username}** đến với thế giới RPG!\n` +
            `Sử dụng tiền tố \`!\` trước mỗi lệnh để thực hiện hành động.`
        )
        .addFields(
            { 
                name: '👤 NHÂN VẬT & XẾP HẠNG', 
                value: '`!start` • Khởi tạo/Reset hành trình\n`!info` (`!inf`) • Xem hồ sơ & thanh EXP\n`!inv` • Mở kho đồ cá nhân\n`!top` (`!lb`) • Bảng vàng đại gia', 
                inline: false 
            },
            { 
                name: '💰 KINH TẾ & GIAO THƯƠNG', 
                value: '`!daily` • Nhận quà tiếp tế hằng ngày\n`!shop` • Trung tâm giao thương\n`!buy` • Mua vật phẩm thông minh\n`!sell` • Bán đồ thu lợi nhuận', 
                inline: false 
            },
            { 
                name: '🌲 THU THẬP TÀI NGUYÊN', 
                value: '`!wood` • Vào rừng chặt gỗ (May mắn nhận đồ hiếm)\n`!mine` • Đào mỏ tìm khoáng sản (Netherite/Đá quý)', 
                inline: false 
            },
            { 
                name: '⚔️ CHIẾN ĐẤU & SINH TỒ', 
                value: '`!fight` • Săn quái vật (Có tỉ lệ Chí mạng)\n`!heal` • Hồi phục HP bằng bình máu\n`!equip` • Mang vũ khí tăng ATK\n`!unequip` • Tháo vũ khí đang dùng', 
                inline: false 
            }
        )
        .setImage('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Bạn có thể thêm một banner ngang ở đây cho đẹp
        .setFooter({ 
            text: `Yêu cầu bởi ${msg.author.username} • Minh Meo Eternal Project`, 
            iconURL: msg.author.displayAvatarURL({ dynamic: true }) 
        })
        .setTimestamp();

    // Thêm nút bấm tương tác nhanh
    const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
            .setLabel('Tham Gia Community')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/your-link'),
        new ButtonBuilder()
            .setCustomId('quick_start')
            .setLabel('Bắt Đầu Ngay')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🚀')
    );

    return msg.reply({ 
        embeds: [helpEmbed],
        components: [row]
    });
}

  // ==================== START (UPGRADED) ====================
if (cmd === 'start') {
    // Khởi tạo dữ liệu mặc định
    db.users[msg.author.id] = defaultUser();
    saveData();

    // Tạo Embed chuyên nghiệp
    const startEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('✨ KHỞI ĐẦU HÀNH TRÌNH MỚI')
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
        .setDescription(
            `Chào mừng **${msg.author.username}** đã gia nhập thế giới RPG!\n\n` +
            `🔹 **Trạng thái:** Tài khoản đã sẵn sàng.\n` +
            `🔹 **Nhiệm vụ:** Hãy đặt tên cho nhân vật của bạn để bắt đầu phiêu lưu.`
        )
        .addFields({ name: '🚀 Hướng dẫn', value: 'Nhấn vào nút bên dưới để đặt tên định danh cho tài khoản của bạn.', inline: false })
        .setFooter({ text: 'Minh Meo Eternal RPG Project', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    // Tạo nút bấm đặt tên
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('set_name_trigger')
                .setLabel('Đặt Tên Nhân Vật')
                .setStyle('PRIMARY')
                .setEmoji('📝'),
            
            new MessageButton()
                .setCustomId('start_adventure')
                .setLabel('Bắt Đầu Ngay')
                .setStyle('SUCCESS')
                .setEmoji('⚔️')
        );

    return msg.reply({ 
        embeds: [startEmbed], 
        components: [row] 
    });
}

  // ==================== PROFILE / INFO (UPGRADED) ====================
if (cmd === 'profile' || cmd === 'info' || cmd === 'inf') {
    const required = getRequiredExp(user.level);
    const progressPercent = Math.min(Math.floor((user.exp / required) * 100), 100);
    
    // Tạo thanh tiến trình EXP (Progress Bar)
    const progressBarLength = 10;
    const filledBar = '▰'.repeat(Math.floor(progressPercent / progressBarLength));
    const emptyBar = '▱'.repeat(progressBarLength - filledBar.length);
    const progressBar = `\`${filledBar}${emptyBar}\` **${progressPercent}%**`;

    const weaponText = user.weapon 
        ? `🔹 **${ITEMS[user.weapon].name}** \`(+${ITEMS[user.weapon].attack} ⚔️)\`` 
        : '❌ *Chưa trang bị*';

    // Tạo Embed phong cách hiện đại
    const embed = new EmbedBuilder()
        .setColor('#2F3136') // Màu tối sang trọng
        .setAuthor({ 
            name: `HỒ SƠ NHÀ HUẤN LUYỆN: ${msg.author.username}`, 
            iconURL: msg.author.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`>>> *Chào mừng bạn trở lại! Hãy tiếp tục hành trình chinh phục những thử thách mới.*`)
        .addFields(
            { name: '⭐ Cấp Độ', value: `\`Lvl ${user.level}\``, inline: true },
            { name: '💰 Tài Sản', value: `\`${user.money.toLocaleString()}$\``, inline: true },
            { name: '❤️ Sinh Lực', value: `\`${user.hp}/${user.maxHp}\` HP`, inline: true },
            { name: '⚔️ Trang Bị Hiện Tại', value: weaponText, inline: false },
            { name: '📊 Tiến Trình Kinh Nghiệm (EXP)', value: `${progressBar}\n\`${user.exp.toLocaleString()} / ${required.toLocaleString()}\``, inline: false }
        )
        .setFooter({ text: 'Hệ thống RPG OMNIVERSE', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    return msg.reply({ embeds: [embed] });
}
  // ==================== INVENTORY (UPGRADED) ====================
if (cmd === 'inv' || cmd === 'inventory' || cmd === 'tui') {
    const inventoryEntries = Object.entries(user.inventory);

    if (inventoryEntries.length === 0) {
        const emptyEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🎒 KHO ĐỒ TRỐNG RỖNG')
            .setDescription('>>> *Có vẻ như bạn chưa có gì trong tay cả. Hãy bắt đầu chuyến phiêu lưu để thu thập vật phẩm nhé!*')
            .setThumbnail('https://i.pinimg.com/originals/99/db/e8/99dbe8646733d4c63c113fe6fe8a44d3.gif'); // Link icon rương trống (nếu có)
        return msg.reply({ embeds: [emptyEmbed] });
    }

    // Phân loại vật phẩm (Nếu bạn có thuộc tính type trong ITEMS)
    const itemList = inventoryEntries
        .map(([id, quantity]) => {
            const item = ITEMS[id];
            const itemName = item ? item.name : id;
            const itemEmoji = item?.emoji || '📦';
            return `${itemEmoji} **${itemName}** \`[x${quantity}]\``;
        })
        .join('\n');

    const invEmbed = new EmbedBuilder()
        .setColor('#FEE75C') // Màu vàng rực rỡ cho kho báu
        .setAuthor({ 
            name: `HÀNH TRANG CỦA ${msg.author.username.toUpperCase()}`, 
            iconURL: msg.author.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon rương đồ Pokémon/RPG
        .setDescription(`>>> *Dưới đây là tất cả những gì bạn đang sở hữu. Hãy sử dụng chúng một cách khôn ngoan!*`)
        .addFields(
            { name: '🎒 Vật phẩm sở hữu', value: itemList || 'Chưa có vật phẩm nào.', inline: false },
            { name: '📊 Tổng cộng', value: `\`${inventoryEntries.length}\` loại vật phẩm khác nhau.`, inline: true }
        )
        .setFooter({ text: 'Mẹo: Sử dụng !use [tên] để dùng vật phẩm', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    // Thêm nút bấm tương tác nhanh
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('sort_inv')
                .setLabel('Sắp Xếp')
                .setStyle('SECONDARY')
                .setEmoji('🗃️'),
            new MessageButton()
                .setCustomId('open_shop')
                .setLabel('Vào Cửa Hàng')
                .setStyle('PRIMARY')
                .setEmoji('💰')
        );

    return msg.reply({ 
        embeds: [invEmbed],
        components: [row]
    });
}
  // ==================== DAILY (UPGRADED) ====================
if (cmd === 'daily' || cmd === 'nhanqua') {
    const now = Date.now();
    const cooldown = 86400000; // 24 giờ
    const lastDaily = user.lastDaily || 0;

    if (now - lastDaily < cooldown) {
        const timeLeft = cooldown - (now - lastDaily);
        const hours = Math.floor(timeLeft / 3600000);
        const minutes = Math.floor((timeLeft % 3600000) / 60000);
        
        const waitEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`⏳ **|** Bạn đã nhận quà hôm nay rồi!\n\n> Hãy quay lại sau: **${hours} giờ ${minutes} phút** nữa nhé.`);
        return msg.reply({ embeds: [waitEmbed] });
    }

    // Xử lý nhận thưởng
    user.lastDaily = now;
    const rewardMoney = 800;
    const rewardPotions = 2;
    const rewardExp = 30;

    user.money += rewardMoney;
    addItem(user, 'potion', rewardPotions);
    const lvlMsg = gainExp(user, rewardExp);
    saveData();

    // Tạo Embed phần thưởng
    const dailyEmbed = new EmbedBuilder()
        .setColor('#57F287') // Màu xanh lá tươi mới
        .setTitle('🌅 PHẦN THƯỞNG HẰNG NGÀY')
        .setThumbnail('https://i.pinimg.com/originals/da/2a/fa/da2afa475176eb220f9b8f0ec78f12c9.gif') // Icon hộp quà cute
        .setDescription(`Chúc mừng **${msg.author.username}**! Bạn đã nhận được gói tiếp tế hôm nay:`)
        .addFields(
            { name: '💰 Tiền Thưởng', value: `\`+${rewardMoney.toLocaleString()}$\``, inline: true },
            { name: '🧪 Vật Phẩm', value: `\`+${rewardPotions}\` Bình máu`, inline: true },
            { name: '✨ Kinh Nghiệm', value: `\`+${rewardExp}\` EXP`, inline: true }
        )
        .setFooter({ text: 'Hãy quay lại vào ngày mai để nhận thêm nhé!' })
        .setTimestamp();

    if (lvlMsg) {
        dailyEmbed.addField('🆙 LÊN CẤP!', `🌟 **${lvlMsg}**`, false);
        dailyEmbed.setColor('#FEE75C'); // Đổi sang màu vàng nếu lên cấp
    }

    return msg.reply({ 
        content: `❤️ Cảm ơn bạn đã đồng hành cùng máy chủ!`,
        embeds: [dailyEmbed] 
    });
}

 // ==================== WOODCUTTING (UPGRADED) ====================
if (cmd === 'wood' || cmd === 'chatgo') {
    // Tính toán phần thưởng cơ bản
    const woodAmount = rand(3, 8);
    const moneyG = rand(2, 7);
    const expG = rand(5, 12);
    
    // Hệ thống may mắn: 10% cơ hội nhận được Tổ ong hoặc Nhựa cây
    let extraItem = null;
    if (Math.random() < 0.1) { 
        extraItem = { id: 'honeycomb', name: 'Tổ Ong', emoji: '🐝' };
        addItem(user, extraItem.id, 1);
    }

    // Cập nhật dữ liệu
    addItem(user, 'wood', woodAmount);
    user.money += moneyG;
    const lvlMsg = gainExp(user, expG);
    saveData();

    // Tạo Embed chuyên nghiệp
    const woodEmbed = new EmbedBuilder()
        .setColor('#43B581') // Màu xanh lá của rừng rậm
        .setAuthor({ 
            name: `${msg.author.username} đang tiến vào khu rừng...`, 
            iconURL: msg.author.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon cây rìu hoặc cây xanh
        .setDescription(`>>> *Tiếng rìu vang vọng khắp cánh rừng cổ thụ.*`)
        .addFields(
            { name: '🌲 Tài nguyên thu được', value: `\`+${woodAmount}\` Gỗ`, inline: true },
            { name: '💰 Tiền nhặt được', value: `\`+${moneyG}$\``, inline: true },
            { name: '✨ Kinh nghiệm', value: `\`+${expG}\` EXP`, inline: true }
        )
        .setFooter({ text: 'Mẹo: Rìu xịn sẽ giúp bạn chặt được nhiều gỗ hơn!' })
        .setTimestamp();

    // Nếu có vật phẩm hiếm
    if (extraItem) {
        woodEmbed.addField('✨ PHÁT HIỆN BẤT NGỜ!', `${extraItem.emoji} Bạn tìm thấy **1 ${extraItem.name}** trong hốc cây!`, false);
        woodEmbed.setColor('#FEE75C'); // Đổi màu sang vàng để báo hiệu may mắn
    }

    // Nếu lên cấp
    if (lvlMsg) {
        woodEmbed.addField('🆙 LEVEL UP!', `🌟 **${lvlMsg}**`, false);
    }

    return msg.reply({ 
        content: `**🪓 | Phập! Phập! Phập!**`,
        embeds: [woodEmbed] 
    });
}
  // ==================== MINING (EXTENDED VERSION) ====================
if (cmd === 'mine' || cmd === 'daomo') {
    const luck = Math.random();
    let item, amount, color, extraItem = null;

    // Hệ thống phân cấp khoáng sản mới
    if (luck < 0.02) { // 2% Cực hiếm
        item = 'netherite'; 
        amount = 1;
        color = '#4A3B33';
    } else if (luck < 0.08) { // 6% Kim cương
        item = 'diamond';
        amount = rand(1, 2);
        color = '#3498DB';
    } else if (luck < 0.15) { // 7% Đá Tiến Hóa (Hợp chủ đề Pokemon)
        const stones = ['fire_stone', 'water_stone', 'thunder_stone'];
        item = stones[rand(0, stones.length - 1)];
        amount = 1;
        color = '#E67E22';
    } else if (luck < 0.30) { // 15% Vàng
        item = 'gold';
        amount = rand(2, 4);
        color = '#F1C40F';
    } else if (luck < 0.60) { // 30% Sắt
        item = 'iron';
        amount = rand(3, 5);
        color = '#95A5A6';
    } else { // 40% Đá cuội
        item = 'stone';
        amount = rand(5, 10);
        color = '#7F8C8D';
    }

    // Tỉ lệ 5% nhặt được mảnh hóa thạch hoặc rác (hộp thiếc)
    if (Math.random() < 0.05) {
        extraItem = { id: 'fossil', name: 'Hóa Thạch Cổ Đại', emoji: '🦴' };
        addItem(user, extraItem.id, 1);
    }

    const moneyG = rand(5, 20);
    const expG = rand(10, 25);
    
    addItem(user, item, amount);
    user.money += moneyG;
    const lvlMsg = gainExp(user, expG);
    saveData();

    const mineEmbed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ 
            name: `${msg.author.username} đang khai thác tại hầm mỏ sâu...`, 
            iconURL: msg.author.displayAvatarURL({ dynamic: true }) 
        })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif')
        .setDescription(`>>> *Keng! Một tiếng vang lạ thường từ vách đá...*`)
        .addFields(
            { name: '💎 Khoáng sản chính', value: `\`+${amount}\` **${ITEMS[item]?.name || item}**`, inline: true },
            { name: '💰 Tiền công', value: `\`+${moneyG}$\``, inline: true },
            { name: '✨ Kinh nghiệm', value: `\`+${expG}\` EXP`, inline: true }
        )
        .setFooter({ text: 'Mẹo: Dùng Cúp Xịn để tăng tỉ lệ ra Netherite!' })
        .setTimestamp();

    if (extraItem) {
        mineEmbed.addField('👀 PHÁT HIỆN BẤT NGỜ!', `${extraItem.emoji} Bạn đào trúng **1 ${extraItem.name}**!`, false);
    }

    if (lvlMsg) {
        mineEmbed.addField('🆙 LEVEL UP!', `🌟 **${lvlMsg}**`, false);
        mineEmbed.setColor('#FEE75C');
    }

    return msg.reply({ 
        content: `**⛏️ | Rầm! Rầm! Keng!**`,
        embeds: [mineEmbed] 
    });
}
// ==================== FIGHT (UPGRADED) ====================
if (cmd === 'fight' || cmd === 'chien' || cmd === 'pve') {
    const monsters = [
        { name: 'Zubat Hang Động', emoji: '🦇', lv: 5 },
        { name: 'Sắt Vụn Cổ Đại', emoji: '🤖', lv: 8 },
        { name: 'Creeper Đột Biến', emoji: '🧨', lv: 12 },
        { name: 'Sói Tuyết Hoang', emoji: '🐺', lv: 7 },
        { name: 'Rồng Đất Mini', emoji: '🐲', lv: 15 }
    ];
    
    const monster = monsters[rand(0, monsters.length - 1)];
    const weapon = user.weapon ? ITEMS[user.weapon] : null;
    
    // Tính toán sát thương
    const baseDmg = rand(15, 30);
    const weaponAtk = weapon ? weapon.attack : 0;
    let totalDmg = baseDmg + weaponAtk;
    
    // Tỉ lệ Chí mạng 15%
    let isCrit = false;
    if (Math.random() < 0.15) {
        isCrit = true;
        totalDmg = Math.floor(totalDmg * 1.5);
    }

    // Quái vật phản công
    const counterDmg = rand(10, 25);
    user.hp -= counterDmg;

    // Kiểm tra tử trận
    if (user.hp <= 0) {
        user.hp = Math.floor(user.maxHp * 0.2); // Chết thì hồi lại 20% máu thôi cho có độ khó
        saveData();
        const deathEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('☠️ BẠN ĐÃ TỬ TRẬN!')
            .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif')
            .setDescription(`>>> **${monster.emoji} ${monster.name}** đã hạ gục bạn!\nBạn được đưa về làng để cấp cứu (Hồi 20% HP).`)
            .setFooter({ text: 'Hãy mua thêm Bình Máu trước khi ra trận!' });
        return msg.reply({ embeds: [deathEmbed] });
    }

    // Phần thưởng
    const moneyG = rand(40, 80) + Math.floor(totalDmg / 2);
    const expG = rand(25, 45) + Math.floor(totalDmg / 3);
    user.money += moneyG;
    const lvlMsg = gainExp(user, expG);

    // Rơi vật phẩm ngẫu nhiên (12%)
    let dropMsg = '';
    if (Math.random() < 0.12) {
        const drops = ['potion', 'iron', 'wood'];
        const dropItem = drops[rand(0, drops.length - 1)];
        addItem(user, dropItem, 1);
        dropMsg = `\n🎁 **Rơi đồ:** Nhận được \`1 ${ITEMS[dropItem]?.name || dropItem}\`!`;
    }

    saveData();

    // Embed chiến đấu
    const fightEmbed = new new EmbedBuilder()
        .setColor(isCrit ? '#FEE75C' : '#5865F2')
        .setAuthor({ name: `Trận chiến với ${monster.name}`, iconURL: msg.author.displayAvatarURL() })
        .setDescription(`>>> ${isCrit ? '💥 **CHÍ MẠNG!** ' : ''}Bạn vung vũ khí gây **${totalDmg}** sát thương!\n${monster.emoji} **${monster.name}** gục ngã sau đòn đánh.`)
        .addFields(
            { name: '💰 Chiến lợi phẩm', value: `\`+${moneyG}$\` & \`+${expG} EXP\`${dropMsg}`, inline: false },
            { name: '❤️ Tình trạng bản thân', value: `\`HP: ${user.hp}/${user.maxHp}\` (Bị phản công \`-${counterDmg}\`)`, inline: false }
        )
        .setFooter({ text: `Vũ khí: ${weapon ? weapon.name : 'Tay không'}` })
        .setTimestamp();

    if (lvlMsg) {
        fightEmbed.addField('🆙 LEVEL UP!', `🌟 **${lvlMsg}**`, false);
        fightEmbed.setColor('#57F287');
    }

    return msg.reply({ 
        content: `⚔️ **${msg.author.username}** đã chiến thắng!`,
        embeds: [fightEmbed] 
    });
}
 // ==================== HEAL (UPGRADED) ====================
if (cmd === 'heal' || cmd === 'bomau' || cmd === 'hptiep') {
    // 1. Kiểm tra số lượng bình máu
    const potionCount = user.inventory.potion || 0;
    if (potionCount <= 0) {
        const noPotionEmbed = new EmbedBuilder()
            .setColor('#FFAA00')
            .setAuthor({ name: 'THIẾU VẬT PHẨM!', iconURL: msg.author.displayAvatarURL() })
            .setDescription('>>> ❌ Bạn không còn **Bình Máu (Potion)** nào trong kho đồ!\n\n💡 *Mẹo: Hãy dùng lệnh `!shop` để mua thêm hoặc đi `!fight` để nhặt nhé.*');
        return msg.reply({ embeds: [noPotionEmbed] });
    }

    // 2. Kiểm tra nếu máu đã đầy
    if (user.hp >= user.maxHp) {
        return msg.reply('✨ Máu của bạn đã đầy rồi, không cần lãng phí bình máu đâu!');
    }

    // 3. Xử lý hồi máu
    const healAmount = ITEMS.potion.heal || 50; // Giả sử hồi 50 HP
    const oldHp = user.hp;
    user.hp = Math.min(user.maxHp, user.hp + healAmount);
    const actualHealed = user.hp - oldHp;
    
    // Trừ 1 bình máu
    removeItem(user, 'potion', 1);
    saveData();

    // 4. Tạo thanh máu (HP Bar)
    const hpPercent = Math.floor((user.hp / user.maxHp) * 10);
    const hpBar = '❤️'.repeat(hpPercent) + '🖤'.repeat(10 - hpPercent);

    const healEmbed = new EmbedBuilder()
        .setColor('#57F287') // Màu xanh hồi phục
        .setAuthor({ name: `${msg.author.username} đã sử dụng Bình Máu`, iconURL: msg.author.displayAvatarURL() })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon bình máu/trái tim
        .setDescription(`>>> 💊 Bạn cảm thấy cơ thể tràn đầy năng lượng!\n\n**Hồi phục:** \`+${actualHealed} HP\``)
        .addFields(
            { name: '📊 Tình trạng sinh lực', value: `${hpBar}\n**${user.hp} / ${user.maxHp} HP**`, inline: false },
            { name: '🎒 Kho đồ còn lại', value: `\`${potionCount - 1}\` Bình Máu`, inline: true }
        )
        .setFooter({ text: 'Hãy luôn giữ HP cao trước khi đi thám hiểm!' })
        .setTimestamp();

    return msg.reply({ 
        content: `✨ **Bloop!** Hồi máu thành công!`,
        embeds: [healEmbed] 
    });
}
  // ==================== SHOP (ULTIMATE VERSION) ====================
if (cmd === 'shop' || cmd === 'cuahang' || cmd === 'store') {
    // 1. Phân loại vật phẩm từ ITEMS
    const categories = {
        '💊 VẬT PHẨM HỒI PHỤC': [],
        '⚔️ TRANG BỊ CHIẾN ĐẤU': [],
        '💎 NGUYÊN LIỆU QUÝ': [],
        '🌿 VẬT PHẨM KHÁC': []
    };

    Object.entries(ITEMS).forEach(([id, item]) => {
        if (item.buy === undefined) return; // Chỉ hiện đồ có thể mua

        const itemInfo = `**${item.emoji || '📦'} ${item.name}**\n` +
            `└ Giá: \`${item.buy.toLocaleString()}$\` | Bán: \`${item.sell.toLocaleString()}$\` ` +
            `${item.attack ? `| ⚔️ +${item.attack}` : ''}${item.heal ? `| ❤️ +${item.heal}` : ''}`;

        // Logic phân loại (tùy thuộc vào thuộc tính type của bạn hoặc check ID)
        if (item.heal) categories['💊 VẬT PHẨM HỒI PHỤC'].push(itemInfo);
        else if (item.attack || id.includes('pickaxe') || id.includes('sword')) categories['⚔️ TRANG BỊ CHIẾN ĐẤU'].push(itemInfo);
        else if (['diamond', 'iron', 'gold', 'netherite'].includes(id)) categories['💎 NGUYÊN LIỆU QUÝ'].push(itemInfo);
        else categories['🌿 VẬT PHẨM KHÁC'].push(itemInfo);
    });

    // 2. Tạo Embed chuyên nghiệp
    const shopEmbed = new EmbedBuilder()
        .setColor('#FEE75C') // Màu vàng của tiền vàng
        .setTitle('🛒 TRUNG TÂM GIAO THƯƠNG OMNIVERSE')
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon túi tiền hoặc shop
        .setDescription(`Chào mừng **${msg.author.username}**! Bạn đang có: **${user.money.toLocaleString()}$**\n*Sử dụng lệnh \`!buy [id]\` để mua vật phẩm.*`)
        .setFooter({ text: 'Hệ thống tự động cập nhật vật phẩm mới mỗi tuần!', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    // Thêm các Field nếu danh mục đó có đồ
    for (const [name, items] of Object.entries(categories)) {
        if (items.length > 0) {
            shopEmbed.addFields({ name: name, value: items.join('\n'), inline: false });
        }
    }

    // 3. Thêm các nút bấm điều hướng nhanh (Nếu bạn muốn)
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('buy_potion')
                .setLabel('Mua Bình Máu')
                .setStyle('SUCCESS')
                .setEmoji('💊'),
            new MessageButton()
                .setCustomId('view_inv')
                .setLabel('Xem Kho Đồ')
                .setStyle('PRIMARY')
                .setEmoji('🎒')
        );

    return msg.reply({ 
        embeds: [shopEmbed],
        components: [row]
    });
}

  // ==================== BUY (UPGRADED) ====================
if (cmd === 'buy' || cmd === 'mua') {
    // 1. Hướng dẫn nếu thiếu đối số
    if (!args[0]) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#FFAA00')
            .setAuthor({ name: 'HƯỚNG DẪN MUA ĐỒ', iconURL: msg.author.displayAvatarURL() })
            .setDescription('>>> 🛒 **Cách dùng:** `!buy <tên vật phẩm> [số lượng]`\n\n*Ví dụ: `!buy potion 5` hoặc `!buy kiem`*');
        return msg.reply({ embeds: [helpEmbed] });
    }

    // 2. Tìm kiếm vật phẩm thông minh (Tìm theo ID hoặc Tên Tiếng Việt)
    const input = args.slice(0, args.length - (parseInt(args[args.length - 1]) ? 1 : 0)).join(' ').toLowerCase();
    const amount = parseInt(args[args.length - 1]) > 0 ? parseInt(args[args.length - 1]) : 1;

    // Tìm Key chính xác trong ITEMS hoặc qua bảng tra cứu NAME_TO_KEY
    const itemKey = Object.keys(ITEMS).find(k => k.toLowerCase() === input || ITEMS[k].name.toLowerCase() === input) || NAME_TO_KEY[input];

    if (!itemKey || !ITEMS[itemKey].buy) {
        return msg.reply('❌ **Vật phẩm này không tồn tại hoặc không có trong cửa hàng!**');
    }

    const item = ITEMS[itemKey];
    const totalCost = item.buy * amount;

    // 3. Kiểm tra túi tiền
    if (user.money < totalCost) {
        const poorEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setDescription(`❌ **Giao dịch thất bại!**\n\nBạn còn thiếu \`${(totalCost - user.money).toLocaleString()}$\` để mua **${amount}x ${item.name}**.`);
        return msg.reply({ embeds: [poorEmbed] });
    }

    // 4. Thực hiện giao dịch
    user.money -= totalCost;
    addItem(user, itemKey, amount);
    saveData();

    // 5. Embed xác nhận cực đẹp
    const successEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setAuthor({ name: 'GIAO DỊCH THÀNH CÔNG', iconURL: 'https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif' })
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
        .setDescription(`>>> Bạn đã thanh toán thành công cho thương nhân OMNIVERSE.`)
        .addFields(
            { name: '📦 Vật phẩm', value: `\`${amount}x\` **${item.name}** ${item.emoji || ''}`, inline: true },
            { name: '💰 Tổng chi', value: `\`-${totalCost.toLocaleString()}$\``, inline: true },
            { name: '💳 Số dư', value: `\`${user.money.toLocaleString()}$\``, inline: true }
        )
        .setFooter({ text: 'Cảm ơn bạn đã ủng hộ cửa hàng!' })
        .setTimestamp();

    return msg.reply({ 
        content: `✅ **|** Chúc mừng **${msg.author.username}** đã mua đồ mới!`,
        embeds: [successEmbed] 
    });
}

  // ==================== SELL (UPGRADED) ====================
if (cmd === 'sell' || cmd === 'ban') {
    // 1. Kiểm tra đối số đầu vào
    if (!args[0]) {
        const sellHelp = new EmbedBuilder()
            .setColor('#FFAA00')
            .setAuthor({ name: 'HƯỚNG DẪN BÁN VẬT PHẨM', iconURL: msg.author.displayAvatarURL() })
            .setDescription('>>> 💰 **Cách dùng:** `!sell <tên vật phẩm> [số lượng]`\n\n*Ví dụ: `!sell go 10` hoặc `!sell iron`*');
        return msg.reply({ embeds: [sellHelp] });
    }

    // 2. Tìm kiếm vật phẩm thông minh (Tìm theo ID hoặc Tên)
    // Tách số lượng ở cuối nếu có (Ví dụ: !sell go 10)
    const lastArg = args[args.length - 1];
    const hasAmount = !isNaN(lastArg) && parseInt(lastArg) > 0;
    const amount = hasAmount ? parseInt(lastArg) : 1;
    const inputName = hasAmount ? args.slice(0, -1).join(' ').toLowerCase() : args.join(' ').toLowerCase();

    const itemKey = Object.keys(ITEMS).find(k => 
        k.toLowerCase() === inputName || 
        ITEMS[k].name.toLowerCase() === inputName
    ) || NAME_TO_KEY[inputName];

    // 3. Kiểm tra tính hợp lệ
    if (!itemKey || !ITEMS[itemKey].sell) {
        return msg.reply('❌ **Vật phẩm này không thể bán hoặc không tồn tại!**');
    }

    const item = ITEMS[itemKey];
    const userStock = user.inventory[itemKey] || 0;

    if (userStock < amount) {
        return msg.reply(`❌ **Bạn không đủ vật phẩm!** (Hiện có: \`${userStock}\` ${item.name})`);
    }

    // 4. Tính toán và thực hiện giao dịch
    const totalEarn = item.sell * amount;
    user.money += totalEarn;
    removeItem(user, itemKey, amount);
    saveData();

    // 5. Giao diện xác nhận "Xịn"
    const sellEmbed = new EmbedBuilder()
        .setColor('#5865F2') // Màu xanh thương hiệu
        .setAuthor({ name: 'GIAO DỊCH HOÀN TẤT', iconURL: ' })
        .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
        .setDescription(`>>> Bạn đã bán vật phẩm cho thương nhân và nhận được tiền mặt.`)
        .https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif' addFields(
            { name: '📦 Vật phẩm bán', value: `\`${amount}x\` **${item.name}** ${item.emoji || ''}`, inline: true },
            { name: '💰 Thu nhập', value: `\`+${totalEarn.toLocaleString()}$\``, inline: true },
            { name: '💳 Số dư mới', value: `\`${user.money.toLocaleString()}$\``, inline: true }
        )
        .setFooter({ text: 'Mẹo: Một số vật phẩm sẽ có giá cao hơn khi bán theo số lượng lớn!' })
        .setTimestamp();

    return msg.reply({ 
        content: `💵 **|** Giao dịch thành công, **${msg.author.username}**!`,
        embeds: [sellEmbed] 
    });
}

  // ==================== EQUIP (UPGRADED) ====================
if (cmd === 'equip' || cmd === 'mac' || cmd === 'dung') {
    // 1. Kiểm tra đầu vào
    if (!args[0]) {
        const equipHelp = new EmbedBuilder()
            .setColor('#FFAA00')
            .setAuthor({ name: 'HƯỚNG DẪN TRANG BỊ', iconURL: msg.author.displayAvatarURL() })
            .setDescription('>>> 🗡️ **Cách dùng:** `!equip <tên vũ khí>`\n\n*Ví dụ: `!equip kiem sat` hoặc `!equip diamond_sword`*');
        return msg.reply({ embeds: [equipHelp] });
    }

    // 2. Tìm kiếm vũ khí thông minh
    const inputName = args.join(' ').toLowerCase();
    const itemKey = Object.keys(ITEMS).find(k => 
        k.toLowerCase() === inputName || 
        ITEMS[k].name.toLowerCase() === inputName
    ) || NAME_TO_KEY[inputName];

    // 3. Kiểm tra tính hợp lệ
    if (!itemKey || !ITEMS[itemKey].attack) {
        return msg.reply('❌ **Vật phẩm này không phải là vũ khí hoặc không tồn tại!**');
    }

    if (!user.inventory[itemKey] || user.inventory[itemKey] <= 0) {
        return msg.reply(`❌ **Bạn không sở hữu vật phẩm này!** Hãy kiểm tra lại túi đồ (\`!inv\`).`);
    }

    // 4. Lưu chỉ số cũ để so sánh
    const oldWeaponKey = user.weapon;
    const oldAtk = oldWeaponKey ? ITEMS[oldWeaponKey].attack : 0;
    const newAtk = ITEMS[itemKey].attack;

    // 5. Cập nhật trang bị
    user.weapon = itemKey;
    saveData();

    // 6. Embed trang bị "Xịn"
    const equipEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ name: 'TRANG BỊ VŨ KHÍ MỚI', iconURL: msg.author.displayAvatarURL() })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon vũ khí/chiến binh
        .setDescription(`>>> **${msg.author.username}** đã rút vũ khí và sẵn sàng chiến đấu!`)
        .addFields(
            { name: '🗡️ Vũ khí hiện tại', value: `**${ITEMS[itemKey].name}** ${ITEMS[itemKey].emoji || ''}`, inline: true },
            { name: '⚔️ Sức mạnh (ATK)', value: `\`${oldAtk}\` ➔ \`${newAtk}\` **(+${newAtk - oldAtk})**`, inline: true }
        )
        .setFooter({ text: 'Mẹo: Vũ khí mạnh hơn giúp bạn nhận được nhiều tiền hơn khi đi !fight' })
        .setTimestamp();

    return msg.reply({ 
        content: `✨ **|** Bạn đã trang bị thành công!`,
        embeds: [equipEmbed] 
    });
}
  // ==================== UNEQUIP (UPGRADED) ====================
if (cmd === 'unequip' || cmd === 'thao') {
    // 1. Kiểm tra xem người dùng có đang cầm vũ khí không
    if (!user.weapon) {
        return msg.reply('❌ **Bạn đang không trang bị vũ khí nào để tháo cả!**');
    }

    // 2. Lấy thông tin vũ khí hiện tại trước khi tháo
    const currentWeapon = ITEMS[user.weapon];
    const oldAtk = currentWeapon ? currentWeapon.attack : 0;
    const weaponName = currentWeapon ? currentWeapon.name : user.weapon;
    const weaponEmoji = currentWeapon?.emoji || '🧤';

    // 3. Thực hiện tháo vũ khí
    user.weapon = null;
    saveData();

    // 4. Tạo Embed thông báo "Xịn"
    const unequipEmbed = new EmbedBuilder()
        .setColor('#2F3136') // Màu tối sang trọng (trạng thái nghỉ)
        .setAuthor({ name: 'THÁO TRANG BỊ', iconURL: msg.author.displayAvatarURL() })
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon nhân vật/giáp trụ
        .setDescription(`>>> Bạn đã cất **${weaponName}** vào lại kho đồ. Hiện tại bạn đang chiến đấu bằng **Tay Không**.`)
        .addFields(
            { name: '📦 Vật phẩm đã tháo', value: `${weaponEmoji} **${weaponName}**`, inline: true },
            { name: '⚔️ Sức mạnh hiện tại', value: `\`${oldAtk}\` ➔ \`5\` **(-${oldAtk - 5})**`, inline: true }
        )
        .setFooter({ text: 'Sử dụng !equip <tên> để trang bị vũ khí mới!' })
        .setTimestamp();

    return msg.reply({ 
        content: `🧤 **|** Tháo trang bị thành công, **${msg.author.username}**!`,
        embeds: [unequipEmbed] 
    });
}
 // ==================== TOP / LEADERBOARD (UPGRADED) ====================
if (cmd === 'top' || cmd === 'lb' || cmd === 'rank') {
    // 1. Sắp xếp danh sách người dùng theo tiền (Money)
    const sortedUsers = Object.entries(db.users)
        .sort((a, b) => b[1].money - a[1].money)
        .slice(0, 10); // Lấy Top 10 cho máu!

    if (sortedUsers.length === 0) {
        return msg.reply('📭 **Bảng xếp hạng hiện đang trống. Hãy là người đầu tiên kiếm tiền!**');
    }

    // 2. Tạo nội dung danh sách với Huy chương
    const topList = sortedUsers.map(([id, data], i) => {
        let medal = '';
        if (i === 0) medal = '🥇';
        else if (i === 1) medal = '🥈';
        else if (i === 2) medal = '🥉';
        else medal = `**#${i + 1}**`;

        // Lấy tên người dùng từ cache của Discord nếu có, không thì dùng ID
        const userTag = client.users.cache.get(id)?.username || `User_${id.slice(-4)}`;
        
        return `${medal} **${userTag}** — \`${data.money.toLocaleString()}$\``;
    }).join('\n');

    // 3. Tìm thứ hạng của chính người dùng hiện tại
    const userRank = Object.entries(db.users)
        .sort((a, b) => b[1].money - a[1].money)
        .findIndex(entry => entry[0] === msg.author.id) + 1;

    // 4. Tạo Embed "Xịn"
    const topEmbed = new EmbedBuilder()
        .setColor('#FEE75C') // Màu vàng hoàng gia
        .setTitle('🏆 BẢNG VÀNG ĐẠI GIA OMNIVERSE')
        .setThumbnail('https://i.pinimg.com/originals/53/ad/0c/53ad0cc3373bbe0ea51dd878241952c6.gif') // Icon Cup vàng
        .setDescription(`>>> *Dưới đây là danh sách những nhà huấn luyện giàu có nhất thế giới RPG.*\n\n${topList}`)
        .addFields({ 
            name: '👤 Thứ hạng của bạn', 
            value: `Bạn đang đứng vị trí **#${userRank}** với \`${user.money.toLocaleString()}$\``, 
            inline: false 
        })
        .setFooter({ text: 'Cập nhật thời gian thực • Hãy chăm chỉ cày cuốc!', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    return msg.reply({ 
        content: `👑 **|** Vinh danh những người dẫn đầu!`,
        embeds: [topEmbed] 
    });
}
});
client.login(process.env.TOKEN);
