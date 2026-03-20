require("dotenv").config();
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
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // để trống nếu muốn đăng ký global

if (!TOKEN || !CLIENT_ID) {
  console.error("Thiếu TOKEN hoặc CLIENT_ID trong file .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

/**
 * Danh sách dịch vụ lấy từ file bạn gửi.
 * Giữ nguyên tên, giá và điều kiện.
 */
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

const categoryNames = [...new Set(services.map((s) => s.category))];

const commands = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Hiển thị menu dịch vụ"),

  new SlashCommandBuilder()
    .setName("info")
    .setDescription("Xem thông tin liên hệ"),

  new SlashCommandBuilder()
    .setName("banggia")
    .setDescription("Xem bảng giá nhanh"),

  new SlashCommandBuilder()
    .setName("dichvu")
    .setDescription("Xem chi tiết một dịch vụ")
    .addStringOption((option) =>
      option
        .setName("ten")
        .setDescription("Chọn hoặc gõ tên dịch vụ")
        .setRequired(true)
        .setAutocomplete(true)
    ),
].map((cmd) => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log("Đã đăng ký slash commands cho guild.");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log("Đã đăng ký slash commands global.");
    }
  } catch (err) {
    console.error("Lỗi đăng ký slash commands:", err);
  }
}

function formatServiceEmbed(service) {
  return new EmbedBuilder()
    .setTitle(`🛠️ ${service.name}`)
    .setColor(0x4f8cff)
    .addFields(
      { name: "Mã gói", value: `#${service.id}`, inline: true },
      { name: "Giá", value: service.price, inline: true },
      { name: "Nhóm", value: service.category, inline: true },
      { name: "Điều kiện", value: service.requirement, inline: false }
    )
    .setFooter({ text: "Các mục cày chiêu/mastery yêu cầu khách tự đổi qua vật phẩm muốn cày trước khi đặt đơn." });
}

function getCategoryEmbed(category) {
  const items = services.filter((s) => s.category === category);
  const lines = items.map((s) => `**#${s.id}** • ${s.name} — **${s.price}**`).join("\n");

  return new EmbedBuilder()
    .setTitle(`📦 ${category}`)
    .setColor(0x22c55e)
    .setDescription(lines || "Không có dịch vụ trong nhóm này.");
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot đã online: ${c.user.tag}`);
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused().toLowerCase();
      const matches = services
        .filter(
          (s) =>
            s.name.toLowerCase().includes(focused) ||
            String(s.id).includes(focused) ||
            s.category.toLowerCase().includes(focused)
        )
        .slice(0, 25)
        .map((s) => ({
          name: `#${s.id} ${s.name}`,
          value: s.name,
        }));

      return interaction.respond(matches);
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "menu") {
      const embed = new EmbedBuilder()
        .setTitle("🔥 MENU DỊCH VỤ BLOX FRUITS")
        .setDescription(
          [
            "• Dùng **/dichvu** để xem từng gói dịch vụ.",
            "• Dùng **/banggia** để xem nhanh bảng giá.",
            "• Dùng **/info** để xem thông tin liên hệ.",
          ].join("\n")
        )
        .setColor(0x2563eb);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("cat_Items & Swords")
          .setLabel("Kiếm")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("cat_Apparel & Materials")
          .setLabel("Phụ kiện")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cat_Belts & Guns")
          .setLabel("Đai & Súng")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cat_Boss & Mastery")
          .setLabel("Boss & Mas")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
      });
    }

    if (interaction.commandName === "info") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📩 Thông tin liên hệ")
            .setDescription("Bạn thay phần này bằng ID admin, link Discord hoặc kênh liên hệ của shop.")
            .setColor(0xf59e0b),
        ],
        ephemeral: true,
      });
    }

    if (interaction.commandName === "banggia") {
      const text = categoryNames
        .map((cat) => {
          const count = services.filter((s) => s.category === cat).length;
          return `**${cat}**: ${count} gói`;
        })
        .join("\n");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📊 BẢNG GIÁ / DANH MỤC")
            .setDescription(text)
            .setColor(0xa855f7),
        ],
        ephemeral: true,
      });
    }

    if (interaction.commandName === "dichvu") {
      const selected = interaction.options.getString("ten");
      const service = services.find(
        (s) => s.name === selected || `${s.id} ${s.name}` === selected
      );

      if (!service) {
        return interaction.reply({
          content: "Không tìm thấy dịch vụ này.",
          ephemeral: true,
        });
      }

      return interaction.reply({
        embeds: [formatServiceEmbed(service)],
        ephemeral: true,
      });
    }
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({
        content: "Đã xảy ra lỗi khi xử lý lệnh.",
        ephemeral: true,
      });
    }
    return interaction.reply({
      content: "Đã xảy ra lỗi khi xử lý lệnh.",
      ephemeral: true,
    });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  if (customId.startsWith("cat_")) {
    const category = customId.replace("cat_", "");
    const embed = getCategoryEmbed(category);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(TOKEN);
