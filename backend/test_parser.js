const officeParser = require('officeparser');
const pdf = require('pdf-parse');
const path = require('path');
const fs = require('fs');

async function testExtraction(fileName) {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`Arquivo ${fileName} não encontrado para teste.`);
        return;
    }

    console.log(`--- Testando: ${fileName} ---`);
    
    // Teste officeParser
    try {
        console.log("Tentando officeParser...");
        const data = await officeParser.parseOffice(filePath);
        console.log("officeParser (primeiros 100 caracteres):", data.substring(0, 100));
    } catch (e) {
        console.log("Erro officeParser:", e.message);
    }

    // Teste pdf-parse (se for PDF)
    if (fileName.toLowerCase().endsWith('.pdf')) {
        try {
            console.log("Tentando pdf-parse...");
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            console.log("pdf-parse (primeiros 100 caracteres):", data.text.substring(0, 100));
        } catch (e) {
            console.log("Erro pdf-parse:", e.message);
        }
    }
}

async function run() {
    // Tenta encontrar algum arquivo PDF ou PPTX na raiz ou uploads
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.pdf') || f.endsWith('.pptx') || f.endsWith('.docx'));
    if (files.length > 0) {
        for (const file of files) {
            await testExtraction(file);
        }
    } else {
        console.log("Nenhum arquivo PDF/PPTX/DOCX encontrado em " + __dirname);
    }
}

run();
