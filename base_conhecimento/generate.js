const fs = require('fs').promises;
const xlsx = require('xlsx');
const { OpenAI } = require('openai');
const dotenv = require("dotenv");
const path = require('path');

// Configurar dotenv apontando diretamente para o arquivo .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({ apiKey: OPENAI_API_KEY});

async function getEmbedding(text, model = "text-embedding-3-small") {
    text = text.replace(/\n/g, " ");
    const response = await client.embeddings.create({ input: [text], model: model });
    return response.data[0].embedding;
}

// Função para carregar perguntas e respostas do arquivo Excel
async function loadPhrasesFromExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    return data.map(row => ({ pergunta: row["Pergunta"], resposta: row["Resposta"] }));
}

// Função para salvar embeddings em arquivo JSON
async function saveEmbeddings(phrases, filePath) {
    await fs.writeFile(filePath, JSON.stringify(phrases, null, 2));
}

// Função principal para gerar e salvar embeddings
async function generateEmbeddings(xlsxPath = "perguntas_respostas.xlsx", jsonPath = "embeddings.json") {
    try {
        const phrases = await loadPhrasesFromExcel(xlsxPath);
        // Gerar embeddings para cada pergunta e adicionar ao objeto
        for (let item of phrases) {
            item.embedding = await getEmbedding(item.pergunta);
        }
        // Salvar no arquivo JSON
        await saveEmbeddings(phrases, jsonPath);
        console.log(`Arquivo de embeddings '${jsonPath}' gerado com sucesso.`);
    } catch (error) {
        console.error("Erro ao gerar embeddings:", error);
    }
}

// Executa a geração de embeddings se o script for executado diretamente
if (require.main === module) {
    generateEmbeddings();
}

module.exports = { generateEmbeddings };