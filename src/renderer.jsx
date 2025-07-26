import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CssBaseline, ThemeProvider, createTheme, Box, Typography, TextField, Button, Paper, CircularProgress, List, ListItem, ListItemButton,
  ListItemText, Avatar, Divider, IconButton, InputAdornment, Tooltip, Menu, MenuItem, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MailIcon from '@mui/icons-material/Mail';
const { ipcSend, ipcOn, ipcRemoveAllListeners, fetchDataUrl } = window.electronAPI;

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#23272a',
      paper: '#2c2f33',
    },
    primary: {
      main: '#5865f2',
    },
    secondary: {
      main: '#7289da',
    },
    text: {
      primary: '#fff',
      secondary: '#b9bbbe',
    },
    scrollbar: {
      track: '#23272a',
      thumb: '#36393f',
    },
  },
  typography: {
    fontFamily: 'Segoe UI, sans-serif',
  },
});

const scrollbarStyle = {
  '&::-webkit-scrollbar': { width: 8, background: '#23272a' },
  '&::-webkit-scrollbar-thumb': { background: '#36393f', borderRadius: 4 },
  scrollbarColor: '#36393f #23272a',
};

function AuthScreen({ onAuth, loading, error }) {
  const [token, setToken] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      onAuth('', 'Введите токен');
      return;
    }
    onAuth(token.trim());
  };
  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#23272a' }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 340, bgcolor: '#2c2f33' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Авторизация</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Токен Discord-бота"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mb: 2 }}
            InputLabelProps={{ style: { color: '#b9bbbe' } }}
            InputProps={{ style: { color: '#fff', background: '#23272a' } }}
            disabled={loading}
          />
          {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Войти'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

function GuildAvatar({ url, name, size = 56 }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    let active = true;
    setDataUrl(null);
    if (url) {
      fetchDataUrl(url)
        .then(d => { if (active) setDataUrl(d); })
        .catch(console.error);
    }
    return () => { active = false; };
  }, [url]);

  if (!url) {
    return <Avatar sx={{ width: size, height: size, bgcolor: '#5865f2', fontWeight: 700, fontSize: size > 40 ? '1.25rem' : '0.8rem' }}>{name ? name[0] : '?'}</Avatar>;
  }
  if (!dataUrl) {
    return <Avatar sx={{ width: size, height: size, bgcolor: '#2c2f33' }}><CircularProgress size={24} /></Avatar>;
  }
  return <Avatar src={dataUrl} sx={{ width: size, height: size }} />;
}

function SecureImage({ url, style }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    let active = true;
    setDataUrl(null);
    if (url) {
      fetchDataUrl(url)
        .then(d => { if (active) setDataUrl(d); })
        .catch(console.error);
    }
    return () => { active = false; };
  }, [url]);

  if (!dataUrl) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...style, bgcolor: 'rgba(0,0,0,0.2)' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  return <img src={dataUrl} style={style} alt="attachment" />;
}

function Embed({ embed }) {
  const defaultStyle = { maxWidth: 432, mt: 1, mb: 1 };
  const embedColor = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#202225';
  
  return (
    <Paper elevation={1} sx={{ ...defaultStyle, borderLeft: `4px solid ${embedColor}`, bgcolor: '#2f3136', p: 2, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 2 }}>
      <Box>
        {embed.author && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {embed.author.icon_url && <SecureImage url={embed.author.icon_url} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 1 }} />}
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{embed.author.name}</Typography>
          </Box>
        )}
        {embed.title && <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>{embed.title}</Typography>}
        {embed.description && <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1 }}>{embed.description}</Typography>}
        {embed.fields && (
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${embed.fields.some(f => f.inline) ? 'auto-fit' : 1}, minmax(150px, 1fr))`, gap: 1, mb: 1 }}>
            {embed.fields.map((field, i) => (
              <Box key={i} sx={{ gridColumn: field.inline ? 'span 1' : '1 / -1' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{field.name}</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{field.value}</Typography>
              </Box>
            ))}
          </Box>
        )}
        {embed.footer && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {embed.footer.icon_url && <SecureImage url={embed.footer.icon_url} style={{ width: 20, height: 20, borderRadius: '50%', marginRight: 1 }} />}
            <Typography variant="caption">{embed.footer.text}{embed.timestamp ? ` • ${new Date(embed.timestamp).toLocaleString()}` : ''}</Typography>
          </Box>
        )}
      </Box>
      
      {embed.thumbnail && (
        <SecureImage url={embed.thumbnail.url} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, justifySelf: 'start', alignSelf: 'start' }} />
      )}
      
      {embed.image && (
        <SecureImage url={embed.image.url} style={{ maxWidth: '100%', borderRadius: 4, gridColumn: '1 / -1', marginTop: 1 }} />
      )}
    </Paper>
  );
}


function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [status, setStatus] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [msgInput, setMsgInput] = useState('');
  const [catOpen, setCatOpen] = useState({});
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuMsg, setMenuMsg] = useState(null);
  const chatRef = useRef(null);
  const justFinishedLoadingMore = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [guildMenuAnchor, setGuildMenuAnchor] = useState(null);
  const [guildMenuGuild, setGuildMenuGuild] = useState(null);
  const [channelMenu, setChannelMenu] = useState({ anchor: null, channel: null });
  const [categoryMenu, setCategoryMenu] = useState({ anchor: null, category: null });
  const [botUser, setBotUser] = useState(null);
  const [messageLimit, setMessageLimit] = useState(50);
  const [botUserMenuAnchor, setBotUserMenuAnchor] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [permissionsModal, setPermissionsModal] = useState({ open: false, guildName: '', granted: [], denied: [] });

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    ipcRemoveAllListeners('ws-message');
    ipcRemoveAllListeners('ws-error');
    ipcRemoveAllListeners('ws-close');
    ipcOn('ws-message', (event, data) => {
      console.log('[DEBUG] Получено от main.js:', data);
      console.log('[DEBUG] Тип данных:', typeof data);
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'msg_link') {
          window.electronAPI.clipboardWriteText(msg.link);
          showNotification('Ссылка на сообщение скопирована!', 'success');
        } else if (msg.type === 'guild_invite') {
          if (msg.invite) {
            window.electronAPI.clipboardWriteText(msg.invite);
            showNotification('Ссылка-приглашение скопирована!', 'success');
          } else {
            showNotification('Ошибка создания инвайта: ' + (msg.error || 'Не удалось создать приглашение'), 'error');
          }
        } else if (msg.type === 'pinned') {
          if (msg.ok) showNotification('Сообщение закреплено!', 'success');
          else showNotification('Ошибка закрепления: ' + (msg.error || 'Нет прав'), 'error');
        } else if (msg.type === 'deleted') {
          if (msg.ok) showNotification('Сообщение удалено!', 'success');
          else showNotification('Ошибка удаления: ' + (msg.error || 'Нет прав'), 'error');
        } else if (msg.status === 'ok') {
          setStatus('Бот успешно запущен!');
          ipcSend('get_guilds');
        } else if (msg.type === 'guilds') {
          setGuilds(msg.guilds);
        } else if (msg.type === 'channels') {
          setCategories(msg.categories || []);
          const openState = {};
          (msg.categories || []).forEach(cat => { openState[cat.id || 'none'] = false; });
          setCatOpen(openState);
        } else if (msg.type === 'messages') {
          if (msg.is_prepend) {
            if (msg.messages.length > 0) {
              const oldScrollHeight = chatRef.current.scrollHeight;
              const oldScrollTop = chatRef.current.scrollTop;
              
              setMessages(prev => [...msg.messages, ...prev]);
              
              setTimeout(() => {
                if (chatRef.current) {
                  chatRef.current.scrollTop = chatRef.current.scrollHeight - oldScrollHeight + oldScrollTop;
                }
              }, 0);
              
            } else {
              showNotification('Больше нет сообщений для загрузки', 'info');
              setHasMoreMessages(false);
            }
          } else {
            setMessages(msg.messages);
            setHasMoreMessages(msg.messages.length >= 50);
            setTimeout(() => {
                if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
            }, 0);
          }
          setIsLoadingMore(false);
        } else if (msg.type === 'messages_error') {
            showNotification(`Ошибка загрузки сообщений: ${msg.error}`, 'error');
            setIsLoadingMore(false);
        } else if (msg.type === 'sent') {
          ipcSend('get_messages', selectedChannel, 50);
        } else if (msg.type === 'ready') {
          setBotUser(msg.user);
        } else if (msg.type === 'guild_permissions') {
          const guild = guilds.find(g => g.id === msg.guild_id);
          if (guild) {
            const granted = [];
            const denied = [];
            for (const [perm, value] of Object.entries(msg.permissions)) {
              if (value) granted.push(perm);
              else denied.push(perm);
            }
            console.log('[DEBUG] Получены права:', msg);
            setPermissionsModal({ open: true, guildName: guild.name, granted, denied });
          }
        } else if (msg.status && msg.status !== 'ok') {
          showNotification(msg.msg || 'Ошибка', 'error');
        }
      } catch (e) {
        showNotification('Ошибка соединения с ботом', 'error');
      }
      setLoading(false);
    });
    ipcOn('ws-error', (event, err) => {
      showNotification('Ошибка WebSocket: ' + err, 'error');
      setLoading(false);
    });
    ipcOn('ws-close', () => {
      showNotification('WebSocket закрыт', 'warning');
      setLoading(false);
    });
  }, [guilds, selectedChannel, messageLimit]);

  useLayoutEffect(() => {
    const chatEl = chatRef.current;
    if (chatEl) {
      if (justFinishedLoadingMore.current) {
        justFinishedLoadingMore.current = false;
        chatEl.scrollTop = 0;
      } else {
        chatEl.scrollTop = chatEl.scrollHeight;
      }
    }
  }, [messages]);

  const handleAuth = (tok, err) => {
    if (err) {
      showNotification(err, 'error');
      return;
    }
    setLoading(true);
    showNotification('Авторизация успешна!', 'info');
    setToken(tok);
    ipcSend('ws-auth', tok);
  };

  const handleSelectGuild = (guild) => {
    setSelectedGuild(guild.id);
    setCategories([]);
    setMessages([]);
    setSelectedChannel(null);
    ipcSend('get_channels', guild.id);
  };

  const handleSelectChannel = (channel) => {
      setSelectedChannel(channel.id);
      setMessages([]);
      setHasMoreMessages(true);
      setIsLoadingMore(false);
      ipcSend('get_messages', channel.id, { limit: 50 });
  };

  const handleSendMessage = () => {
    if (msgInput.trim() && selectedChannel) {
      ipcSend('send_message', selectedChannel, msgInput.trim());
      setMsgInput('');
    }
  };

  const handleCategoryToggle = (catId) => {
    setCatOpen(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleMsgMenu = (event, msg) => {
    event.preventDefault();
    setMenuAnchor(event.currentTarget);
    setMenuMsg(msg);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuMsg(null);
  };

  const handleCopy = (type) => {
    if (!menuMsg) return;
    if (type === 'text') window.electronAPI.clipboardWriteText(menuMsg.content);
    if (type === 'msgid') window.electronAPI.clipboardWriteText(menuMsg.id);
    if (type === 'userid') window.electronAPI.clipboardWriteText(menuMsg.author_id);
    if (type === 'link') {
      if (selectedGuild && selectedChannel && menuMsg.id) {
        const link = `https://discord.com/channels/${selectedGuild}/${selectedChannel}/${menuMsg.id}`;
        window.electronAPI.clipboardWriteText(link);
        showNotification('Ссылка на сообщение скопирована!', 'success');
      }
    }
    handleMenuClose();
  };

  const handlePin = () => {
    if (!menuMsg) return;
    setConfirmText('Закрепить это сообщение?');
    setConfirmAction(() => () => {
      ipcSend('pin_message', selectedChannel, menuMsg.id);
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (!menuMsg) return;
    setConfirmText('Удалить это сообщение?');
    setConfirmAction(() => () => {
      ipcSend('delete_message', selectedChannel, menuMsg.id);
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
    handleMenuClose();
  };

  const handleGuildMenu = (event, guild) => {
    event.preventDefault();
    setGuildMenuAnchor(event.currentTarget);
    setGuildMenuGuild(guild);
  };

  const handleGuildMenuClose = () => {
    setGuildMenuAnchor(null);
    setGuildMenuGuild(null);
  };

  const handleGuildCopy = (type) => {
    if (!guildMenuGuild) return;
    if (type === 'id') window.electronAPI.clipboardWriteText(guildMenuGuild.id);
    if (type === 'link') window.electronAPI.clipboardWriteText(`https://discord.com/channels/${guildMenuGuild.id}`);
    if (type === 'invite') {
      setConfirmText('Создать и скопировать ссылку-приглашение?');
      setConfirmAction(() => () => {
        ipcSend('get_guild_invite', guildMenuGuild.id);
        setConfirmOpen(false);
      });
      setConfirmOpen(true);
    }
    handleGuildMenuClose();
  };

  const handleCheckPermissions = () => {
    if (!guildMenuGuild) return;
    console.log(`[DEBUG] Запрос прав для сервера: ${guildMenuGuild.id}`);
    ipcSend('get_guild_permissions', guildMenuGuild.id);
    handleGuildMenuClose();
  };

  const handleChannelMenu = (event, channel) => {
    event.preventDefault();
    setChannelMenu({ anchor: event.currentTarget, channel });
  };
  const handleCategoryMenu = (event, category) => {
    event.preventDefault();
    setCategoryMenu({ anchor: event.currentTarget, category });
  };
  const handleChannelMenuClose = () => setChannelMenu({ anchor: null, channel: null });
  const handleCategoryMenuClose = () => setCategoryMenu({ anchor: null, category: null });

  const handleChannelCopy = (type) => {
    const { channel } = channelMenu;
    if (!channel) return;
    if (type === 'id') window.electronAPI.clipboardWriteText(channel.id);
    if (type === 'name') window.electronAPI.clipboardWriteText(channel.name);
    if (type === 'link') window.electronAPI.clipboardWriteText(`https://discord.com/channels/${selectedGuild}/${channel.id}`);
    showNotification('Скопировано!', 'success');
    handleChannelMenuClose();
  };
  const handleCategoryCopy = (type) => {
    const { category } = categoryMenu;
    if (!category) return;
    if (type === 'id') window.electronAPI.clipboardWriteText(category.id);
    if (type === 'name') window.electronAPI.clipboardWriteText(category.name);
    showNotification('Скопировано!', 'success');
    handleCategoryMenuClose();
  };

  const handleBotUserMenuOpen = (event) => {
    setBotUserMenuAnchor(event.currentTarget);
  };

  const handleBotUserMenuClose = () => {
    setBotUserMenuAnchor(null);
  };

  const handleBotUserCopy = (type) => {
      if (!botUser) return;
      let textToCopy = '';
      if (type === 'id') textToCopy = botUser.id;
      if (type === 'name') textToCopy = botUser.name;
      if (type === 'discriminator') textToCopy = botUser.discriminator;

      if (textToCopy) {
          window.electronAPI.clipboardWriteText(textToCopy);
          showNotification('Скопировано!', 'success');
      }
      
      handleBotUserMenuClose();
  };
  
  const handleLogout = () => {
    setLogoutConfirmOpen(false);
    setToken(null);
    setLoading(false);
    setStatus('');
    setGuilds([]);
    setCategories([]);
    setMessages([]);
    setSelectedGuild(null);
    setSelectedChannel(null);
    setBotUser(null);
    setMessageLimit(50);
    ipcSend('ws-disconnect');
  };

  const handleReload = () => {
    ipcSend('get_guilds');
    setCategories([]);
    setMessages([]);
    setSelectedGuild(null);
    setSelectedChannel(null);
    showNotification('Список серверов обновлен!', 'success');
  };

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthScreen onAuth={handleAuth} loading={loading} error={notification.message} />
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden'
      }}>

        <Box sx={{ width: 80, bgcolor: '#202225', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1, flexShrink: 0 }}>
            <Tooltip title="Обновить список серверов" placement="right">
              <IconButton onClick={handleReload}><RefreshIcon /></IconButton>
            </Tooltip>
          </Box>
          <Divider sx={{ bgcolor: '#36393f', width: '50%', alignSelf: 'center' }} />
          <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, ...scrollbarStyle }}>
            {guilds.map(g => (
              <Tooltip key={g.id} title={g.name} placement="right">
                <IconButton
                  onClick={() => handleSelectGuild(g)}
                  onContextMenu={e => handleGuildMenu(e, g)}
                  sx={{ mb: 1, p: 0, position: 'relative', '&::before': { content: '""', position: 'absolute', left: -8, top: '50%', transform: selectedGuild === g.id ? 'translateY(-50%) scaleY(1)' : 'translateY(-50%) scaleY(0)', transformOrigin: 'center', height: '40px', width: '4px', bgcolor: '#fff', borderRadius: '0 4px 4px 0', transition: 'transform 0.2s' } }}
                >
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                    }}
                  >
                    <GuildAvatar url={g.icon} name={g.name} size={48} />
                  </Avatar>
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Box sx={{ width: 220, bgcolor: '#2c2f33', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <Box sx={{ px: 2, pt: 2, flexShrink: 0 }}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {guilds.find(g => g.id === selectedGuild)?.name || 'Каналы'}
            </Typography>
            <Divider sx={{ bgcolor: '#36393f', my: 1 }} />
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', ...scrollbarStyle }}>
            {categories.map(cat => (
              <Box key={cat.id || 'none'}>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', px: 2, py: 0.5 }} onClick={() => handleCategoryToggle(cat.id || 'none')} onContextMenu={e => handleCategoryMenu(e, cat)}>
                  <Typography sx={{ color: '#b9bbbe', fontWeight: 600, fontSize: 13, flex: 1 }}>{cat.name}</Typography>
                  {catOpen[cat.id || 'none'] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </Box>
                <Collapse in={catOpen[cat.id || 'none']} timeout="auto" unmountOnExit>
                  <List dense sx={{ pl: 1 }}>
                    {cat.channels.map(c => (
                      <ListItem key={c.id} disablePadding onContextMenu={e => handleChannelMenu(e, c)}>
                        <ListItemButton selected={selectedChannel === c.id} onClick={() => handleSelectChannel(c)}>
                          <ListItemText primary={`# ${c.name}`} primaryTypographyProps={{ color: '#b9bbbe', fontWeight: 500 }} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
          </Box>
          {botUser && (
            <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: '#292b2f', borderTop: '1px solid #1a1b1e', cursor: 'pointer', '&:hover': { bgcolor: '#32353b' } }} onClick={handleBotUserMenuOpen}>
              <GuildAvatar url={botUser.avatar} name={botUser.name} size={32} />
              <Box sx={{ ml: 1, overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {botUser.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b9bbbe' }}>
                  #{botUser.discriminator}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, bgcolor: '#36393f', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
          <Box ref={chatRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, ...scrollbarStyle }}>
            {selectedChannel && hasMoreMessages && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button variant="outlined" size="small" onClick={() => {
                      if (isLoadingMore || messages.length === 0) return;

                      setIsLoadingMore(true);
                      
                      const oldestMessageId = messages[0].id;
                      
                      const fetchOptions = {
                          limit: 100,
                          before: oldestMessageId
                      };

                      ipcSend('get_messages', selectedChannel, fetchOptions);
                  }} disabled={isLoadingMore}>
                  {isLoadingMore ? <CircularProgress size={18} /> : `Загрузить ещё...`}
                </Button>
              </Box>
            )}
            {messages.map(m => (
              <Paper key={m.id} className="message-paper" sx={{ mb: 2, p: 2, bgcolor: m.is_bot ? '#5865f2' : '#2c2f33', cursor: 'context-menu' }} onContextMenu={e => handleMsgMenu(e, m)}>
                <Typography sx={{ fontWeight: 700, color: '#fff' }}>{m.author}</Typography>
                <Typography sx={{ 
                    color: '#dcddde', 
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word'
                }}>
                    {m.content}
                </Typography>
                {m.attachments && m.attachments.map((url, i) => <SecureImage key={i} url={url} style={{ maxWidth: 350, maxHeight: 350, marginTop: 8, borderRadius: 8 }} />)}
                {m.embeds && m.embeds.map((embed, i) => <Embed key={i} embed={embed} />)}
                <Typography sx={{ color: '#b9bbbe', fontSize: 12, mt: 1 }}>{new Date(m.created_at).toLocaleString()}</Typography>
              </Paper>
            ))}
          </Box>
          <Box sx={{ p: 2, bgcolor: '#23272a', display: 'flex', alignItems: 'center' }}>
            <TextField
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Введите сообщение..."
              fullWidth
              size="small"
              sx={{ bgcolor: '#36393f', borderRadius: 2, input: { color: '#fff' } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSendMessage} color="primary">
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={handleMenuClose} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <MenuItem onClick={() => handleCopy('text')}>Скопировать текст сообщения</MenuItem>
        <MenuItem onClick={() => handleCopy('msgid')}>Скопировать Discord ID сообщения</MenuItem>
        <MenuItem onClick={() => handleCopy('userid')}>Скопировать Discord ID пользователя</MenuItem>
        <MenuItem onClick={() => handleCopy('link')}>Скопировать ссылку на сообщение</MenuItem>
        <MenuItem onClick={handlePin}>Закрепить сообщение</MenuItem>
        <MenuItem onClick={handleDelete}>Удалить сообщение</MenuItem>
      </Menu>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Подтверждение</DialogTitle>
        <DialogContent>{confirmText}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button onClick={() => { if (confirmAction) confirmAction(); }} color="primary">ОК</Button>
        </DialogActions>
      </Dialog>
      <Menu anchorEl={guildMenuAnchor} open={!!guildMenuAnchor} onClose={handleGuildMenuClose}>
        <MenuItem onClick={() => handleGuildCopy('id')}>Скопировать Discord ID сервера</MenuItem>
        <MenuItem onClick={() => handleGuildCopy('link')}>Скопировать ссылку на сервер</MenuItem>
        <MenuItem onClick={() => handleGuildCopy('invite')}>Создать приглашение</MenuItem>
        <MenuItem onClick={handleCheckPermissions}>Проверить права</MenuItem>
      </Menu>
      <Menu
        anchorEl={botUserMenuAnchor}
        open={!!botUserMenuAnchor}
        onClose={handleBotUserMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{ sx: { mb: 1 } }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography variant="body2">Серверов: <strong>{guilds.length}</strong></Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleBotUserCopy('id')}>Скопировать ID</MenuItem>
        <MenuItem onClick={() => handleBotUserCopy('name')}>Скопировать имя</MenuItem>
        <MenuItem onClick={() => handleBotUserCopy('discriminator')}>Скопировать тег (#)</MenuItem>
        <Divider />
        <MenuItem onClick={() => setLogoutConfirmOpen(true)} sx={{ color: 'error.main' }}>Выйти</MenuItem>
      </Menu>
      <Dialog open={logoutConfirmOpen} onClose={() => setLogoutConfirmOpen(false)}>
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>Вы уверены, что хотите выйти? Вам потребуется снова ввести токен.</DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutConfirmOpen(false)}>Отмена</Button>
          <Button onClick={handleLogout} color="error">Выйти</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={permissionsModal.open}
        onClose={() => setPermissionsModal({ ...permissionsModal, open: false })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Права на сервере: {permissionsModal.guildName}</DialogTitle>
        <DialogContent dividers sx={{ ...scrollbarStyle, p: 0 }}>
          <List dense sx={{ py: 0 }}>
            {[
              ...permissionsModal.granted.map(p => ({ name: p, granted: true })),
              ...permissionsModal.denied.map(p => ({ name: p, granted: false }))
            ]
            .sort((a, b) => (permissionTranslations[a.name] || a.name).localeCompare(permissionTranslations[b.name] || b.name))
            .map((p, i, arr) => (
              <React.Fragment key={p.name}>
                <ListItem
                  secondaryAction={
                    <Chip
                      icon={p.granted ? <CheckCircleIcon /> : <CancelIcon />}
                      label={p.granted ? 'Разрешено' : 'Запрещено'}
                      color={p.granted ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  }
                >
                  <ListItemText primary={permissionTranslations[p.name] || p.name} />
                </ListItem>
                {i < arr.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsModal({ ...permissionsModal, open: false })}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      <Menu anchorEl={channelMenu.anchor} open={!!channelMenu.anchor} onClose={handleChannelMenuClose}>
        <MenuItem onClick={() => handleChannelCopy('id')}>Скопировать Discord ID канала</MenuItem>
        <MenuItem onClick={() => handleChannelCopy('name')}>Скопировать название канала</MenuItem>
        <MenuItem onClick={() => handleChannelCopy('link')}>Скопировать ссылку на канал</MenuItem>
      </Menu>
      <Menu anchorEl={categoryMenu.anchor} open={!!categoryMenu.anchor} onClose={handleCategoryMenuClose}>
        <MenuItem onClick={() => handleCategoryCopy('id')}>Скопировать Discord ID категории</MenuItem>
        <MenuItem onClick={() => handleCategoryCopy('name')}>Скопировать название категории</MenuItem>
      </Menu>
      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

const permissionTranslations = {
  add_reactions: 'Добавлять реакции',
  administrator: 'Администратор',
  attach_files: 'Прикреплять файлы',
  ban_members: 'Банить участников',
  change_nickname: 'Менять никнейм',
  connect: 'Подключаться',
  create_instant_invite: 'Создавать приглашения',
  create_private_threads: 'Создавать приватные ветки',
  create_public_threads: 'Создавать публичные ветки',
  deafen_members: 'Отключать звук участникам',
  embed_links: 'Встраивать ссылки',
  external_emojis: 'Использовать внешние эмодзи',
  kick_members: 'Выгонять участников',
  manage_channels: 'Управлять каналами',
  manage_emojis_and_stickers: 'Управлять эмодзи и стикерами',
  manage_events: 'Управлять событиями',
  manage_guild: 'Управлять сервером',
  manage_messages: 'Управлять сообщениями',
  manage_nicknames: 'Управлять никнеймами',
  manage_roles: 'Управлять ролями',
  manage_threads: 'Управлять ветками',
  manage_webhooks: 'Управлять вебхуками',
  mention_everyone: 'Упоминать @everyone',
  moderate_members: 'Управлять участниками',
  move_members: 'Перемещать участников',
  mute_members: 'Отключать микрофон участникам',
  priority_speaker: 'Приоритетный режим',
  read_message_history: 'Читать историю сообщений',
  read_messages: 'Читать сообщения',
  request_to_speak: 'Запрашивать слово',
  send_messages: 'Отправлять сообщения',
  send_messages_in_threads: 'Отправлять сообщения в ветках',
  send_tts_messages: 'Отправлять TTS-сообщения',
  speak: 'Говорить',
  stream: 'Стримить',
  use_application_commands: 'Использовать слеш-команды',
  use_embedded_activities: 'Использовать встроенные активности',
  use_external_stickers: 'Использовать внешние стикеры',
  use_voice_activation: 'Использовать голосовую активацию',
  view_audit_log: 'Просматривать журнал аудита',
  view_channel: 'Просматривать канал',
  view_guild_insights: 'Просматривать аналитику сервера',
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
