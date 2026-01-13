import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'embarcacoes',
  user: 'postgres',
  password: 'postgres'
});

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ Conexão com PostgreSQL estabelecida!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    return false;
  }
}

// ============================================
// AUTENTICAÇÃO
// ============================================

export async function login(email: string, password: string): Promise<QueryResult> {
  return pool.query(`
    SELECT u.Id_Person, u."Role", u.Email, pe.FirstName, pe.LastName
    FROM "User" u
    INNER JOIN Person pe ON u.Id_Person = pe.Id
    WHERE u.Email = $1 AND u."Password" = $2
  `, [email, password]);
}

// ============================================
// CONSULTAS
// ============================================

export async function getClientesEmbarcacoes(): Promise<QueryResult> {
  return pool.query(`
    SELECT pe.FirstName, pe.LastName, c.CPF, COUNT(v.Id) AS TotalEmbarcacoes
    FROM Person pe
    INNER JOIN Client c ON pe.Id = c.Id_Person
    LEFT JOIN Vessel v ON c.Id_Person = v.Id_Client
    GROUP BY pe.Id, pe.FirstName, pe.LastName, c.CPF
  `);
}

export async function getOrgaosProcessosAtivos(): Promise<QueryResult> {
  return pool.query(`
    SELECT o.OrganName, COUNT(p.Id) AS ProcessosAtivos
    FROM Organ o
    INNER JOIN Process p ON o.Id = p.Id_Organ
    WHERE p.Status = 'Ativo'
    GROUP BY o.Id, o.OrganName
    HAVING COUNT(p.Id) >= 1
  `);
}

export async function getDocumentosClientesComEmbarcacoes(): Promise<QueryResult> {
  return pool.query(`
    SELECT d."Name" AS Documento, pe.FirstName, pe.LastName
    FROM "Document" d
    INNER JOIN Client c ON d.Id_Client = c.Id_Person
    INNER JOIN Person pe ON c.Id_Person = pe.Id
    WHERE d.Id_Client IN (SELECT Id_Client FROM Vessel)
  `);
}

export async function getProcessosComInspecoes(): Promise<QueryResult> {
  return pool.query(`
    SELECT p.ProcessName, p.ProcessNumber, p.Status
    FROM Process p
    WHERE EXISTS (SELECT 1 FROM Inspection i WHERE i.Id_Process = p.Id)
  `);
}

export async function getEmbarcacaoMaiorCapacidade(): Promise<QueryResult> {
  return pool.query(`
    SELECT v."Name", v."Type", v.Capacity, v."Size"
    FROM Vessel v
    WHERE v.Capacity >= ALL (SELECT Capacity FROM Vessel)
  `);
}

export async function getPainelGeral(): Promise<QueryResult> {
  return pool.query(`
    SELECT 
      pe.FirstName || ' ' || pe.LastName AS Cliente,
      c.CPF, u.Email,
      v."Name" AS Embarcacao, v."Type" AS Tipo, v.Capacity AS Capacidade,
      (SELECT COUNT(*) FROM Vessel_Document vd WHERE vd.Id_Vessel = v.Id) AS QtdDocumentos,
      (SELECT COUNT(*) FROM Phones ph WHERE ph.Id_Client = c.Id_Person) AS QtdTelefones
    FROM Person pe
    INNER JOIN Client c ON pe.Id = c.Id_Person
    LEFT JOIN "User" u ON c.Id_User = u.Id_Person
    LEFT JOIN Vessel v ON c.Id_Person = v.Id_Client
  `);
}

// ============================================
// CLIENT (Person + Client juntos)
// ============================================

export async function listarClientes(): Promise<QueryResult> {
  return pool.query(`
    SELECT c.Id_Person, pe.FirstName, pe.LastName, c.CPF, c.Phone, c.RG
    FROM Client c 
    INNER JOIN Person pe ON c.Id_Person = pe.Id 
    ORDER BY pe.FirstName
  `);
}

export async function inserirCliente(
  firstName: string, 
  lastName: string, 
  cpf: string, 
  rg: string | null, 
  phone: string | null
): Promise<QueryResult> {
  // Primeiro insere Person, depois Client
  const personResult = await pool.query(
    'INSERT INTO Person (FirstName, LastName) VALUES ($1, $2) RETURNING Id',
    [firstName, lastName]
  );
  const personId = personResult.rows[0].id;
  
  return pool.query(
    'INSERT INTO Client (Id_Person, Phone, CPF, RG) VALUES ($1, $2, $3, $4) RETURNING *',
    [personId, phone, cpf, rg]
  );
}

export async function atualizarCliente(
  idPerson: number,
  firstName: string,
  lastName: string,
  cpf: string,
  rg: string | null,
  phone: string | null
): Promise<QueryResult> {
  await pool.query(
    'UPDATE Person SET FirstName = $1, LastName = $2 WHERE Id = $3',
    [firstName, lastName, idPerson]
  );
  return pool.query(
    'UPDATE Client SET CPF = $1, RG = $2, Phone = $3 WHERE Id_Person = $4 RETURNING *',
    [cpf, rg, phone, idPerson]
  );
}

export async function removerCliente(idPerson: number): Promise<QueryResult> {
  // CASCADE vai deletar o Client automaticamente
  return pool.query('DELETE FROM Person WHERE Id = $1 RETURNING *', [idPerson]);
}

// ============================================
// USER
// ============================================

export async function listarUsuarios(): Promise<QueryResult> {
  return pool.query(`
    SELECT u.Id_Person, pe.FirstName, pe.LastName, u."Role", u.Email
    FROM "User" u
    INNER JOIN Person pe ON u.Id_Person = pe.Id
    ORDER BY pe.FirstName
  `);
}

export async function inserirUsuario(
  firstName: string,
  lastName: string,
  role: string, 
  password: string, 
  email: string
): Promise<QueryResult> {
  // Primeiro cria uma nova Person para o usuário
  const personResult = await pool.query(
    'INSERT INTO Person (FirstName, LastName) VALUES ($1, $2) RETURNING Id',
    [firstName, lastName]
  );
  const personId = personResult.rows[0].id;
  
  // Depois cria o User vinculado a essa Person
  return pool.query(
    'INSERT INTO "User" (Id_Person, "Role", "Password", Email) VALUES ($1, $2, $3, $4) RETURNING Id_Person, "Role", Email',
    [personId, role, password, email]
  );
}

export async function atualizarUsuario(
  idPerson: number,
  firstName: string,
  lastName: string,
  role: string,
  email: string,
  password?: string
): Promise<QueryResult> {
  // Atualiza os dados da Person
  await pool.query(
    'UPDATE Person SET FirstName = $1, LastName = $2 WHERE Id = $3',
    [firstName, lastName, idPerson]
  );
  
  // Atualiza os dados do User
  if (password) {
    return pool.query(
      'UPDATE "User" SET "Role" = $1, Email = $2, "Password" = $3 WHERE Id_Person = $4 RETURNING *',
      [role, email, password, idPerson]
    );
  }
  return pool.query(
    'UPDATE "User" SET "Role" = $1, Email = $2 WHERE Id_Person = $3 RETURNING *',
    [role, email, idPerson]
  );
}

export async function removerUsuario(idPerson: number): Promise<QueryResult> {
  return pool.query('DELETE FROM "User" WHERE Id_Person = $1 RETURNING *', [idPerson]);
}

// ============================================
// VESSEL
// ============================================

export async function listarEmbarcacoes(): Promise<QueryResult> {
  return pool.query(`
    SELECT v.Id, v."Name", v."Type", v.Capacity, v."Size", 
           c.CPF AS CPF_Proprietario,
           pe.FirstName || ' ' || pe.LastName AS Proprietario
    FROM Vessel v
    LEFT JOIN Client c ON v.Id_Client = c.Id_Person
    LEFT JOIN Person pe ON c.Id_Person = pe.Id
    ORDER BY v."Name"
  `);
}

export async function inserirEmbarcacao(
  nome: string,
  tipo: string,
  capacidade: number,
  tamanho: number,
  cpfCliente: string
): Promise<QueryResult> {
  // Busca o Id do cliente pelo CPF
  const clientResult = await pool.query(
    'SELECT Id_Person FROM Client WHERE CPF = $1',
    [cpfCliente]
  );
  
  if (clientResult.rows.length === 0) {
    throw new Error(`Cliente com CPF ${cpfCliente} não encontrado.`);
  }
  
  const idClient = clientResult.rows[0].id_person;
  
  // Insere a embarcação diretamente (o trigger de validação será executado automaticamente)
  return pool.query(
    'INSERT INTO Vessel ("Name", "Type", Capacity, "Size", Id_Client) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [nome, tipo, capacidade, tamanho, idClient]
  );
}

export async function atualizarEmbarcacao(
  id: number,
  nome: string,
  tipo: string,
  capacidade: number,
  tamanho: number
): Promise<QueryResult> {
  return pool.query(
    'UPDATE Vessel SET "Name" = $1, "Type" = $2, Capacity = $3, "Size" = $4 WHERE Id = $5 RETURNING *',
    [nome, tipo, capacidade, tamanho, id]
  );
}

export async function removerEmbarcacao(id: number): Promise<QueryResult> {
  return pool.query('DELETE FROM Vessel WHERE Id = $1 RETURNING *', [id]);
}

// ============================================
// ORGAN
// ============================================

export async function listarOrgaos(): Promise<QueryResult> {
  return pool.query('SELECT Id, OrganName, Sail FROM Organ ORDER BY OrganName');
}

export async function inserirOrgao(organName: string, sail: string): Promise<QueryResult> {
  return pool.query(
    'INSERT INTO Organ (OrganName, Sail) VALUES ($1, $2) RETURNING *',
    [organName, sail]
  );
}

export async function atualizarOrgao(id: number, organName: string, sail: string): Promise<QueryResult> {
  return pool.query(
    'UPDATE Organ SET OrganName = $1, Sail = $2 WHERE Id = $3 RETURNING *',
    [organName, sail, id]
  );
}

export async function removerOrgao(id: number): Promise<QueryResult> {
  return pool.query('DELETE FROM Organ WHERE Id = $1 RETURNING *', [id]);
}

// ============================================
// PROCESS
// ============================================

export async function listarProcessos(): Promise<QueryResult> {
  return pool.query(`
    SELECT p.Id, p.ProcessName, p.ProcessNumber, p.Status, o.OrganName
    FROM Process p
    LEFT JOIN Organ o ON p.Id_Organ = o.Id
    ORDER BY p.ProcessNumber
  `);
}

export async function inserirProcesso(
  processName: string, 
  processNumber: string, 
  status: string, 
  idOrgan: number
): Promise<QueryResult> {
  return pool.query(
    'INSERT INTO Process (ProcessName, ProcessNumber, Status, Id_Organ) VALUES ($1, $2, $3, $4) RETURNING *',
    [processName, processNumber, status, idOrgan]
  );
}

export async function atualizarProcesso(
  id: number,
  processName: string,
  processNumber: string,
  status: string,
  idOrgan: number
): Promise<QueryResult> {
  return pool.query(
    'UPDATE Process SET ProcessName = $1, ProcessNumber = $2, Status = $3, Id_Organ = $4 WHERE Id = $5 RETURNING *',
    [processName, processNumber, status, idOrgan, id]
  );
}

export async function removerProcesso(id: number): Promise<QueryResult> {
  return pool.query('DELETE FROM Process WHERE Id = $1 RETURNING *', [id]);
}

// ============================================
// DOCUMENT
// ============================================

export async function listarDocumentos(): Promise<QueryResult> {
  return pool.query(`
    SELECT d.Id, d."Name", d."Path", c.CPF AS CPF_Cliente, o.OrganName
    FROM "Document" d
    LEFT JOIN Client c ON d.Id_Client = c.Id_Person
    LEFT JOIN Organ o ON d.Id_Organ = o.Id
    ORDER BY d."Name"
  `);
}

export async function inserirDocumento(
  name: string, 
  path: string, 
  idClient: number, 
  idOrgan: number | null
): Promise<QueryResult> {
  return pool.query(
    'INSERT INTO "Document" ("Name", "Path", Id_Client, Id_Organ) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, path, idClient, idOrgan]
  );
}

export async function atualizarDocumento(
  id: number,
  name: string,
  path: string,
  idClient: number,
  idOrgan: number | null
): Promise<QueryResult> {
  return pool.query(
    'UPDATE "Document" SET "Name" = $1, "Path" = $2, Id_Client = $3, Id_Organ = $4 WHERE Id = $5 RETURNING *',
    [name, path, idClient, idOrgan, id]
  );
}

export async function removerDocumento(id: number): Promise<QueryResult> {
  return pool.query('DELETE FROM "Document" WHERE Id = $1 RETURNING *', [id]);
}

// ============================================
// INSPECTION
// ============================================

export async function listarInspecoes(): Promise<QueryResult> {
  return pool.query(`
    SELECT i.Id_Process, i.Code, i."Name", i.Date, p.ProcessName
    FROM Inspection i
    INNER JOIN Process p ON i.Id_Process = p.Id
    ORDER BY i.Date DESC
  `);
}

export async function inserirInspecao(
  idProcess: number, 
  code: string, 
  name: string, 
  date: string
): Promise<QueryResult> {
  return pool.query(
    'INSERT INTO Inspection (Id_Process, Code, "Name", Date) VALUES ($1, $2, $3, $4) RETURNING *',
    [idProcess, code, name, date]
  );
}

export async function atualizarInspecao(
  idProcess: number,
  oldCode: string,
  name: string,
  date: string
): Promise<QueryResult> {
  return pool.query(
    'UPDATE Inspection SET "Name" = $1, Date = $2 WHERE Id_Process = $3 AND Code = $4 RETURNING *',
    [name, date, idProcess, oldCode]
  );
}

export async function removerInspecao(idProcess: number, code: string): Promise<QueryResult> {
  return pool.query(
    'DELETE FROM Inspection WHERE Id_Process = $1 AND Code = $2 RETURNING *', 
    [idProcess, code]
  );
}

// ============================================
// PHONES
// ============================================

export async function listarTelefonesPorCliente(idClient: number): Promise<QueryResult> {
  return pool.query('SELECT Phone FROM Phones WHERE Id_Client = $1', [idClient]);
}

export async function inserirTelefone(idClient: number, phone: string): Promise<QueryResult> {
  return pool.query(
    'INSERT INTO Phones (Id_Client, Phone) VALUES ($1, $2) RETURNING *',
    [idClient, phone]
  );
}

export async function removerTelefone(idClient: number, phone: string): Promise<QueryResult> {
  return pool.query(
    'DELETE FROM Phones WHERE Id_Client = $1 AND Phone = $2 RETURNING *', 
    [idClient, phone]
  );
}

export default pool;
