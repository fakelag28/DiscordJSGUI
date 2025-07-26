const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const { Client, GatewayIntentBits, Partials, ChannelType, PermissionsBitField } = require('discord.js');

const axios = require('axios');

const isDev = process.env.NODE_ENV !== 'production';

let client;
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        icon: path.join(__dirname, 'dist/icon.ico')
    });
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (client) client.destroy();
    if (process.platform !== 'darwin') app.quit();
});

function sendToRenderer(payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ws-message', JSON.stringify(payload));
    }
}


ipcMain.on('ws-auth', (event, token) => {
    if (client) client.destroy();
    
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ],
        partials: [Partials.Channel],
    });

    client.once('ready', () => {
        sendToRenderer({ 
            type: 'ready', 
            user: {
                id: client.user.id,
                name: client.user.username,
                discriminator: client.user.discriminator,
                avatar: client.user.displayAvatarURL(),
            }
        });
        sendToRenderer({ status: 'ok', msg: 'Бот успешно запущен!' });
    });

    client.on('messageCreate', (message) => {});

    client.login(token).catch(err => {
        sendToRenderer({ status: 'error', msg: `Ошибка входа: ${err.message}` });
    });
});

ipcMain.handle('get-data-url', async (event, url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        const mimeType = response.headers['content-type'];
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error(`Failed to fetch data URL for ${url}:`, error.message);
        return null;
    }
});

ipcMain.handle('clipboard-write', (event, text) => {
    clipboard.writeText(text);
});

ipcMain.on('get_guilds', async () => {
    if (!client || !client.isReady()) return;
    const guilds = client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL({ dynamic: true })
    }));
    sendToRenderer({ type: 'guilds', guilds });
});

ipcMain.on('get_channels', async (event, guildId) => {
    if (!client || !client.isReady()) return;
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    const categories = [];
    const channelsWithoutCategory = [];

    guild.channels.cache.forEach(channel => {
        if (channel.type === ChannelType.GuildText) {
            if (channel.parentId) {
                let category = categories.find(c => c.id === channel.parentId);
                if (!category) {
                    const parentChannel = guild.channels.cache.get(channel.parentId);
                    category = {
                        id: channel.parentId,
                        name: parentChannel ? parentChannel.name : 'Неизвестная категория',
                        channels: []
                    };
                    categories.push(category);
                }
                category.channels.push({ id: channel.id, name: channel.name });
            } else {
                channelsWithoutCategory.push({ id: channel.id, name: channel.name });
            }
        }
    });

    if (channelsWithoutCategory.length > 0) {
        categories.unshift({ id: 'none', name: 'Без категории', channels: channelsWithoutCategory });
    }
    
    categories.forEach(cat => cat.channels.sort((a,b) => a.name.localeCompare(b.name)));
    categories.sort((a,b) => a.name.localeCompare(b.name));

    sendToRenderer({ type: 'channels', categories });
});

ipcMain.on('get_messages', async (event, channelId, options) => {
    try {
        if (!client || !client.isReady()) throw new Error('Бот не готов');
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) throw new Error('Канал не найден');

        const messages = await channel.messages.fetch(options);
        
        sendToRenderer({
            type: 'messages',
            messages: messages.map(m => ({
                id: m.id,
                content: m.content,
                author: m.author.username,
                author_id: m.author.id,
                is_bot: m.author.bot,
                created_at: m.createdAt.toISOString(),
                attachments: m.attachments.map(a => a.url),
                embeds: m.embeds
            })).reverse(),
            is_prepend: !!options.before
        });

    } catch (error) {
        console.error('Ошибка получения сообщений:', error);
        sendToRenderer({ 
            type: 'messages_error', 
            error: error.message || 'Неизвестная ошибка' 
        });
    }
});

ipcMain.on('send_message', async (event, channelId, content) => {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    await channel.send(content);
    sendToRenderer({ type: 'sent' });
});

ipcMain.on('delete_message', async (event, channelId, messageId) => {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return sendToRenderer({ type: 'deleted', ok: false, error: 'Канал не найден' });
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return sendToRenderer({ type: 'deleted', ok: false, error: 'Сообщение не найдено' });

    try {
        await message.delete();
        sendToRenderer({ type: 'deleted', ok: true });
    } catch (error) {
        sendToRenderer({ type: 'deleted', ok: false, error: error.message });
    }
});

ipcMain.on('pin_message', async (event, channelId, messageId) => {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return sendToRenderer({ type: 'pinned', ok: false, error: 'Канал не найден' });
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) return sendToRenderer({ type: 'pinned', ok: false, error: 'Сообщение не найдено' });

    try {
        await message.pin();
        sendToRenderer({ type: 'pinned', ok: true });
    } catch (error) {
        sendToRenderer({ type: 'pinned', ok: false, error: error.message });
    }
});

ipcMain.on('get_guild_invite', async (event, guildId) => {
    try {
        if (!client || !client.isReady()) throw new Error('Бот не готов');
        
        const guild = await client.guilds.fetch(guildId);
        if (!guild) throw new Error('Сервер не найден');
        
        const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has('CreateInstantInvite'));
        if (!channel) throw new Error('Нет подходящего канала или прав для создания инвайта');

        const invite = await channel.createInvite({ maxAge: 86400, maxUses: 1 });
        sendToRenderer({ type: 'guild_invite', invite: invite.url });

    } catch (error) {
        console.error('Ошибка создания инвайта:', error);
        sendToRenderer({ type: 'guild_invite', error: error.message || 'Неизвестная ошибка' });
    }
});

ipcMain.on('get_guild_permissions', async (event, guildId) => {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild || !guild.members.me) return sendToRenderer({ type: 'guild_permissions', error: 'Не удалось получить данные о боте на сервере' });
    
    const permissions = guild.members.me.permissions.serialize();
    sendToRenderer({ type: 'guild_permissions', guild_id: guildId, permissions });
});

ipcMain.on('ws-disconnect', () => {
    if (client) {
        client.destroy();
        client = null;
    }
});