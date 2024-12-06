const { OpenAI } = require("openai");
const dotenv = require("dotenv"); 
const { searchTopResponses } = require('./embeddings_handler');

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function getGPTAnswer(question, historico = [], baseDeConhecimento) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "Chave da API não encontrada. Por favor, verifique seu arquivo .env."
    );
  }
  
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  const mensagemAtual = {
    role: "user",
    content: question,
  };
  historico.push(mensagemAtual);
  
  const topResponses = await searchTopResponses(question, baseDeConhecimento);
  console.log(topResponses);
  
  const prompt = (
    "Aqui estão as respostas mais relevantes para responder à pergunta do usuário:\n" +
    JSON.stringify(topResponses, null, 2) +
    "\n\nBaseando-se nessas informações, forneça uma resposta completa para o usuário."
  );

  const historicoFormatado = (
    "Aqui estão as comunicações recentes entre você e o usuário:\n" +
    JSON.stringify(historico, '(nenhuma mensagem trocada ainda)', 2) 
  );
  
  let response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // ou "gpt-3.5-turbo"
    messages: [
      {role: "system", content: `
      Você é o Assistente da Diretoria de Projetos Institucionais (DPI) da Pró-reitoria de Administração (PROAD) da Universidade Federal do Espírito Santo (UFES), especializado em responder dúvidas sobre projetos, fundações de apoio e contratos, seguindo as normas aplicáveis a projetos apoiados por fundações de apoio. Sua base de conhecimento inclui informações previamente extraídas e organizadas, de acordo com normas e diretrizes, para fornecer respostas precisas e eficientes.
      
      Para responder às perguntas, utilize as informações mais próximas e relevantes de sua base de conhecimento. Caso a pergunta não tenha uma resposta clara ou específica nos dados fornecidos, responda de forma acolhedora e oriente o usuário a buscar suporte adicional pelo e-mail: dpi.proad@ufes.br.
      
      Diretrizes de Comportamento e Estilo:
          - Tom Amigável e Profissional: Responda de forma educada e acolhedora, evitando informalidades excessivas para garantir clareza e confiança.
          - Clareza e Completude: Forneça respostas claras e completas, sem omitir detalhes importantes.
          - Limitações nas Respostas: Não invente ou especule informações. Se a pergunta ultrapassa o escopo das normas aplicáveis ou não há uma resposta clara, informe respeitosamente que "essa informação não está em seu conhecimento atualmente."
          - Privacidade e Confidencialidade: Mencione que dados pessoais e confidenciais são protegidos, quando pertinente.
          - Proatividade: Antecipe dúvidas adicionais e inclua informações úteis para apoiar o usuário no entendimento completo da resposta.
          - Em respostas da base de dados que tenham um passo a passo, retorne a informação ao usuário sem grandes modificações.
          - Caso na resposta mencione um setor específico ou instância, faça questão de mencionar também na resposta ao usuário.
          - Dê preferência ao conteúdo das primeiras respostas fornecidas como base, já que possuem maior índice de similarity.
      
      Restrições das Respostas:
          - Não indique que você está consultando um arquivo específico;
          - Não mencione que uma base de dados ou arquivos foram enviados ou analisados;
          - Não mencione siglas as quais você não conhece o significado exato;
          - Caso na base de conhecimento fornecida conste "Desculpe, não encontrei uma resposta adequada.", responda de forma acolhedora e oriente o usuário a buscar suporte adicional pelo e-mail: dpi.proad@ufes.br.
      `},
      {role: "system", content: prompt},
      {role: "system", content: historicoFormatado},
      {role: "user", content: question}
    ],
  });
  
  const botMessage = response.choices[0].message;
  console.log(`${botMessage.role} > ${botMessage.content}`);
  historico.push(botMessage);
  return botMessage.content.replace(/【.*?】/g, "");
}

module.exports = {
  getGPTAnswer,
};