const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Vanguard Blox Bot is Online! 💎');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Web Server đang chạy tại port: ${port}`);
});

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  Events,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder // Thêm AttachmentBuilder để làm file lưu lịch sử
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const SHOP_NAME = "[🛡] 𝖁𝖆𝖓𝖌𝖚𝖆𝖗𝖉 𝕭𝖑𝖔𝖝 💎";
const SUPPORT_TEXT = "Vui lòng ghi rõ nhu cầu, game, server, level và thời gian cần hỗ trợ.";

const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID || "";     // ID Role Staff
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";  // ID Category chứa Ticket
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "";        // ID Kênh Log lưu lịch sử

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ Thiếu TOKEN hoặc CLIENT_ID");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent 
  ],
  partials: [Partials.Channel, Partials.Message],
});

/* =========================
   DỊCH VỤ CÀY THUÊ
========================= */
const services = [
  { id: 1, name: "Lấy Haki Màu", price: "40,000 đ", requirement: "lv trên 1500", category: "Items & Swords" },
  { id: 2, name: "Lấy Kiếm Shizu", price: "20,000 đ", requirement: "lv trên 1500 + đủ 2m beli", category: "Items & Swords" },
  { id: 3, name: "Lấy Kiếm Saishi", price: "20,000 đ", requirement: "lv trên 1500 + đủ 2m beli", category: "Items & Swords" },
  { id: 4, name: "Lấy Kiếm Oroshi", price: "20,000 đ", requirement: "lv trên 1500 + đủ 2m beli", category: "Items & Swords" },
  { id: 5, name: "Lấy 3 Thanh Kiếm Shizu, Saishi, Oroshi", price: "50,000 đ", requirement: "lv trên 1500 + đủ 6m beli", category: "Items & Swords" },
  { id: 6, name: "Lấy Kiếm Tushita", price: "40,000 đ", requirement: "lv trên 2300", category: "Items & Swords" },
  { id: 7, name: "Lấy Kiếm Yama", price: "30,000 đ", requirement: "lv trên 1500", category: "Items & Swords" },
  { id: 8, name: "Lấy Song Kiếm Oden", price: "60,000 đ", requirement: "đã có 2 thanh Yama + Tushita + 350 mas", category: "Items & Swords" },
  { id: 9, name: "Lấy Mỏ Neo", price: "40,000 đ", requirement: "đã có Sắt Nam Châm", category: "Items & Swords" },
  { id: 10, name: "Lấy Mỏ Neo A-Z", price: "60,000 đ", requirement: "lv max", category: "Items & Swords" },
  { id: 11, name: "Up Yoru V2", price: "20,000 đ", requirement: "không ghi rõ", category: "Items & Swords" },
  { id: 12, name: "Up Yoru V3", price: "100,000 đ", requirement: "có sẵn 4 tộc V3", category: "Items & Swords" },
  { id: 13, name: "Lấy Yoru Mini", price: "400,000 đ", requirement: "đã lên Sea 3", category: "Items & Swords" },

  { id: 14, name: "Lấy Áo Choàng Râu Đen", price: "400,000 đ", requirement: "lv trên 1000", category: "Apparel & Materials" },
  { id: 15, name: "Lấy Nguyên Thạch Bóng Tối", price: "30,000 đ", requirement: "lv trên 700", category: "Apparel & Materials" },

  { id: 16, name: "Lấy 1 Đai", price: "20,000 đ", requirement: "Dragon Talon 500 mas", category: "Belts & Guns" },
  { id: 17, name: "Lấy 3 Đai", price: "60,000 đ", requirement: "Dragon Talon 500 mas", category: "Belts & Guns" },
  { id: 18, name: "Lấy 8 Đai", price: "150,000 đ", requirement: "Dragon Talon 500 mas", category: "Belts & Guns" },
  { id: 19, name: "Lấy Súng Dragon Storm", price: "50,000 đ", requirement: "có sẵn 8 đai", category: "Belts & Guns" },
  { id: 20, name: "Lấy Kiếm Dragon Heart", price: "40,000 đ", requirement: "có sẵn 8 đai", category: "Belts & Guns" },

  { id: 21, name: "Đánh Boss Mới", price: "30,000 đ", requirement: "lv max hoặc gần max", category: "Boss & Mastery" },
  { id: 22, name: "Cày Full Chiêu Súng", price: "40,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 27, name: "Cày Full Chiêu Trái", price: "40,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 28, name: "Cày Full Chiêu Kiếm", price: "30,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 29, name: "Cày Full Chiêu Melee", price: "30,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 30, name: "Cày 600 mas Súng", price: "60,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 31, name: "Cày 600 mas Trái", price: "60,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 32, name: "Cày 600 mas Kiếm", price: "40,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },
  { id: 33, name: "Cày 600 mas Melee", price: "40,000 đ", requirement: "lv trên 1500", category: "Boss & Mastery" },

  { id: 34, name: "Cày 5m Beli", price: "10,000 đ", requirement: "lv trên 1500 - x2 beli là 10m", category: "Beli Farming" },
  { id: 35, name: "Cày 10m Beli", price: "20,000 đ", requirement: "lv trên 1500 - x2 beli là 20m", category: "Beli Farming" },
  { id: 36, name: "Cày 50m Beli", price: "100,000 đ", requirement: "lv trên 1500 - x2 beli là 100m", category: "Beli Farming" },
  { id: 37, name: "Cày 100m Beli", price: "200,000 đ", requirement: "lv trên 1500 - x2 beli là 200m", category: "Beli Farming" },

  { id: 39, name: "Cày 500 mas Gravity", price: "50,000 đ", requirement: "lên Sea 3", category: "Gravity Quests" },
  { id: 40, name: "Nhiệm Vụ 1 Gravity", price: "15,000 đ", requirement: "full chiêu trái", category: "Gravity Quests" },
  { id: 41, name: "Nhiệm Vụ 2 Gravity", price: "20,000 đ", requirement: "đã xong NV1", category: "Gravity Quests" },
  { id: 42, name: "Nhiệm Vụ 3 Gravity", price: "30,000 đ", requirement: "xong NV2 và có sẵn 400 mas", category: "Gravity Quests" },
  { id: 43, name: "Nhiệm Vụ 4 Gravity", price: "70,000 đ", requirement: "xong 3 NV đầu và đủ 500 mas trái", category: "Gravity Quests" },
];

const accounts = [];
const allItems = [...services, ...accounts];
const categoryNames = [...new Set(allItems.map((s) => s.category))];

/* TỐI ƯU ID NÚT BẤM (FIX LỖI) */
const categoryMap = {
  "cat_items": "Items & Swords",
  "cat_apparel": "Apparel & Materials",
  "cat_belts": "Belts & Guns",
  "cat_boss": "Boss & Mastery",
  "cat_beli": "Beli Farming",
  "cat_gravity": "Gravity Quests",
  "cat_accbasic": "Account Basic",
  "cat_accpremium": "Account Premium"
};

/* =========================
   SLASH COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder().setName("menu").setDescription("Hiển thị menu shop"),
  new SlashCommandBuilder().setName("info").setDescription("Xem thông tin liên hệ"),
  new SlashCommandBuilder().setName("banggia").setDescription("Xem bảng giá nhanh"),
  new SlashCommandBuilder()
    .setName("dichvu")
    .setDescription("Xem chi tiết một dịch vụ / sản phẩm")
    .addStringOption((option) =>
      option.setName("ten").setDescription("Chọn hoặc gõ tên dịch vụ").setRequired(true).setAutocomplete(true)
    ),
  new SlashCommandBuilder().setName("support").setDescription("Mở ticket hỗ trợ"),
  new SlashCommandBuilder().setName("muacc").setDescription("Xem menu mua acc"),
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Gửi panel shop vào một kênh")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Kênh text để gửi panel").addChannelTypes(ChannelType.GuildText).setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("🔄 Đang làm mới hệ thống lệnh Slash (Vanguard Blox)...");
    const route = (GUILD_ID && GUILD_ID.trim()) 
      ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) 
      : Routes.applicationCommands(CLIENT_ID);
    await rest.put(route, { body: commands });
    console.log("✅ Đã đăng ký Slash Commands thành công!");
  } catch (err) {
    console.error("❌ Lỗi đăng ký slash commands:", err);
  }
}

/* =========================
   HELPER FUNCTIONS
========================= */
function formatItemEmbed(item) {
  return new EmbedBuilder()
    .setTitle(`🛠️ ${item.name}`)
    .setColor(0x4f8cff)
    .addFields(
      { name: "Mã gói", value: `#${item.id}`, inline: true },
      { name: "Giá", value: item.price, inline: true },
      { name: "Nhóm", value: item.category, inline: true },
      { name: "Điều kiện", value: item.requirement || "Không ghi rõ", inline: false }
    )
    .setFooter({ text: "Dùng /support để mở ticket nếu cần tư vấn thêm." });
}

function getCategoryEmbed(category) {
  const items = allItems.filter((s) => s.category === category);
  const lines = items.length
    ? items.map((s) => `**#${s.id}** • ${s.name} — **${s.price}**`).join("\n")
    : "Không có dịch vụ/sản phẩm trong nhóm này.";

  return new EmbedBuilder()
    .setTitle(`📦 ${category}`)
    .setColor(0x22c55e)
    .setDescription(lines);
}

function buildMainPanel() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cat_items").setLabel("Kiếm").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cat_apparel").setLabel("Phụ kiện").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cat_belts").setLabel("Đai & Súng").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("cat_boss").setLabel("Boss & Mas").setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cat_beli").setLabel("Beli").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("cat_gravity").setLabel("Gravity").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("open_support").setLabel("Hỗ trợ").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("open_order").setLabel("Đặt đơn").setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(`🔥 MENU DỊCH VỤ - ${SHOP_NAME}`)
    .setDescription("• Bấm nút bên dưới để xem từng nhóm dịch vụ.\n• Dùng **/dichvu** để xem một gói cụ thể.\n• Bấm **Hỗ trợ** hoặc **Đặt đơn** để mở Ticket.")
    .setColor(0x2563eb);

  return { embeds: [embed], components: [row1, row2] };
}

function buildAccountPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("cat_accbasic").setLabel("Acc basic").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("cat_accpremium").setLabel("Acc premium").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("open_support").setLabel("Hỗ trợ").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("open_order").setLabel("Đặt đơn").setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle(`🧾 MENU MUA ACC - ${SHOP_NAME}`)
    .setDescription(accounts.length ? "Bấm nút bên dưới để xem danh mục acc." : "Hiện chưa có account nào được mở bán.")
    .setColor(0xf59e0b);

  return { embeds: [embed], components: [row] };
}

function buildSupportPanel() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("open_support").setLabel("Mở ticket hỗ trợ").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("open_order").setLabel("Tạo ticket đặt đơn").setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder().setTitle(`🆘 HỖ TRỢ - ${SHOP_NAME}`).setDescription(SUPPORT_TEXT).setColor(0x22c55e);
  return { embeds: [embed], components: [row] };
}

function slugify(text) {
  return String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20);
}

/* =========================
   TÍNH NĂNG TICKET (NÂNG CẤP)
========================= */
async function createTicket(interaction, type = "support") {
  if (!interaction.guild) return interaction.reply({ content: "Lệnh này chỉ dùng trong server.", ephemeral: true });

  const guild = interaction.guild;
  const member = interaction.member;
  const namePrefix = type === "order" ? "don" : "hotro";
  const channelName = `${namePrefix}-${slugify(member.user.username)}`;

  try {
    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.EmbedLinks] },
    ];

    if (SUPPORT_ROLE_ID && SUPPORT_ROLE_ID.trim()) {
      overwrites.push({ id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] });
    }

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID && TICKET_CATEGORY_ID.trim() ? TICKET_CATEGORY_ID : null,
      topic: `${type.toUpperCase()} | ${member.user.tag} (${member.user.id})`,
      permissionOverwrites: overwrites,
    });

    const embed = new EmbedBuilder()
      .setTitle(type === "order" ? "🧾 Ticket đặt đơn" : "🆘 Ticket hỗ trợ")
      .setDescription(type === "order" ? "Vui lòng gửi tên dịch vụ, mức level hiện tại và yêu cầu của bạn.\nStaff sẽ phản hồi trong giây lát!" : SUPPORT_TEXT)
      .setColor(type === "order" ? 0xf59e0b : 0x22c55e);

    // TÍNH NĂNG MỚI: Thêm nút Nhận Đơn
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_claim").setLabel("🙋‍♂️ Nhận đơn (Staff)").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Đóng & Lưu lịch sử").setStyle(ButtonStyle.Danger)
    );

    // TÍNH NĂNG MỚI: Ping role Staff khi tạo ticket
    const pingText = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : "";
    await channel.send({ content: `Xin chào ${member}! ${pingText}`, embeds: [embed], components: [row] });

    if (LOG_CHANNEL_ID && LOG_CHANNEL_ID.trim()) {
      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel?.isTextBased()) await logChannel.send(`📌 Vừa có ${type === "order" ? "đơn mới" : "yêu cầu hỗ trợ"}: ${channel} từ ${member.user.tag}`);
    }

    return interaction.reply({ content: `✅ Đã tạo ticket thành công tại: ${channel}`, ephemeral: true });
  } catch (err) {
    console.error(err);
    return interaction.reply({ content: "❌ Không tạo được ticket. Hãy kiểm tra quyền của Bot.", ephemeral: true });
  }
}

/* =========================
   EVENTS XỬ LÝ
========================= */
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot đã online: ${c.user.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused().toLowerCase();
      const matches = allItems
        .filter((s) => s.name.toLowerCase().includes(focused) || String(s.id).includes(focused) || s.category.toLowerCase().includes(focused))
        .slice(0, 25)
        .map((s) => ({ name: `#${s.id} ${s.name}`, value: s.name }));
      return interaction.respond(matches);
    }

    if (interaction.isButton()) {
      const id = interaction.customId;

      // Xử lý nút Danh mục (Đã FIX lỗi khoảng trắng)
      if (categoryMap[id]) {
        return interaction.reply({ embeds: [getCategoryEmbed(categoryMap[id])], ephemeral: true });
      }

      if (id === "open_support") return createTicket(interaction, "support");
      if (id === "open_order") return createTicket(interaction, "order");

      // TÍNH NĂNG MỚI: Xử lý nút Nhận đơn
      if (id === "ticket_claim") {
        if (SUPPORT_ROLE_ID && !interaction.member.roles.cache.has(SUPPORT_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
          return interaction.reply({ content: "❌ Chỉ Staff mới có thể nhận đơn!", ephemeral: true });
        }
        return interaction.reply({ content: `✅ <@${interaction.user.id}> đã tiếp nhận hỗ trợ đơn này! Các bạn Staff khác vui lòng lưu ý.` });
      }

      // TÍNH NĂNG MỚI: Xử lý Đóng Ticket & Lưu lịch sử
      if (id === "ticket_close") {
        if (!interaction.channel?.deletable) return interaction.reply({ content: "Mình không có quyền xóa kênh này.", ephemeral: true });

        await interaction.reply({ content: "⏳ Đang trích xuất lịch sử trò chuyện và đóng ticket sau 5 giây..." });

        try {
          // Lấy 100 tin nhắn gần nhất để làm file log
          const messages = await interaction.channel.messages.fetch({ limit: 100 });
          const logContent = messages.reverse().map(m => `[${m.createdAt.toLocaleString('vi-VN')}] ${m.author.tag}: ${m.content}`).join('\n');
          const attachment = new AttachmentBuilder(Buffer.from(logContent, 'utf-8'), { name: `Lich-su-${interaction.channel.name}.txt` });

          // Gửi file log về kênh LOG
          if (LOG_CHANNEL_ID) {
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
              await logChannel.send({
                content: `📁 **Lịch sử Ticket:** \`${interaction.channel.name}\`\nĐóng bởi: <@${interaction.user.id}>`,
                files: [attachment]
              });
            }
          }
        } catch (e) {
          console.error("Lỗi khi lưu lịch sử: ", e);
        }

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "menu") return interaction.reply(buildMainPanel());
    if (interaction.commandName === "muacc") return interaction.reply(buildAccountPanel());
    if (interaction.commandName === "support") return interaction.reply(buildSupportPanel());
    if (interaction.commandName === "info") {
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle("📩 Thông tin liên hệ").setDescription(`**Shop:** ${SHOP_NAME}\n• Dùng /support để mở ticket nhanh.`).setColor(0xf59e0b)],
        ephemeral: true,
      });
    }
    if (interaction.commandName === "banggia") {
      const text = categoryNames.map((cat) => `**${cat}**: ${allItems.filter((s) => s.category === cat).length} gói`).join("\n");
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle("📊 BẢNG GIÁ / DANH MỤC").setDescription(text || "Chưa có dữ liệu.").setColor(0xa855f7)], ephemeral: true });
    }
    if (interaction.commandName === "dichvu") {
      const selected = interaction.options.getString("ten");
      const item = allItems.find((s) => s.name === selected || `${s.id} ${s.name}` === selected);
      if (!item) return interaction.reply({ content: "Không tìm thấy dịch vụ/sản phẩm này.", ephemeral: true });
      return interaction.reply({ embeds: [formatItemEmbed(item)], ephemeral: true });
    }
    if (interaction.commandName === "setup") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Bạn không có quyền dùng lệnh này.", ephemeral: true });
      const channel = interaction.options.getChannel("channel", true);
      if (!channel.isTextBased()) return interaction.reply({ content: "Kênh phải là kênh text.", ephemeral: true });
      
      await channel.send(buildMainPanel());
      return interaction.reply({ content: `✅ Đã gửi panel vào ${channel}.`, ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) return interaction.followUp({ content: "Đã xảy ra lỗi khi xử lý lệnh.", ephemeral: true });
    return interaction.reply({ content: "Đã xảy ra lỗi khi xử lý lệnh.", ephemeral: true });
  }
});

client.login(TOKEN);
