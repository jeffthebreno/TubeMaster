import { GoogleGenAI } from "@google/genai";
import { ChatMessage, ScriptConfig } from "../types";

// Initialize the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateVideoIdeas = async (promptContext: string, channelName: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `Você é um estrategista experiente de YouTube brasileiro. 
    Gere 5 ideias de vídeos virais para o canal "${channelName}" baseado no seguinte contexto ou prompt salvo. 
    Responda sempre em Português do Brasil.
    Retorne apenas a lista de ideias, sem texto introdutório.`;

    const response = await ai.models.generateContent({
      model,
      contents: promptContext,
      config: {
        systemInstruction,
      }
    });

    return response.text || "Sem resposta do Gemini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar ideias. Verifique o console.";
  }
};

export const improvePrompt = async (currentPrompt: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Melhore o seguinte prompt para ser mais detalhado e eficaz para gerar roteiros de YouTube. Responda em Português do Brasil: "${currentPrompt}"`,
    });
    return response.text || currentPrompt;
  } catch (error) {
    console.error("Gemini Error:", error);
    return currentPrompt;
  }
}

export const analyzeChannelImport = async (fileBase64: string, mimeType: string): Promise<any> => {
  try {
    // Remove data URL prefix if present to get just the base64 string
    const base64Data = fileBase64.includes('base64,') ? fileBase64.split(',')[1] : fileBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Multimodal support
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Atue como um estrategista sênior de YouTube focado no mercado brasileiro.
            Analise este arquivo (pode ser um print da home do canal, aba vídeos ou um PDF de mídia kit).
            
            Seu objetivo é extrair dados técnicos e realizar uma análise qualitativa profunda da estratégia.

            IMPORTANTE: 
            1. Retorne APENAS um JSON válido, sem markdown.
            2. Todos os textos de análise (titlePatterns, themeAnalysis, strategyNotes, audiencePersona, contentTone) DEVEM ESTAR EM PORTUGUÊS DO BRASIL.
            3. Se não conseguir encontrar um dado exato, faça uma estimativa inteligente baseada no visual ou use "Não identificado".

            JSON Schema esperado:
            {
              "name": "Nome do Canal",
              "totalSubscribers": numero (ex: 10000),
              "totalViews": numero (estimativa ou 0),
              "totalVideos": numero,
              "uploadSchedule": ["Segunda", "Quarta"] (Array com dias da semana em PT-BR inferidos pelas datas de postagem),
              "uploadTime": "18:00" (estimativa),
              "isMonetized": boolean (baseado em 'Seja Membro', qualidade, etc),
              "avgDuration": "string (ex: 'Longos (15-20m)' ou 'Curtos (Shorts)')",
              "videosPerWeek": numero,
              "titlePatterns": "string (Análise detalhada em PT-BR: usam clickbait? perguntas? caps lock? emojis?)",
              "themeAnalysis": "string (Análise detalhada em PT-BR: quais os nichos principais? do que falam?)",
              "strategyNotes": "string (Análise detalhada em PT-BR: o que faz o canal crescer? thumbnails? hooks?)",
              "audiencePersona": "string (Perfil do público em PT-BR: ex 'Jovens tech', 'Donas de casa', 'Investidores')",
              "contentTone": "string (Tom de voz em PT-BR: ex 'Humorístico', 'Sério', 'Investigativo', 'Vlog')"
            }`
          }
        ]
      }
    });

    const text = response.text || "{}";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze file");
  }
};

export const sendViralScriptMessage = async (
  currentMessage: string,
  history: ChatMessage[],
  knowledgeBase: string,
  config: ScriptConfig,
  files: { name: string, data: string, mimeType: string }[] = []
): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview'; // Excellent for long context and reasoning

    // Construct System Instruction based on Config and Knowledge Base
    const systemInstruction = `Você é um especialista em Roteiros Virais para YouTube (Scriptwriter AI).
    
    ESTRATÉGIA DEFINIDA:
    - Duração Alvo: ${config.duration}
    - Tom de Voz: ${config.tone}
    - Estratégia de Retenção: ${config.strategy}
    
    BASE DE CONHECIMENTO (Contexto de Treinamento):
    ${knowledgeBase}
    
    SUA MISSÃO:
    1. Analisar o pedido do usuário.
    2. Utilizar o histórico da conversa e a base de conhecimento para manter consistência.
    3. Se solicitado um roteiro, inclua sempre:
       - 3 Sugestões de Títulos Clickbait (baseados em padrões virais).
       - Estrutura de Gancho (Hook) nos primeiros 5 segundos.
       - Corpo do roteiro otimizado para a duração: ${config.duration}.
       - Call to Action (CTA) natural.
    4. Responda sempre em Português do Brasil.
    `;

    // Initialize Chat
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // Slightly creative
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    // Prepare message parts
    const parts: any[] = [];
    
    // Add file parts if they exist (PDFs, Images)
    if (files && files.length > 0) {
        files.forEach(file => {
             // clean base64
             const cleanData = file.data.includes('base64,') ? file.data.split(',')[1] : file.data;
             parts.push({
                 inlineData: {
                     mimeType: file.mimeType,
                     data: cleanData
                 }
             });
        });
    }

    // Add text part
    parts.push({ text: currentMessage });

    // Send Message using the correct structure { message: { parts: [...] } }
    const result = await chat.sendMessage({ 
        message: { parts: parts } 
    });
    
    return result.text || "Não consegui gerar uma resposta.";

  } catch (error) {
    console.error("Viral Script Chat Error:", error);
    return "Erro na comunicação com a IA. Tente novamente.";
  }
};