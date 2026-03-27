import React, { useState, useEffect } from 'react';
import './QuizTheosPro.css';
import { runAgentPipeline, setAIProvider, getAIProvider, getProviderKey, AIProvider } from '../questionAgents';
import { BookOpen, Sparkles, Wand2, XCircle, Check, FileText, History, Settings, Printer, Plus } from 'lucide-react';

interface QuizTheosProProps {
  subjects: any[];
  selectedSubjectId: string;
  onImport?: (questions: any[]) => void;
  onClose: () => void;
}

export const QuizTheosPro: React.FC<QuizTheosProProps> = ({ subjects, selectedSubjectId, onImport, onClose }) => {
  // --- Estados do Formulário ---
  const [tab, setTab] = useState<'arquivo' | 'pesquisa'>('arquivo');
  const [file, setFile] = useState<File | null>(null);
  const [searchTopic, setSearchTopic] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [nivel, setNivel] = useState('graduacao');
  const [difficulty, setDifficulty] = useState('medio');
  const [quantity, setQuantity] = useState(5);
  const [instrucoes, setInstrucoes] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multipla_escolha', 'vf']);

  // --- Estados de Processamento ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'setup' | 'running' | 'results'>('setup');
  const [agentStage, setAgentStage] = useState<'extracting' | 'generating' | 'reviewing' | 'done'>('extracting');
  const [agentDetail, setAgentDetail] = useState('');
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [outputTab, setOutputTab] = useState<'questionario' | 'gabarito' | 'historico'>('questionario');
  const [history, setHistory] = useState<any[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [aiProvider, setAiProviderLocal] = useState<AIProvider>(getAIProvider());

  const handleAiChange = (val: AIProvider) => {
    setAiProviderLocal(val);
    setAIProvider(val);
    addLog(`Provedor de IA: ${val.toUpperCase()}`);
  };

  const addLog = (msg: string) => {
    setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  useEffect(() => {
    addLog("Componente QuizTheos Pro inicializado.");
  }, []);

  useEffect(() => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (sub) setDisciplina(sub.name);
  }, [selectedSubjectId, subjects]);

  // --- Funções Auxiliares ---
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      addLog(`Arquivo selecionado: ${e.target.files[0].name}`);
    }
  };

  const generateQuiz = async () => {
    const themeFromInputs = disciplina.trim() || searchTopic.trim() || instrucoes.trim();
    
    if (!themeFromInputs && !file) {
      alert('Por favor, informe ao menos uma Disciplina, Tema ou envie um Arquivo.');
      return;
    }

    if (selectedTypes.length === 0) {
      alert('Selecione ao menos um tipo de questão.');
      return;
    }

    setStep('running');
    setIsGenerating(true);
    addLog(`Iniciando geração. Provedor: ${aiProvider.toUpperCase()}`);
    setErrorStatus(null);

    try {
      const config = {
        subjectId: selectedSubjectId || '',
        subjectName: disciplina.trim() || searchTopic.trim() || (file ? file.name : (instrucoes.trim().substring(0, 30) + '...')),
        quantity: quantity,
        difficulty: difficulty === 'facil' ? 'Fácil' : difficulty === 'dificil' ? 'Difícil' : 'Médio',
        types: selectedTypes,
        nivel: nivel,
        instrucoes: instrucoes
      };

      let fileToUse = file;
      if (!fileToUse) {
        addLog("Criando contexto a partir dos campos de texto...");
        const contextText = `Tema/Disciplina: ${config.subjectName}\nInstruções: ${instrucoes}\nPublico: ${nivel}\nDificuldade: ${config.difficulty}`;
        fileToUse = new File([contextText], "contexto_geracao.txt", { type: "text/plain" });
      }

      const questions = await runAgentPipeline(
        fileToUse,
        config,
        (stage, detail) => {
          setAgentStage(stage);
          setAgentDetail(detail || '');
          addLog(`${stage.toUpperCase()}: ${detail}`);
          // Aviso especial se PDF não extraiu texto suficiente
          if (stage === 'extracting' && detail && detail.includes('0 caracteres')) {
            addLog('⚠️ PDF sem texto selecionável detectado. Use a aba "Tema" e descreva o conteúdo manualmente, ou converta o PDF para um com texto real.');
          }
        }
      );

      if (!questions || questions.length === 0) {
        throw new Error("A IA não retornou nenhuma questão válida. Tente mudar o modelo ou o tema.");
      }

      const result = {
        metadata: {
          disciplina: config.subjectName,
          nivel: nivel,
          dificuldade: config.difficulty,
          totalQuestoes: questions.length,
          geradoEm: new Date().toISOString()
        },
        questionario: questions.map((q, i) => ({
          id: `Q${i+1}`,
          ...q,
          tipo: q.options && q.options.length > 0 ? 'multipla_escolha' : 'vf',
          enunciado: q.text,
          opcoes: q.options ? q.options.map((opt, idx) => ({ letra: String.fromCharCode(65 + idx), texto: opt })) : [],
          resposta_correta: q.options && q.options.length > 0 ? String.fromCharCode(65 + q.correctOptionIndex) : (q.correctOptionIndex === 0 ? 'V' : 'F'),
          justificativa: q.explanation
        }))
      };

      addLog(`Sucesso! ${questions.length} questões prontas.`);
      setGeneratedData(result);
      setHistory([result, ...history]);
      setStep('results');
      setOutputTab('questionario');
    } catch (err: any) {
      const msg = err.message || 'Erro desconhecido';
      addLog(`ERRO: ${msg}`);
      setErrorStatus(msg);
      setStep('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderQuestion = (q: any) => (
    <div key={q.id} className="qt-q-card">
      <div className="qt-q-num">{q.id}</div>
      <div className="qt-q-text">{q.enunciado}</div>
      {q.tipo === 'multipla_escolha' && (
        <div className="qt-options">
          {q.opcoes.map((opt: any) => (
            <div key={opt.letra} className="qt-option">
              <span className="qt-opt-letter">{opt.letra})</span>
              <span>{opt.texto}</span>
            </div>
          ))}
        </div>
      )}
      {q.tipo === 'vf' && (
        <div className="qt-options-vf">
          <div className={`qt-btn-sec ${q.resposta_correta === 'V' ? 'active-correct' : ''}`}>( V )</div>
          <div className={`qt-btn-sec ${q.resposta_correta === 'F' ? 'active-correct' : ''}`}>( F )</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="quiztheos-wrapper">
      <div className="qt-header">
        <div className="qt-header-ornament">Sistema Teológico Acadêmico CCIT</div>
        <h1>Quiz<span>Theos</span> <span style={{fontSize:'0.55em', color:'var(--gold3)', letterSpacing:'2px'}}>PRO</span></h1>
        <div className="qt-header-sub">Geratriz de Questões de Alta Performance</div>
      </div>

      <div className="qt-container">
        <aside className="qt-panel">
          <div className="qt-panel-header">
            <Settings size={14} className="text-gold3" />
            <span className="qt-panel-title">Parâmetros de Geração</span>
          </div>

          <div className="qt-tabs">
            <div className={`qt-tab ${tab === 'arquivo' ? 'active' : ''}`} onClick={() => setTab('arquivo')}>📄 Material</div>
            <div className={`qt-tab ${tab === 'pesquisa' ? 'active' : ''}`} onClick={() => setTab('pesquisa')}>🔍 Tema</div>
          </div>

          <div className="qt-panel-body">
            {tab === 'arquivo' ? (
              <div>
                <label className="qt-field-label">📎 Upload de Material (PDF)</label>
                <div className="qt-upload-zone" onClick={() => document.getElementById('file-input')?.click()}>
                   <input type="file" id="file-input" hidden onChange={handleFileChange} accept=".pdf,.docx,.pptx" />
                   <span className="qt-upload-icon">📜</span>
                   <div className="qt-upload-text">
                      <strong>Clique para anexar</strong>
                      PDF · DOCX · PPTX
                   </div>
                   {file && <div className="qt-file-name">{file.name}</div>}
                </div>
              </div>
            ) : (
              <div>
                <label className="qt-field-label">🔎 Assunto Principal</label>
                <input 
                  className="qt-input" 
                  placeholder="Ex: Teologia do Pentateuco..." 
                  value={searchTopic}
                  onChange={e => setSearchTopic(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="qt-field-label">🏛 Disciplina Atual</label>
              <input className="qt-input" value={disciplina} readOnly disabled />
            </div>

            <div>
              <label className="qt-field-label">🧠 Motor de IA</label>
              <select className="qt-select" value={aiProvider} onChange={e => handleAiChange(e.target.value as AIProvider)}>
                <option value="groq">Groq (Llama 3.3) — Ultra Rápido</option>
                <option value="openai">ChatGPT (GPT-4o-mini) — OpenAI</option>
                <option value="gemini">Google Gemini (Flash/Pro)</option>
              </select>
              {aiProvider === 'openai' && !getProviderKey('openai') && (
                <div style={{fontSize:'10px', color:'#ff9966', marginTop:'4px', padding:'5px 8px', background:'rgba(255,100,0,0.12)', borderRadius:'4px', border:'1px solid rgba(255,100,0,0.3)'}}>
                  ⚠️ Adicione VITE_OPENAI_API_KEY no arquivo .env para usar o ChatGPT
                </div>
              )}
            </div>

            <div>
              <label className="qt-field-label">⚖ Dificuldade</label>
              <select className="qt-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label className="qt-field-label">📋 Tipos de Questão</label>
              <div className="qt-types-grid">
                {[{id:'multipla_escolha', label:'Obj'}, {id:'vf', label:'V/F'}, {id:'dissertativa', label:'Dis'}].map(t => (
                  <div key={t.id} className={`qt-type-item ${selectedTypes.includes(t.id) ? 'active' : ''}`} onClick={() => toggleType(t.id)}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="qt-field-label">🔢 Quantidade: {quantity}</label>
              <input type="range" min={1} max={20} value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{width:'100%', accentColor:'var(--gold)'}} />
            </div>

            <button className="qt-btn-generate" disabled={isGenerating} onClick={generateQuiz}>
              {isGenerating ? '✦ Processando...' : '✦ Gerar Questões ✦'}
            </button>
          </div>
        </aside>

        <main className="qt-output">
          <div className="qt-tabs">
            <div className={`qt-header-tab ${outputTab === 'questionario' ? 'active' : ''}`} onClick={() => setOutputTab('questionario')}>
              <FileText size={16} /> Questionário
            </div>
            <div className={`qt-header-tab ${outputTab === 'gabarito' ? 'active' : ''}`} onClick={() => setOutputTab('gabarito')}>
              <Check size={16} /> Gabarito Comentado
            </div>
          </div>

          <div className="qt-output-body custom-scrollbar">
            {generatedData && (
              <div className="qt-toolbar">
                <div className="qt-toolbar-info">
                  <Sparkles size={14} className="text-gold2" />
                  <span>{generatedData.questionario.length} questões geradas</span>
                </div>
                <div className="qt-toolbar-actions">
                  <button className="qt-btn-sec" onClick={() => window.print()} title="Imprimir"><Printer size={16} /></button>
                  {onImport && (
                    <button className="qt-btn-primary" onClick={() => {
                        onImport(generatedData.questionario.map((q:any) => ({
                          text: q.enunciado,
                          options: q.opcoes.map((o:any) => o.texto),
                          correctOptionIndex: typeof q.resposta_correta === 'string' && q.resposta_correta.length === 1 ? q.resposta_correta.charCodeAt(0) - 65 : (q.resposta_correta === 'V' ? 0 : 1),
                          explanation: q.justificativa,
                          category: 'IA'
                        })));
                    }}>
                      <Plus size={16} /> Salvar no Banco
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 'setup' && (
              <div className="qt-empty-state">
                <div className="qt-empty-cross">{errorStatus ? '⚠️' : '✝'}</div>
                <p className="qt-panel-title">{errorStatus ? 'Falha na IA' : 'Sistema em Standby'}</p>
                
                <div className="qt-debug-panel">
                  <div className="qt-debug-header">Logs do Sistema</div>
                  <div className="qt-debug-content">
                    {debugLogs.length === 0 ? 'Aguardando parâmetros...' : debugLogs.map((log, i) => (
                      <div key={i} className="qt-debug-line">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 'running' && (
              <div className="qt-loading-state">
                <div className="qt-spinner"></div>
                <p className="qt-loading-title">{agentStage.toUpperCase()}</p>
                <p className="qt-header-sub">{agentDetail}</p>
              </div>
            )}

            {step === 'results' && generatedData && (
              <div className="qt-results-view">
                {outputTab === 'questionario' && (
                  <div className="qt-q-list">
                    {generatedData.questionario.map(renderQuestion)}
                  </div>
                )}
                {outputTab === 'gabarito' && (
                  <div className="qt-gabarito-list">
                    {generatedData.questionario.map((q: any) => (
                      <div key={q.id} className="qt-q-card gabarito">
                        <div className="qt-q-num">QUESTÃO {q.id} · GABARITO: {q.resposta_correta}</div>
                        <div className="qt-q-text">{q.enunciado}</div>
                        <div className="qt-justification">
                           <strong>Justificativa Técnica:</strong> {q.justificativa}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="qt-action-bar">
             <button className="qt-btn-sec" onClick={onClose}>Fechar Painel</button>
          </div>
        </main>
      </div>
    </div>
  );
};
