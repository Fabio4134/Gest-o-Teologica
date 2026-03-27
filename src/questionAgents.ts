import * as pdfjsLib from 'pdfjs-dist';
// Importação do worker via Vite URL
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configurar o worker do pdfjs usando a URL resolvida pelo Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export type AIProvider = 'gemini' | 'groq' | 'openai';

let activeProvider: AIProvider = GROQ_API_KEY ? 'groq' : (OPENAI_API_KEY ? 'openai' : 'gemini');

export function setAIProvider(provider: AIProvider) {
  activeProvider = provider;
}

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export function getProviderKey(provider: AIProvider): string | undefined {
  if (provider === 'groq') return GROQ_API_KEY;
  if (provider === 'openai') return OPENAI_API_KEY;
  return GEMINI_API_KEY;
}

if (!GEMINI_API_KEY && !GROQ_API_KEY && !OPENAI_API_KEY) {
  console.error('Nenhuma chave de API configurada no .env!');
}

function extractJSON(text: string): any {
  try {
    // Tenta o parse direto primeiro
    return JSON.parse(text);
  } catch (e) {
    // Se falhar, procura o primeiro { e o último }
    try {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1) return null;
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch (e2) {
      console.error("Falha fatal no parse de JSON:", e2, text.substring(0, 100));
      return null;
    }
  }
}

const ai = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash'; 
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';


export interface GeneratedQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  bloom_level: number;
  difficulty: string;
  estimated_time: number;
  feedback_options: string[];
  subject_id?: string;
  // Novos campos para QuizTheos Pro
  tipo: 'multipla_escolha' | 'vf' | 'dissertativa' | 'lacunas' | 'colunas' | 'situacional' | 'analise_texto' | 'ordenacao';
  referencia_biblica?: string;
  referencia_bibliografica?: string;
  pares?: { coluna_a: string; coluna_b: string }[];
  texto_lacuna?: string;
  itens_ordenacao?: string[];
  ordem_correta?: string[];
}

export type ProgressCallback = (stage: 'extracting' | 'generating' | 'reviewing' | 'done', detail?: string) => void;

// ============================================================
// EXTRAÇÃO DE TEXTO DO ARQUIVO (client-side)
// ============================================================
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return extractFromPDF(file);
  } else if (ext === 'pptx' || ext === 'docx') {
    return extractFromOffice(file);
  } else if (ext === 'txt') {
    return file.text();
  } else {
    // Se o formato for desconhecido, tentamos ler como texto simples antes de desistir
    try {
      return await file.text();
    } catch {
      throw new Error('Formato não suportado. Use PDF, PPTX, DOCX ou Texto.');
    }
  }
}

async function extractFromPDF(file: File): Promise<string> {
  try {
    console.log(`[PDF] Iniciando extração de: ${file.name} (${(file.size/1024).toFixed(1)}KB)`);
    const arrayBuffer = await file.arrayBuffer();
    console.log(`[PDF] ArrayBuffer carregado: ${arrayBuffer.byteLength} bytes`);
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    console.log(`[PDF] PDF carregado. Páginas: ${pdf.numPages}`);

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || '')
        .filter(Boolean)
        .join(' ');
      fullText += pageText + '\n';
      console.log(`[PDF] Página ${i}/${pdf.numPages}: ${pageText.length} chars`);
    }
    
    const result = fullText.trim();
    console.log(`[PDF] Extração completa: ${result.length} chars totais`);
    
    if (result.length < 50) {
      console.warn('[PDF] Texto insuficiente extraído. PDF pode ser baseado em imagem (scan).');
    }
    
    return result;
  } catch (err) {
    console.error('[PDF] Erro na extração:', err);
    // Fallback: tentar ler o arquivo como texto bruto
    try {
      const text = await file.text();
      const readable = text.replace(/[^\x20-\x7E\u00C0-\u024F\s]/g, ' ').replace(/\s{3,}/g, ' ').trim();
      if (readable.length > 100) {
        console.log('[PDF] Fallback de texto bruto bem-sucedido:', readable.length, 'chars');
        return readable;
      }
    } catch (_) {}
    return '';
  }
}

async function extractFromOffice(file: File): Promise<string> {
  // Para PPTX/DOCX, enviamos o arquivo como texto via FileReader
  // Arquivos Office são ZIPs — extraímos o XML de texto via fetch workaround
  // Usamos uma estratégia de extração básica lendo bytes de texto do arquivo
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);
        // Decodificar como string e extrair texto visível
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        // Extrair conteúdo de texto de tags XML do PPTX/DOCX
        const textMatches = rawText.match(/(?<=<a:t>)[^<]+/g) || 
                            rawText.match(/(?<=<w:t[^>]*>)[^<]+/g) ||
                            rawText.match(/[A-Za-záàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ\s,.;:!?'"()-]{20,}/g) || [];
        const extractedText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
        if (extractedText.length < 100) {
          reject(new Error('Não foi possível extrair texto suficiente do arquivo. Tente converter para PDF.'));
        } else {
          resolve(extractedText);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}

async function callGroqAI(prompt: string, systemPrompt: string, onProgress?: ProgressCallback): Promise<string> {
  if (onProgress) onProgress('generating', `Tentando modelo Groq: ${DEFAULT_GROQ_MODEL}...`);
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro Groq (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '{}';
  } catch (err: any) {
    console.error("Erro na chamada Groq:", err);
    throw err;
  }
}

async function callGeminiAI(prompt: string, systemPrompt: string, onProgress?: ProgressCallback, retries = 3): Promise<string> {
  const tryModel = async (modelName: string) => {
    if (onProgress) onProgress('generating', `Tentando modelo Gemini: ${modelName}...`);
    const genModel = ai.getGenerativeModel({ 
      model: modelName
    }, { apiVersion: 'v1' });

    const fullPrompt = `INSTRUÇÕES DO SISTEMA:\n${systemPrompt}\n\nREQUISIÇÃO DO USUÁRIO:\n${prompt}\n\nRETORNE APENAS JSON.`;

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
    });

    const response = await result.response;
    let text = response.text() || '{}';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return text;
  };

  const modelsToTry = [DEFAULT_GEMINI_MODEL, 'gemini-1.5-pro', 'gemini-pro'];

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const model of modelsToTry) {
      try {
        return await tryModel(model);
      } catch (err: any) {
        const errorMsg = String(err);
        console.error(`Erro com ${model}:`, errorMsg);
        
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          if (onProgress) onProgress('generating', `Limite de cota atingido em ${model}.`);
          break; 
        }
        
        if (!errorMsg.includes('404') && !errorMsg.includes('not found')) {
           if (model === 'gemini-pro') throw err;
        }
        
        continue;
      }
    }

    const delay = attempt * 10000;
    if (onProgress) onProgress('generating', `Retentando em ${delay/1000}s...`);
    await new Promise(r => setTimeout(r, delay));
  }
  return '{}';
}

// ============================================================
// OPENAI / CHATGPT
// ============================================================
async function callOpenAI(prompt: string, systemPrompt: string, onProgress?: ProgressCallback): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('Chave da OpenAI não configurada. Adicione VITE_OPENAI_API_KEY ao arquivo .env');
  }

  if (onProgress) onProgress('generating', 'Conectando ao ChatGPT (GPT-4o-mini)...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Erro OpenAI (${response.status}): ${errData.error?.message || 'Resposta inválida'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '{}';
}

/**
 * Função unificada — roteia para o provedor ativo com fallback para Groq/Gemini
 */
async function callAI(prompt: string, systemPrompt: string, onProgress?: ProgressCallback): Promise<string> {
  if (activeProvider === 'openai') {
    try {
      return await callOpenAI(prompt, systemPrompt, onProgress);
    } catch (err) {
      console.warn('OpenAI falhou, usando Groq como fallback...', err);
      if (GROQ_API_KEY) return await callGroqAI(prompt, systemPrompt, onProgress);
      return await callGeminiAI(prompt, systemPrompt, onProgress);
    }
  }
  if (activeProvider === 'groq' && GROQ_API_KEY) {
    try {
      return await callGroqAI(prompt, systemPrompt, onProgress);
    } catch (err) {
      console.warn('Groq falhou, tentando Gemini como fallback...', err);
      return await callGeminiAI(prompt, systemPrompt, onProgress);
    }
  }
  return await callGeminiAI(prompt, systemPrompt, onProgress);
}



// ============================================================
// AGENTE 1+2 COMBINADOS: EXTRATOR + GERADOR (VERSÃO PRO)
// ============================================================
async function runAgent12_ExtractAndGenerate(
  rawText: string,
  config: {
    subjectName: string;
    quantity: number;
    difficulty: string;
    types: string[];
    nivel: string;
    instrucoes: string;
  },
  onProgress?: ProgressCallback
): Promise<string> {
  const bloomMap: Record<string, string> = {
    'Fácil': 'L1 (Lembrar) e L2 (Compreender)',
    'Médio': 'L3 (Aplicar) e L4 (Analisar)',
    'Difícil': 'L5 (Avaliar) e L6 (Criar)',
  };
  const bloomTarget = bloomMap[config.difficulty] || 'L3 (Aplicar) e L4 (Analisar)';

  const systemPrompt = `Você é o QuizTheos IA Especialista — gerador de avaliações teológicas acadêmicas.
DOMÍNIO: Teologia Sistemática, Bíblica, Hermenêutica, História da Igreja e Tradições Cristãs.

MISSÃO: Criar questões de alta qualidade baseadas EXCLUSIVAMENTE no material ou tema fornecido pelo usuário.

TAXONOMIA DE BLOOM ALVO: ${bloomTarget}
NÍVEL ACADÊMICO: ${config.nivel}
INSTRUÇÕES CRÍTICAS (LEIA COM ATENÇÃO):
1. PRIORIDADE MÁXIMA: Use o "MATERIAL DE REFERÊNCIA" como fonte primária de conteúdo.
2. PRIORIDADE SECUNDÁRIA: Se o material for insuficiente, use o "TEMA OBRIGATÓRIO".
3. ISOLAMENTO: Ignore completamente o nome da disciplina original se ele for diferente do tema/material fornecido agora.
INSTRUÇÕES ADICIONAIS: ${config.instrucoes}

TIPOS DE QUESTÃO SOLICITADOS: ${config.types.join(', ')}

FORMATOS JSON POR TIPO (ESTRUTURA RÍGIDA NA CHAVE "questions"):
- multipla_escolha: { "tipo": "multipla_escolha", "text": string, "options": string[], "correctOptionIndex": number, "explanation": string }
- vf: { "tipo": "vf", "text": string, "correctOptionIndex": 0 (Verdadeiro) ou 1 (Falso), "explanation": string }
- dissertativa: { "tipo": "dissertativa", "text": string, "explanation": "Critérios de correção/Resposta esperada" }
- lacunas: { "tipo": "lacunas", "text": "Frase com ___", "texto_lacuna": "palavra_oculta", "explanation": string }
- colunas: { "tipo": "colunas", "text": "Enunciado", "pares": [{ "coluna_a": "Link A", "coluna_b": "Link B" }], "explanation": string }
- ordenacao: { "tipo": "ordenacao", "text": "Ordene os eventos:", "itens_ordenacao": ["B", "A", "C"], "ordem_correta": ["A", "B", "C"], "explanation": string }
- situacional: { "tipo": "situacional", "text": "Cenário Pastoral...", "explanation": "Resposta/Conduta esperada" }
- analise_texto: { "tipo": "analise_texto", "text": "Analise o texto [Citação]: [Pergunta]", "explanation": "Exegese esperada" }

Gere EXATAMENTE ${config.quantity} questões NO TOTAL.
Retorne APENAS JSON válido no formato { "questions": [...] }.`;

  const userPrompt = `TEMA OBRIGATÓRIO: ${config.subjectName}
MATERIAL DE REFERÊNCIA (PREVALECE SOBRE TUDO):
---
${rawText.substring(0, 40000)}
---

DIRETRIZ: Se houver MATERIAL DE REFERÊNCIA, use-o como base única. Se não houver, use o TEMA OBRIGATÓRIO.

Gere as questões no formato JSON solicitado.`;

  const raw = await callAI(userPrompt, systemPrompt, onProgress);
  const parsed = extractJSON(raw);
  return parsed ? JSON.stringify(parsed) : raw;
}

// ============================================================
// AGENTE 3: REVISOR E ENRIQUECEDOR
// ============================================================
async function runAgent3_Reviewer(
  rawQuestions: string,
  difficulty: string,
  onProgress?: ProgressCallback
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `Você é o AGENTE REVISOR IBAD. Seu papel é enriquecer as questões teológicas com justificativas profundas e referências bíblicas.
Retorne um JSON enriquecido seguindo a estrutura original de cada questão, mas adicionando/refinando:
- explanation: Justificativa teológica detalhada.
- referencia_biblica: Citação bíblica (ex: João 3:16).
- estimated_time: Segundos estimados.
- difficulty: "${difficulty}".`;

  const userPrompt = `QUESTÕES PARA REVISÃO:
${rawQuestions}`;

  const raw = await callAI(userPrompt, systemPrompt, onProgress);
  try {
    const parsed = extractJSON(raw);
    if (!parsed) throw new Error("A revisão da IA não retornou um formato JSON válido.");
    
    // Procura por um array de questões em várias chaves possíveis ou no próprio root
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
    
    if (questions.length === 0) {
      console.warn("Nenhuma questão encontrada no JSON:", parsed);
    }
    
    return questions;
  } catch (e) {
    console.error("Erro ao analisar JSON do Revisor:", e, raw.substring(0, 200));
    return [];
  }
}

// ============================================================
// PIPELINE PRINCIPAL
// ============================================================
export async function runAgentPipeline(
  file: File,
  config: any,
  onProgress: ProgressCallback
): Promise<GeneratedQuestion[]> {

  onProgress('extracting', 'Lendo e interpretando o material...');
  let rawText = '';
  try {
    rawText = (await extractTextFromFile(file)) || '';
  } catch (extractErr) {
    console.error('[Pipeline] Erro na extração:', extractErr);
    rawText = '';
  }
  
  onProgress('extracting', `Extração concluída: ${rawText.length} caracteres lidos do arquivo.`);
  console.log(`[Pipeline] rawText: ${rawText.length} chars, Nome: ${file.name}`);

  onProgress('generating', 'Agente Gerador: Criando questões teológicas...');
  
  // SEMPRE combinamos o material do arquivo com o tema e as instruções do usuário
  const enrichedContent = `
    MATERIAL DE REFERÊNCIA (TEXTO EXTRAÍDO): 
    ${rawText || '(Nenhum texto extraído do arquivo)'}
    
    TEMA/DISCIPLINA: ${config.subjectName}
    INSTRUÇÕES ADICIONAIS DO USUÁRIO: ${config.instrucoes || 'Nenhuma'}
    NÍVEL: ${config.nivel}
  `;

  console.log(`Pipeline: Texto extraído possui ${rawText.length} caracteres.`);
  const rawQuestions = await runAgent12_ExtractAndGenerate(enrichedContent, config, onProgress);

  onProgress('reviewing', 'Agente Revisor: Refinando conteúdo e referências...');
  const finalQuestions = await runAgent3_Reviewer(rawQuestions, config.difficulty, onProgress);

  const questionsWithSubject = finalQuestions.map(q => ({
    ...q,
    subject_id: config.subjectId,
  }));

  onProgress('done', `${questionsWithSubject.length} questões prontas!`);
  return questionsWithSubject;
}
