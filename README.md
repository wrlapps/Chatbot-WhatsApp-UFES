
# Chatbot para Atendimento via WhatsApp

Este repositório contém o código-fonte de um chatbot desenvolvido para auxiliar no atendimento a usuários no setor de contratos administrativos da Universidade Federal do Espírito Santo (UFES). Utilizando a plataforma WhatsApp e a API da OpenAI, o chatbot oferece respostas rápidas e precisas às demandas administrativas, reduzindo atrasos e melhorando a eficiência dos processos.

---

## Índice
1. [Introdução](#introdução)
2. [Requisitos](#requisitos)
3. [Instalação dos Programas Necessários](#instalação-dos-programas-necessários)
4. [Configuração e Instalação do Chatbot](#configuração-e-instalação-do-chatbot)
5. [Utilização do Chatbot](#utilização-do-chatbot)
6. [Atualização e Treinamento](#atualização-e-treinamento) 

---

## Introdução
Este chatbot foi projetado para reduzir atrasos e agilizar procedimentos administrativos ao oferecer respostas automatizadas a perguntas frequentes, economizando tempo e recursos. Ele se destaca por integrar a API OpenAI e a plataforma WhatsApp, garantindo respostas rápidas, precisas e uma experiência interativa para o usuário.---

## Requisitos

Para executar o chatbot, você precisará de:
- **Computador Compatível**:
  - Sistema operacional: Windows 10 ou superior, Linux ou macOS.
  - Capacidade para executar o servidor do aplicativo durante a atividade do chatbot.
- **Conexão com a Internet**: Estável para comunicação com APIs e serviços externos.
- **Conta de Desenvolvedor OpenAI**: Cadastro ativo com créditos disponíveis.
- **Número de Telefone com WhatsApp**: Para integrar o chatbot ao serviço de mensagens.

---

## Instalação dos Programas Necessários

1. **Node.js** - [Download](https://nodejs.org/)
2. **GIT** - [Download](https://git-scm.com/)
3. **DBeaver Community** (opcional) - [Download](https://dbeaver.io/)
4. **Editor de Planilhas** - Microsoft Excel, LibreOffice Calc, ou outro equivalente.

---

## Configuração e Instalação do Chatbot

1. Clone este repositório:
   ```bash
   git clone https://gitlab.com/alan799/dpi_assistant.git
   cd dpi_assistant
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure sua conta na OpenAI:
   - Crie uma chave de API no painel de desenvolvedores em [OpenAI](https://platform.openai.com).

4. Adicione a chave ao arquivo `.env`:
   ```plaintext
   OPENAI_API_KEY=XXXXXXXXX
   ```

5. Inicie o chatbot:
   ```bash
   npm run
   ```

6. Escaneie o QRCode exibido no console com o aplicativo WhatsApp do número desejado.

---

## Utilização do Chatbot

- Envie mensagens para o número vinculado ao chatbot para iniciar a interação.
- Monitore as interações no terminal para verificar erros ou informações importantes.

---

## Atualização e Treinamento

1. Atualize a base de conhecimento:
   - Edite o arquivo `perguntas_respostas.xlsx` na pasta `base_conhecimento`.
2. Gere as novas embeddings:
   ```bash
   node generate.js
   ```

3. Reinicie o chatbot para aplicar as atualizações.

 ---
 Estamos abertos a colaborações! Caso tenha ideias ou melhorias, envie um pull request ou entre em contato conosco.
