const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, PermissionFlagsBits, ActivityType, PresenceUpdateStatus } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const DATA_FILE = path.join(__dirname, 'bateponto.json');

// Inicializar ficheiro JSON se não existir
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {} }, null, 2));
    }
}

// Ler dados do ficheiro
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Guardar dados no ficheiro
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Obter ou criar dados do utilizador
function getUserData(userId) {
    const data = readData();
    if (!data.users[userId]) {
        data.users[userId] = {
            sessions: [],
            currentSession: null,
            totalHours: 0
        };
        saveData(data);
    }
    return data.users[userId];
}

// Calcular tempo em horas
function calculateHours(startTime, endTime) {
    return (endTime - startTime) / (1000 * 60 * 60);
}

// Formatar tempo
function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
}

client.on('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    initDataFile();
    
    // Configurar status: Não Incomodar + A jogar no 4URP
    client.user.setPresence({
        activities: [{
            name: '4URP',
            type: ActivityType.Playing
        }],
        status: 'dnd' 
    });
    
    console.log('🎮 Status definido: A JOGAR NO 4URP | 🔴 Não Incomodar');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Comando para enviar o painel de bate ponto
    if (message.content.toLowerCase() === '!bateponto') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('⏰ Sistema de Bate Ponto')
            .setDescription('Utiliza os botões abaixo para registar o teu tempo de trabalho.')
            .addFields(
                { name: '🟢 Iniciar', value: 'Começa um novo turno', inline: true },
                { name: '⏸️ Pausar', value: 'Pausa o turno atual', inline: true },
                { name: '🔴 Finalizar', value: 'Termina o turno atual', inline: true }
            )
            .setFooter({ text: 'Sistema de Gestão de Staff' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('bateponto_iniciar')
                    .setLabel('Iniciar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🟢'),
                new ButtonBuilder()
                    .setCustomId('bateponto_pausar')
                    .setLabel('Pausar')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⏸️'),
                new ButtonBuilder()
                    .setCustomId('bateponto_finalizar')
                    .setLabel('Finalizar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🔴')
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        message.delete().catch(() => {});
    }

    // Comando para ver estatísticas (apenas admins)
    if (message.content.toLowerCase().startsWith('!horas')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }

        const args = message.content.split(' ');
        const userId = args[1]?.replace(/[<@!>]/g, '');

        if (!userId) {
            return message.reply('❌ Uso correto: `!horas @utilizador`');
        }

        const data = readData();
        const userData = data.users[userId];

        if (!userData || userData.sessions.length === 0) {
            return message.reply('❌ Este utilizador ainda não tem registos!');
        }

        const user = await client.users.fetch(userId).catch(() => null);
        const userName = user ? user.tag : 'Utilizador Desconhecido';

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`📊 Relatório de Horas - ${userName}`)
            .addFields(
                { name: '⏱️ Total de Horas', value: formatTime(userData.totalHours), inline: true },
                { name: '📝 Total de Sessões', value: userData.sessions.length.toString(), inline: true },
                { name: '🔄 Sessão Ativa', value: userData.currentSession ? 'Sim' : 'Não', inline: true }
            )
            .setTimestamp();

        // Últimas 5 sessões
        const recentSessions = userData.sessions.slice(-5).reverse();
        if (recentSessions.length > 0) {
            let sessionsText = '';
            recentSessions.forEach((session, index) => {
                const date = new Date(session.start).toLocaleDateString('pt-PT');
                const duration = formatTime(session.duration);
                const pauses = session.pauses?.length || 0;
                sessionsText += `**${index + 1}.** ${date} - ${duration} (${pauses} pausa${pauses !== 1 ? 's' : ''})\n`;
            });
            embed.addFields({ name: '📅 Últimas Sessões', value: sessionsText });
        }

        await message.reply({ embeds: [embed] });
    }

    // Comando para ver ranking (apenas admins)
    if (message.content.toLowerCase() === '!ranking') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Apenas administradores podem usar este comando!');
        }

        const data = readData();
        const users = Object.entries(data.users)
            .filter(([_, userData]) => userData.totalHours > 0)
            .sort(([_, a], [__, b]) => b.totalHours - a.totalHours)
            .slice(0, 10);

        if (users.length === 0) {
            return message.reply('❌ Ainda não há registos de horas!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Ranking de Horas - Top 10')
            .setTimestamp();

        let rankingText = '';
        for (let i = 0; i < users.length; i++) {
            const [userId, userData] = users[i];
            const user = await client.users.fetch(userId).catch(() => null);
            const userName = user ? user.username : 'Desconhecido';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            rankingText += `${medal} **${userName}** - ${formatTime(userData.totalHours)}\n`;
        }

        embed.setDescription(rankingText);
        await message.reply({ embeds: [embed] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const data = readData();
    let userData = getUserData(userId);

    if (interaction.customId === 'bateponto_iniciar') {
        if (userData.currentSession) {
            return interaction.reply({ content: '❌ Já tens um turno ativo! Finaliza-o primeiro.', ephemeral: true });
        }

        userData.currentSession = {
            start: Date.now(),
            pauses: []
        };
        data.users[userId] = userData;
        saveData(data);

        await interaction.reply({ content: '✅ Turno iniciado! Boa sorte no trabalho! 💪', ephemeral: true });
    }

    if (interaction.customId === 'bateponto_pausar') {
        if (!userData.currentSession) {
            return interaction.reply({ content: '❌ Não tens nenhum turno ativo!', ephemeral: true });
        }

        if (userData.currentSession.pauseStart) {
            // Retomar da pausa
            const pauseDuration = Date.now() - userData.currentSession.pauseStart;
            userData.currentSession.pauses.push({
                start: userData.currentSession.pauseStart,
                duration: pauseDuration
            });
            delete userData.currentSession.pauseStart;
            data.users[userId] = userData;
            saveData(data);

            await interaction.reply({ content: '▶️ Pausa terminada! De volta ao trabalho!', ephemeral: true });
        } else {
            // Iniciar pausa
            userData.currentSession.pauseStart = Date.now();
            data.users[userId] = userData;
            saveData(data);

            await interaction.reply({ content: '⏸️ Pausa iniciada! Descansa um pouco. ☕', ephemeral: true });
        }
    }

    if (interaction.customId === 'bateponto_finalizar') {
        if (!userData.currentSession) {
            return interaction.reply({ content: '❌ Não tens nenhum turno ativo!', ephemeral: true });
        }

        // Se estiver em pausa, terminar a pausa
        if (userData.currentSession.pauseStart) {
            const pauseDuration = Date.now() - userData.currentSession.pauseStart;
            userData.currentSession.pauses.push({
                start: userData.currentSession.pauseStart,
                duration: pauseDuration
            });
            delete userData.currentSession.pauseStart;
        }

        const endTime = Date.now();
        const totalDuration = endTime - userData.currentSession.start;
        const pauseTime = userData.currentSession.pauses.reduce((sum, pause) => sum + pause.duration, 0);
        const workDuration = totalDuration - pauseTime;
        const hours = calculateHours(0, workDuration);

        userData.sessions.push({
            start: userData.currentSession.start,
            end: endTime,
            duration: hours,
            pauses: userData.currentSession.pauses
        });

        userData.totalHours += hours;
        userData.currentSession = null;
        data.users[userId] = userData;
        saveData(data);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Turno Finalizado!')
            .addFields(
                { name: '⏱️ Tempo Trabalhado', value: formatTime(hours), inline: true },
                { name: '⏸️ Pausas', value: userData.sessions[userData.sessions.length - 1].pauses.length.toString(), inline: true },
                { name: '📊 Total Acumulado', value: formatTime(userData.totalHours), inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

// Substitui pelo teu token do bot
client.login('TOKEN');
