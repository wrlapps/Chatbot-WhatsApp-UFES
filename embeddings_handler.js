const fs = require('fs').promises;
const { OpenAI } = require('openai');
const path = require('path');
 
async function getEmbedding(text, model = "text-embedding-3-small") {
    const client = new OpenAI();
    // Verifica se text é uma string válida, caso contrário retorna array vazio
    if (typeof text !== 'string') {
        console.warn(`Invalid input: 'text' must be a string. Received ${typeof text}`);
        return [];
    }

    // Substitui quebras de linha por espaços
    text = text.replace(/\n/g, " ");

    try {
        // Gera embeddings
        const response = await client.embeddings.create({ input: [text], model: model });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error.message);
        return []; // Retorna array vazio em caso de erro
    }
}

function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Função para carregar embeddings de arquivo JSON
async function loadEmbeddings(filePath) {
    const fullPath = filePath;

    try {
        await fs.access(fullPath);
    } catch (error) {
        console.log(`Arquivo '${fullPath}' não encontrado. Gere a base de conhecimento antes de iniciar o bot ou especifique o caminho editando este arquivo...`);
        return;
    }

    try {
        const data = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Erro ao ler o arquivo '${fullPath}': ${error.message}`);
        throw error;
    }
}

// Função para buscar as melhores correspondências para uma consulta
async function searchTopResponses(query, phrases, topN = 8, similarityThreshold = 0.3) {
    const queryEmbedding = await getEmbedding(query);
    const similarities = phrases.map(item => cosineSimilarity(queryEmbedding, item.embedding));
    
    // Obter os índices das N melhores correspondências acima do limite
    const topIndices = similarities
        .map((similarity, index) => ({ similarity, index }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topN)
        .filter(item => item.similarity >= similarityThreshold);

    const topPhrases = topIndices.map(({ index, similarity }) => ({
        pergunta: phrases[index].pergunta,
        resposta: phrases[index].resposta,
        similarity
    }));
    
    return topPhrases.length > 0 ? topPhrases : [{ pergunta: "Desculpe, não encontrei uma resposta adequada.", resposta: "", similarity: 0 }];
}

module.exports = { searchTopResponses, loadEmbeddings };