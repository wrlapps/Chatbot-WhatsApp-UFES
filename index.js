const venom = require("venom-bot"); 
const dotenv = require("dotenv");
dotenv.config();
const { Sequelize, DataTypes, Op } = require("sequelize");
const moment = require("moment-timezone");
const openai_helper = require("./openai_helper"); 
const { loadEmbeddings } = require('./embeddings_handler');

// const API_URL = process.env.API_URL;
const TIMEZONE = "America/Sao_Paulo";
const SESSION_TIMEOUT_MINUTES = 5;
ARQUIVO_BASE_CONHECIMENTO = "./base_conhecimento/embeddings.json"
baseDeConhecimento = []; 

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "bd_chatbot.sqlite",
  logging: console.log,
});

const Session = sequelize.define("Session", {
  userId: { type: DataTypes.STRING, allowNull: false, unique: false },
  lastInteraction: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
});

const Interaction = sequelize.define("Interaction", {
  sessionId: { type: DataTypes.STRING, allowNull: false },
  question: { type: DataTypes.TEXT, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
});

Session.hasMany(Interaction, { foreignKey: "sessionId" });
Interaction.belongsTo(Session, { foreignKey: "sessionId" });

const initializeDatabase = async () => {
  try {
    await sequelize.sync();
    console.log("Database synchronized");
  } catch (error) {
    console.error("Database synchronization failed:", error);
  }
};

const userTimers = {};
const lastMessageTime = {};
const warnedUsers = new Set();

const scheduleTask = (context, chatId, delay, coro) => {
  return setTimeout(() => {
    coro(context, chatId);
  }, delay * 1000);
};

const resetTimer = (whatsapp_client, chatId) => {
  if (userTimers[chatId]) {
    clearTimeout(userTimers[chatId].warningTimer);
    clearTimeout(userTimers[chatId].endTimer);
  }
  // avisa sobre o término da sessão em X minutos
  const warningTimer = scheduleTask(
    whatsapp_client,
    chatId,
    60 * SESSION_TIMEOUT_MINUTES,
    sendWarningMessage
  );
  // envia mensagem de término da sessão em X minutos
  const endTimer = scheduleTask(whatsapp_client, chatId, 60 * SESSION_TIMEOUT_MINUTES * 2, endSessionMessage);
  userTimers[chatId] = { warningTimer, endTimer };
  console.log(`Timers reset for chat ${chatId}`);
};

const sendWarningMessage = (whatsapp_client, chatId) => {
  console.log(`Sending warning to ${chatId}`);
  whatsapp_client.sendText(
    chatId,
    `
🔔 Atenção: Sua sessão será encerrada em 5 minutos caso não haja novas mensagens.

🙏 Gostaríamos de saber sua opinião! Se desejar avaliar o atendimento agora, por favor, acesse o link abaixo e nos deixe seu feedback.

⭐ Avalie Nosso Atendimento:

Seu feedback é fundamental e nos auxilia a melhorar continuamente. Agradecemos!
  `
  );
};

const endSessionMessage = (whatsapp_client, chatId) => {
  console.log(`Ending session for ${chatId}`);
  whatsapp_client.sendText(
    chatId,
    `
🕔 Sessão Encerrada: Devido à inatividade, sua sessão foi finalizada.

🙏 Agradecemos por utilizar nosso serviço! Sua opinião é muito importante para nós. Poderia nos ajudar avaliando sua experiência? Basta acessar o link abaixo:

⭐ Avalie Nosso Atendimento: 

Seu feedback nos ajuda a melhorar continuamente. Agradecemos sua colaboração e esperamos vê-lo novamente em breve!
  `
  );
};

const getSession = async (userId) => {
  try {
    const now = moment().tz(TIMEZONE);
    const cutoff = now
      .clone()
      .subtract(SESSION_TIMEOUT_MINUTES, "minutes")
      .toDate();
    const session = await Session.findOne({
      where: { userId, lastInteraction: { [Op.gte]: cutoff } },
    });
    console.log(
      session
        ? `Session found for ${userId}`
        : `No active session for ${userId}`
    );
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
};

const createSession = async (userId) => {
  try {
    const now = moment().tz(TIMEZONE).toDate();
    console.log('userId');
    console.log(userId);
    
    const session = await Session.create({ userId, lastInteraction: now });
    console.log(`Session created for ${userId}`);
    return session;
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
};

const updateSession = async (session) => {
  try {
    const now = moment().tz(TIMEZONE).toDate();
    session.lastInteraction = now;
    await session.save();
    console.log(`Session updated for ${session.userId}`);
  } catch (error) {
    console.error("Error updating session:", error);
  }
};
const convertInteractions = (interactions) => {
  return interactions.flatMap(({ question, answer }) => [
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ]);
};

const loadHistory = async (session) => {
  try {
    const interactions = await Interaction.findAll({
      where: { sessionId: session.id },
      order: [["createdAt", "ASC"]],
    });
    console.log(`Loaded history for session ${session.id}`);
    const gettingInteractions = interactions.map((interaction) => ({
      question: interaction.question,
      answer: interaction.answer,
    }));
    return convertInteractions(gettingInteractions);
  } catch (error) {
    console.error("Error loading history:", error);
    return [];
  }
};

const saveInteraction = async (sessionId, question, answer) => {
  try {
    await Interaction.create({ sessionId, question, answer });
    console.log(`Interaction saved for session ${sessionId}`);
  } catch (error) {
    console.error("Error saving interaction:", error);
  }
};

const sendMessageToBot = async (message, history) => {
  return openai_helper.getGPTAnswer(message, history, baseDeConhecimento);
};

const processUserMessage = async (userId, message, whatsapp_client) => {
  try {
    const session = await getSession(userId);
    const history = session ? await loadHistory(session) : [];
    let currentSession = session;
    if (!session) currentSession = await createSession(userId);
    const botResponse = await sendMessageToBot(message, history);
    await saveInteraction(currentSession.id, message, botResponse);
    await updateSession(currentSession);

    await whatsapp_client.sendText(userId, botResponse);
    resetTimer(whatsapp_client, userId);
    console.log(`Processed message for ${userId}: ${message}`);
    return botResponse;
  } catch (error) {
    console.error("Error processing user message:", error);
    return null;
  }
};

const getAIResponse = async (userId, texto, whatsapp_client) => {
  console.log(`Obtendo resposta da IA para ${userId}: ${texto}`);
  await processUserMessage(userId, texto, whatsapp_client);
};

const manageBot = async (client) => {
  console.log("->Aguardando chegada de mensagens");

  client.onMessage(async (msg) => {
    console.log('Mensagem recebida. Processando...');
    console.log(msg);
    
    if (!msg.isGroupMsg && msg.from.startsWith("5527")) {
      console.log(`Message from ${msg.from}: ${msg.body}`);

      try {
        await getAIResponse(msg.from, msg.body, client);
      } catch (error) {
        console.error("Error managing message:", error);
      }
    }
  });
};

async function startBot() {
  initializeDatabase();
  baseDeConhecimento = await loadEmbeddings(ARQUIVO_BASE_CONHECIMENTO);
  try {
    const client = await venom.create(
      "BOT_SESSION_DPI_004",
      (base64Qr, asciiQR) => console.log("QRCode recebido"),
      (statusSession, session) => {
        console.log("Status da Sessão:", statusSession);
        console.log("Dados da sessão:", session);
      },
      {
        folderNameToken: "tokens",
        headless: false,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: true,
        browserArgs: ["--no-sandbox"],
        disableSpins: true,
        disableWelcome: true,
        updatesLog: true,
        autoClose: 60000,
      }
    );
    console.log("Bot started");
    manageBot(client);
  } catch (error) {
    console.error("Falha ao iniciar bot:", error);
  }
}

startBot();
