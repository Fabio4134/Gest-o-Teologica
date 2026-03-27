const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdf = require('pdf-parse');
const officeParser = require('officeparser');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.OPENAI_API_KEY) {
    console.error("ERRO: OPENAI_API_KEY não encontrada no .env!");
    process.exit(1);
} else {
    console.log("OPENAI_API_KEY carregada com sucesso.");
}

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>AI Specialist Backend is running! 🚀</h1><p>Use POST /generate-questions to generate theological questions.</p>');
});

const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractText(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    
    try {
        if (ext === '.pdf') {
            console.log("Iniciando extração de PDF...");
            // Tentar officeParser primeiro
            try {
                const data = await officeParser.parseOffice(filePath);
                if (data && data.length > 100) return data;
            } catch (e) {
                console.warn("officeParser falhou em PDF, tentando pdf-parse...");
            }

            // Fallback para pdf-parse
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (ext === '.pptx' || ext === '.docx') {
            console.log(`Extraindo ${ext} usando officeParser...`);
            return await officeParser.parseOffice(filePath);
        } else {
            throw new Error('Formato de arquivo não suportado. Use PDF, PPTX ou DOCX.');
        }
    } catch (err) {
        console.error(`Erro na extração (${ext}):`, err);
        throw new Error('Erro ao processar o conteúdo do arquivo.');
    }
}

app.post('/generate-questions', upload.single('file'), async (req, res) => {
    const filePath = req.file?.path;
    try {
        if (!filePath) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const { subject_id, quantity = 5, difficulty = 'Médio', types = '["multipla_escolha"]' } = req.body;
        let questionTypes;
        try {
            questionTypes = typeof types === 'string' ? JSON.parse(types) : types;
            if (!Array.isArray(questionTypes)) questionTypes = ['multipla_escolha'];
        } catch (e) {
            console.warn("Falha ao parsear 'types', usando padrão:", e.message);
            questionTypes = ['multipla_escolha'];
        }

        // Extrair texto
        const contentText = await extractText(filePath, req.file.originalname);

        if (contentText.length < 50) {
            return res.status(400).json({ error: 'O arquivo parece conter pouco texto ou não pôde ser lido.' });
        }

        // Carregar metodologia (opcional)
        let methodology = "";
        try {
            const baseDir = path.dirname(path.dirname(path.abspath(__filename)));
            const docPath = path.join(baseDir, 'docs', 'prova-online-expert.md');
            if (fs.existsSync(docPath)) {
                methodology = fs.readFileSync(docPath, 'utf8');
            }
        } catch (e) {
            console.error("Erro ao ler metodologia:", e);
        }

        const prompt = `
        ${methodology}
        
        Sua missão é gerar exatamente ${quantity} questões de alto nível teológico de nível ${difficulty} baseadas no material fornecido.
        
        TIPOS DE QUESTÃO SOLICITADOS: ${questionTypes.join(', ')} (Priorize múltipla escolha se não houver especificação).
        
        REGRAS DE OURO (METODOLOGIA PROVA-ONLINE-EXPERT):
        1. TAXONOMIA DE BLOOM: Garanta que as questões cubram níveis cognitivos elevados (Analisar, Avaliar ou Criar) para nível Difícil, e níveis Médios (Aplicar, Analisar) para nível Médio.
        2. ENUNCIADO: Deve ser claro, sem "pegadinhas" baratas, focado em situações reais ou análise profunda de textos.
        3. DISTRATORES: Todos os distratores devem ser plausíveis, baseados em erros comuns de interpretação, mas inequivocamente incorretos diante da resposta certa.
        4. FEEDBACK PEDAGÓGICO: Forneça uma explicação detalhada de POR QUE a alternativa correta está certa e POR QUE cada distrator está incorreto.
        5. TEMPO ESTIMADO: Calcule o tempo médio em segundos para um aluno resolver a questão (90-180s).
        
        MATERIAL DE REFERÊNCIA:
        ---
        ${contentText.substring(0, 15000)}
        ---
        
        Retorne APENAS um JSON válido seguindo EXATAMENTE esta estrutura (IBAD Schema):
        {
          "questions": [
            {
              "type": "multiple-choice | true-false | discursive",
              "text": "Enunciado completo da questão",
              "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
              "correctOptionIndex": 0,
              "explanation": "Explicação pedagógica profunda citando o material",
              "bloom_level": 1 a 6,
              "difficulty": "${difficulty}",
              "estimated_time": 120,
              "feedback_options": [
                "Por que a A está certa/errada",
                "Por que a B está certa/errada",
                "Por que a C está certa/errada",
                "Por que a D está certa/errada"
              ]
            }
          ]
        }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Você é um assistente especializado em criação de questões teológicas para o sistema IBAD." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        
        // Injetar subject_id nas questões
        if (result.questions) {
            result.questions = result.questions.map(q => ({ ...q, subject_id, subjectId: subject_id }));
        }

        res.json(result);

    } catch (e) {
        console.error("Erro generalizado:", e);
        res.status(500).json({ error: e.message });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {}
        }
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend AI Specialist rodando na porta ${port}`);
});
