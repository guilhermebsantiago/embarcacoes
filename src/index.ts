import express, { Request, Response } from 'express';
import path from 'path';
import * as db from './database';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// AUTENTICAÇÃO
// ============================================

app.get('/api/test-connection', async (_req: Request, res: Response) => {
  const connected = await db.testConnection();
  res.json({ connected });
});

app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await db.login(email, password);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CONSULTAS
// ============================================

app.get('/api/consultas/clientes-embarcacoes', async (_req: Request, res: Response) => {
  try {
    const result = await db.getClientesEmbarcacoes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/consultas/orgaos-processos', async (_req: Request, res: Response) => {
  try {
    const result = await db.getOrgaosProcessosAtivos();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/consultas/documentos-clientes', async (_req: Request, res: Response) => {
  try {
    const result = await db.getDocumentosClientesComEmbarcacoes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/consultas/processos-inspecoes', async (_req: Request, res: Response) => {
  try {
    const result = await db.getProcessosComInspecoes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/consultas/embarcacao-maior', async (_req: Request, res: Response) => {
  try {
    const result = await db.getEmbarcacaoMaiorCapacidade();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/consultas/painel-geral', async (_req: Request, res: Response) => {
  try {
    const result = await db.getPainelGeral();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CLIENT (Person + Client)
// ============================================

app.get('/api/client', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarClientes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/client', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, cpf, rg, phone } = req.body;
    await db.inserirCliente(firstName, lastName, cpf, rg || null, phone || null);
    res.json({ success: true, message: 'Cliente cadastrado com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/client/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { firstName, lastName, cpf, rg, phone } = req.body;
    await db.atualizarCliente(id, firstName, lastName, cpf, rg || null, phone || null);
    res.json({ success: true, message: 'Cliente atualizado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/client/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerCliente(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    }
    res.json({ success: true, message: 'Cliente removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USER
// ============================================

app.get('/api/user', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarUsuarios();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/user', async (req: Request, res: Response) => {
  try {
    const { idPerson, role, password, email } = req.body;
    await db.inserirUsuario(idPerson, role, password, email);
    res.json({ success: true, message: 'Usuário criado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/user/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { role, email, password } = req.body;
    await db.atualizarUsuario(id, role, email, password);
    res.json({ success: true, message: 'Usuário atualizado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/user/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerUsuario(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    res.json({ success: true, message: 'Usuário removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// VESSEL
// ============================================

app.get('/api/vessel', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarEmbarcacoes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/vessel', async (req: Request, res: Response) => {
  try {
    const { nome, tipo, capacidade, tamanho, cpfCliente } = req.body;
    await db.inserirEmbarcacao(nome, tipo, capacidade, tamanho, cpfCliente);
    res.json({ success: true, message: 'Embarcação registrada via Stored Procedure!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/vessel/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, tipo, capacidade, tamanho } = req.body;
    await db.atualizarEmbarcacao(id, nome, tipo, capacidade, tamanho);
    res.json({ success: true, message: 'Embarcação atualizada!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/vessel/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerEmbarcacao(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Embarcação não encontrada' });
    }
    res.json({ success: true, message: 'Embarcação removida!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ORGAN
// ============================================

app.get('/api/organ', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarOrgaos();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/organ', async (req: Request, res: Response) => {
  try {
    const { organName, sail } = req.body;
    await db.inserirOrgao(organName, sail || '');
    res.json({ success: true, message: 'Órgão cadastrado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/organ/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { organName, sail } = req.body;
    await db.atualizarOrgao(id, organName, sail || '');
    res.json({ success: true, message: 'Órgão atualizado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/organ/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerOrgao(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Órgão não encontrado' });
    }
    res.json({ success: true, message: 'Órgão removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROCESS
// ============================================

app.get('/api/process', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarProcessos();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/process', async (req: Request, res: Response) => {
  try {
    const { processName, processNumber, status, idOrgan } = req.body;
    await db.inserirProcesso(processName, processNumber, status || 'Pendente', idOrgan);
    res.json({ success: true, message: 'Processo cadastrado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/process/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { processName, processNumber, status, idOrgan } = req.body;
    await db.atualizarProcesso(id, processName, processNumber, status, idOrgan);
    res.json({ success: true, message: 'Processo atualizado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/process/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerProcesso(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Processo não encontrado' });
    }
    res.json({ success: true, message: 'Processo removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DOCUMENT
// ============================================

app.get('/api/document', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarDocumentos();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/document', async (req: Request, res: Response) => {
  try {
    const { name, path, idClient, idOrgan } = req.body;
    await db.inserirDocumento(name, path, idClient, idOrgan || null);
    res.json({ success: true, message: 'Documento cadastrado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/document/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, path, idClient, idOrgan } = req.body;
    await db.atualizarDocumento(id, name, path, idClient, idOrgan || null);
    res.json({ success: true, message: 'Documento atualizado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/document/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.removerDocumento(parseInt(req.params.id));
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    res.json({ success: true, message: 'Documento removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// INSPECTION
// ============================================

app.get('/api/inspection', async (_req: Request, res: Response) => {
  try {
    const result = await db.listarInspecoes();
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/inspection', async (req: Request, res: Response) => {
  try {
    const { idProcess, code, name, date } = req.body;
    await db.inserirInspecao(idProcess, code, name, date);
    res.json({ success: true, message: 'Inspeção cadastrada!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/inspection/:idProcess/:code', async (req: Request, res: Response) => {
  try {
    const idProcess = parseInt(req.params.idProcess);
    const code = req.params.code;
    const { name, date } = req.body;
    await db.atualizarInspecao(idProcess, code, name, date);
    res.json({ success: true, message: 'Inspeção atualizada!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/inspection/:idProcess/:code', async (req: Request, res: Response) => {
  try {
    const result = await db.removerInspecao(
      parseInt(req.params.idProcess), 
      decodeURIComponent(req.params.code)
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Inspeção não encontrada' });
    }
    res.json({ success: true, message: 'Inspeção removida!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PHONES
// ============================================

app.get('/api/phones/:idClient', async (req: Request, res: Response) => {
  try {
    const result = await db.listarTelefonesPorCliente(parseInt(req.params.idClient));
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/phones', async (req: Request, res: Response) => {
  try {
    const { idClient, phone } = req.body;
    await db.inserirTelefone(idClient, phone);
    res.json({ success: true, message: 'Telefone adicionado!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/phones/:idClient/:phone', async (req: Request, res: Response) => {
  try {
    const result = await db.removerTelefone(
      parseInt(req.params.idClient), 
      decodeURIComponent(req.params.phone)
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Telefone não encontrado' });
    }
    res.json({ success: true, message: 'Telefone removido!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// START
// ============================================

app.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚢 SISTEMA DE GERENCIAMENTO DE EMBARCAÇÕES               ║
║     Servidor: http://localhost:${PORT}                         ║
╚══════════════════════════════════════════════════════════════╝
  `);
  await db.testConnection();
});
