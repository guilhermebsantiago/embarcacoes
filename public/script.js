const API = '/api';
let currentUser = null;

let cacheClientes = [];
let cacheOrgaos = [];
let cacheProcessos = [];
let cacheUsuarios = [];
let cacheEmbarcacoes = [];
let cacheDocumentos = [];
let cacheInspecoes = [];

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkSession();
});

function checkSession() {
  const saved = localStorage.getItem('user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showApp();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      showApp();
      toast('Login realizado com sucesso!', 'success');
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro ao conectar ao servidor', 'error');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('user');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  document.getElementById('userName').textContent = `${currentUser.firstname} ${currentUser.lastname}`;
  document.getElementById('userRole').textContent = currentUser.Role;
  loadAllData();
}

function isAdmin() {
  return currentUser && (currentUser.Role === 'Admin' || currentUser.Role === 'Gerente');
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

async function loadAllData() {
  await Promise.all([
    loadClientes(),
    loadOrgaos(),
    loadProcessos(),
    loadUsuarios(),
    loadEmbarcacoes(),
    loadDocumentos(),
    loadInspecoes()
  ]);
}

function toggleForm(entity) {
  const form = document.getElementById('form' + capitalize(entity));
  const btn = document.getElementById('btnNovo' + capitalize(entity));
  const title = document.getElementById('form' + capitalize(entity) + 'Title');
  const isOpen = form.style.display !== 'none';
  
  if (isOpen) {
    form.style.display = 'none';
    btn.classList.remove('open');
    btn.innerHTML = '<span class="btn-icon">+</span> Novo';
    resetForm(entity);
  } else {
    form.style.display = 'block';
    btn.classList.add('open');
    btn.innerHTML = '<span class="btn-icon">×</span> Fechar';
    title.textContent = 'Novo ' + getEntityName(entity);
    resetForm(entity);
    loadSelectsForEntity(entity);
  }
}

function openFormForEdit(entity, data) {
  const form = document.getElementById('form' + capitalize(entity));
  const btn = document.getElementById('btnNovo' + capitalize(entity));
  const title = document.getElementById('form' + capitalize(entity) + 'Title');
  
  form.style.display = 'block';
  btn.classList.add('open');
  btn.innerHTML = '<span class="btn-icon">×</span> Fechar';
  title.textContent = 'Editar ' + getEntityName(entity);
  
  loadSelectsForEntity(entity);
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getEntityName(entity) {
  const names = {
    clientes: 'Cliente',
    usuarios: 'Usuário',
    embarcacoes: 'Embarcação',
    orgaos: 'Órgão',
    processos: 'Processo',
    documentos: 'Documento',
    inspecoes: 'Inspeção'
  };
  return names[entity] || entity;
}

function resetForm(entity) {
  const formMap = {
    clientes: 'formClienteData',
    usuarios: 'formUsuarioData',
    embarcacoes: 'formEmbarcacaoData',
    orgaos: 'formOrgaoData',
    processos: 'formProcessoData',
    documentos: 'formDocumentoData',
    inspecoes: 'formInspecaoData'
  };
  const form = document.getElementById(formMap[entity]);
  if (form) form.reset();
}

async function loadSelectsForEntity(entity) {
  if (['embarcacoes', 'documentos'].includes(entity)) {
    populateSelect('selectClienteEmbarcacao', cacheClientes, 'cpf', 
      item => `${item.firstname} ${item.lastname} - ${item.cpf}`);
    populateSelect('selectClienteDocumento', cacheClientes, 'id_person', 
      item => `${item.firstname} ${item.lastname}`);
  }
  if (['processos', 'documentos'].includes(entity)) {
    populateSelect('selectOrgaoProcesso', cacheOrgaos, 'id', 
      item => `${item.organname} (${item.sail || '-'})`);
    populateSelect('selectOrgaoDocumento', cacheOrgaos, 'id', 
      item => item.organname, true);
  }
  if (entity === 'inspecoes') {
    populateSelect('selectProcessoInspecao', cacheProcessos, 'id', 
      item => `${item.processname} - ${item.processnumber}`);
  }
}

function populateSelect(selectId, data, valueKey, labelFn, addEmpty = false) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = addEmpty ? '<option value="">Nenhum</option>' : '<option value="">Selecione...</option>';
  
  data.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = labelFn(item);
    select.appendChild(opt);
  });
  
  if (currentValue) select.value = currentValue;
}

async function loadClientes() {
  try {
    const res = await fetch(`${API}/client`);
    const data = await res.json();
    if (data.success) {
      cacheClientes = data.data;
      renderClientes(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderClientes(rows) {
  const container = document.getElementById('tableClientes');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhum cliente cadastrado</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>CPF</th><th>RG</th><th>Telefone</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row.id_person}</td>
      <td>${row.firstname} ${row.lastname}</td>
      <td>${row.cpf}</td>
      <td>${row.rg || '—'}</td>
      <td>${row.phone || '—'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editCliente(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('clientes', ${row.id_person}, '${row.firstname} ${row.lastname}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} cliente(s)</div>`;
  container.innerHTML = html;
}

function editCliente(row) {
  openFormForEdit('clientes', row);
  const form = document.getElementById('formClienteData');
  form.editId.value = row.id_person;
  form.firstName.value = row.firstname;
  form.lastName.value = row.lastname;
  form.cpf.value = row.cpf;
  form.rg.value = row.rg || '';
  form.phone.value = row.phone || '';
}

async function saveCliente(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  const payload = {
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    cpf: form.cpf.value,
    rg: form.rg.value || null,
    phone: form.phone.value || null
  };
  
  try {
    const url = editId ? `${API}/client/${editId}` : `${API}/client`;
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('clientes');
      loadClientes();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadUsuarios() {
  try {
    const res = await fetch(`${API}/user`);
    const data = await res.json();
    if (data.success) {
      cacheUsuarios = data.data;
      renderUsuarios(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderUsuarios(rows) {
  const container = document.getElementById('tableUsuarios');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhum usuário cadastrado</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>Email</th><th>Perfil</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    const canEdit = isAdmin();
    html += `<tr>
      <td>${row.id_person}</td>
      <td>${row.firstname} ${row.lastname}</td>
      <td>${row.email}</td>
      <td><span class="badge">${row.Role}</span></td>
      <td class="actions">
        ${canEdit ? `<button class="btn btn-warning btn-sm" onclick='editUsuario(${JSON.stringify(row)})'>✏️ Editar</button>` : ''}
        ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="confirmDelete('usuarios', ${row.id_person}, '${row.email}')">🗑️</button>` : ''}
        ${!canEdit ? '<span style="color: var(--text-muted)">Sem permissão</span>' : ''}
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} usuário(s)</div>`;
  container.innerHTML = html;
}

function editUsuario(row) {
  openFormForEdit('usuarios', row);
  const form = document.getElementById('formUsuarioData');
  form.editId.value = row.id_person;
  form.firstName.value = row.firstname;
  form.lastName.value = row.lastname;
  form.role.value = row.Role;
  form.email.value = row.email;
  form.password.value = '';
  form.password.placeholder = 'Deixe vazio para manter a atual';
  form.password.required = false;
}

async function saveUsuario(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  const payload = {
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    role: form.role.value,
    email: form.email.value,
    password: form.password.value || undefined
  };
  
  try {
    const url = editId ? `${API}/user/${editId}` : `${API}/user`;
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('usuarios');
      form.password.required = true;
      form.password.placeholder = '';
      loadUsuarios();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadEmbarcacoes() {
  try {
    const res = await fetch(`${API}/vessel`);
    const data = await res.json();
    if (data.success) {
      cacheEmbarcacoes = data.data;
      renderEmbarcacoes(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderEmbarcacoes(rows) {
  const container = document.getElementById('tableEmbarcacoes');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhuma embarcação cadastrada</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>Tipo</th><th>Capacidade</th><th>Tamanho</th><th>Proprietário</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row.id}</td>
      <td>${row.Name}</td>
      <td>${row.Type || '—'}</td>
      <td>${row.capacity} pessoas</td>
      <td>${row.Size}m</td>
      <td>${row.proprietario || '—'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editEmbarcacao(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('embarcacoes', ${row.id}, '${row.Name}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} embarcação(ões)</div>`;
  container.innerHTML = html;
}

function editEmbarcacao(row) {
  openFormForEdit('embarcacoes', row);
  const form = document.getElementById('formEmbarcacaoData');
  form.editId.value = row.id;
  form.nome.value = row.Name;
  form.tipo.value = row.Type || 'Lancha';
  form.capacidade.value = row.capacity;
  form.tamanho.value = row.Size;
  
  setTimeout(() => {
    const select = document.getElementById('selectClienteEmbarcacao');
    if (select && row.cpf_proprietario) {
      select.value = row.cpf_proprietario;
    }
  }, 100);
}

async function saveEmbarcacao(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  try {
    let res;
    if (editId) {
      res = await fetch(`${API}/vessel/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.value,
          tipo: form.tipo.value,
          capacidade: parseInt(form.capacidade.value),
          tamanho: parseFloat(form.tamanho.value)
        })
      });
    } else {
      res = await fetch(`${API}/vessel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome.value,
          tipo: form.tipo.value,
          capacidade: parseInt(form.capacidade.value),
          tamanho: parseFloat(form.tamanho.value),
          cpfCliente: form.idCliente.value
        })
      });
    }
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('embarcacoes');
      loadEmbarcacoes();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadOrgaos() {
  try {
    const res = await fetch(`${API}/organ`);
    const data = await res.json();
    if (data.success) {
      cacheOrgaos = data.data;
      renderOrgaos(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderOrgaos(rows) {
  const container = document.getElementById('tableOrgaos');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhum órgão cadastrado</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>Sigla</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row.id}</td>
      <td>${row.organname}</td>
      <td>${row.sail || '—'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editOrgao(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('orgaos', ${row.id}, '${row.organname}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} órgão(s)</div>`;
  container.innerHTML = html;
}

function editOrgao(row) {
  openFormForEdit('orgaos', row);
  const form = document.getElementById('formOrgaoData');
  form.editId.value = row.id;
  form.organName.value = row.organname;
  form.sail.value = row.sail || '';
}

async function saveOrgao(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  const payload = {
    organName: form.organName.value,
    sail: form.sail.value || ''
  };
  
  try {
    const url = editId ? `${API}/organ/${editId}` : `${API}/organ`;
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('orgaos');
      loadOrgaos();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadProcessos() {
  try {
    const res = await fetch(`${API}/process`);
    const data = await res.json();
    if (data.success) {
      cacheProcessos = data.data;
      renderProcessos(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderProcessos(rows) {
  const container = document.getElementById('tableProcessos');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhum processo cadastrado</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>Número</th><th>Status</th><th>Órgão</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row.id}</td>
      <td>${row.processname}</td>
      <td>${row.processnumber}</td>
      <td><span class="badge">${row.status}</span></td>
      <td>${row.organname || '—'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editProcesso(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('processos', ${row.id}, '${row.processname}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} processo(s)</div>`;
  container.innerHTML = html;
}

function editProcesso(row) {
  openFormForEdit('processos', row);
  const form = document.getElementById('formProcessoData');
  form.editId.value = row.id;
  form.processName.value = row.processname;
  form.processNumber.value = row.processnumber;
  form.status.value = row.status;
  
  setTimeout(() => {
    const orgao = cacheOrgaos.find(o => o.organname === row.organname);
    if (orgao) {
      document.getElementById('selectOrgaoProcesso').value = orgao.id;
    }
  }, 100);
}

async function saveProcesso(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  const payload = {
    processName: form.processName.value,
    processNumber: form.processNumber.value,
    status: form.status.value,
    idOrgan: parseInt(form.idOrgan.value)
  };
  
  try {
    const url = editId ? `${API}/process/${editId}` : `${API}/process`;
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('processos');
      loadProcessos();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadDocumentos() {
  try {
    const res = await fetch(`${API}/document`);
    const data = await res.json();
    if (data.success) {
      cacheDocumentos = data.data;
      renderDocumentos(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderDocumentos(rows) {
  const container = document.getElementById('tableDocumentos');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhum documento cadastrado</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Nome</th><th>Caminho</th><th>Cliente</th><th>Órgão</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    html += `<tr>
      <td>${row.id}</td>
      <td>${row.Name}</td>
      <td>${row.Path}</td>
      <td>${row.cpf_cliente || '—'}</td>
      <td>${row.organname || '—'}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editDocumento(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('documentos', ${row.id}, '${row.Name}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} documento(s)</div>`;
  container.innerHTML = html;
}

function editDocumento(row) {
  openFormForEdit('documentos', row);
  const form = document.getElementById('formDocumentoData');
  form.editId.value = row.id;
  form.name.value = row.Name;
  form.path.value = row.Path;
  
  setTimeout(() => {
    const cliente = cacheClientes.find(c => c.cpf === row.cpf_cliente);
    if (cliente) {
      document.getElementById('selectClienteDocumento').value = cliente.id_person;
    }
    const orgao = cacheOrgaos.find(o => o.organname === row.organname);
    if (orgao) {
      document.getElementById('selectOrgaoDocumento').value = orgao.id;
    }
  }, 100);
}

async function saveDocumento(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.editId.value;
  
  const payload = {
    name: form.name.value,
    path: form.path.value,
    idClient: parseInt(form.idClient.value),
    idOrgan: form.idOrgan.value ? parseInt(form.idOrgan.value) : null
  };
  
  try {
    const url = editId ? `${API}/document/${editId}` : `${API}/document`;
    const method = editId ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('documentos');
      loadDocumentos();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function loadInspecoes() {
  try {
    const res = await fetch(`${API}/inspection`);
    const data = await res.json();
    if (data.success) {
      cacheInspecoes = data.data;
      renderInspecoes(data.data);
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

function renderInspecoes(rows) {
  const container = document.getElementById('tableInspecoes');
  
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="table-empty">Nenhuma inspeção cadastrada</div>';
    return;
  }
  
  let html = `<table class="data-table">
    <thead><tr>
      <th>Código</th><th>Nome</th><th>Data</th><th>Processo</th><th>Ações</th>
    </tr></thead><tbody>`;
  
  rows.forEach(row => {
    const date = new Date(row.date).toLocaleDateString('pt-BR');
    const rowData = JSON.stringify(row).replace(/'/g, "\\'");
    html += `<tr>
      <td>${row.code}</td>
      <td>${row.Name}</td>
      <td>${date}</td>
      <td>${row.processname}</td>
      <td class="actions">
        <button class="btn btn-warning btn-sm" onclick='editInspecao(${JSON.stringify(row)})'>✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('inspecoes', ${row.id_process}, '${row.code}', '${row.Name}')">🗑️</button>
      </td>
    </tr>`;
  });
  
  html += `</tbody></table><div class="table-count">Total: ${rows.length} inspeção(ões)</div>`;
  container.innerHTML = html;
}

function editInspecao(row) {
  openFormForEdit('inspecoes', row);
  const form = document.getElementById('formInspecaoData');
  form.editIdProcess.value = row.id_process;
  form.editCode.value = row.code;
  form.code.value = row.code;
  form.code.readOnly = true;
  form.name.value = row.Name;
  
  const dateObj = new Date(row.date);
  const dateStr = dateObj.toISOString().split('T')[0];
  form.date.value = dateStr;
  
  setTimeout(() => {
    document.getElementById('selectProcessoInspecao').value = row.id_process;
    document.getElementById('selectProcessoInspecao').disabled = true;
  }, 100);
}

async function saveInspecao(e) {
  e.preventDefault();
  const form = e.target;
  const editIdProcess = form.editIdProcess.value;
  const editCode = form.editCode.value;
  const isEdit = editIdProcess && editCode;
  
  try {
    let res;
    if (isEdit) {
      res = await fetch(`${API}/inspection/${editIdProcess}/${encodeURIComponent(editCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.value,
          date: form.date.value
        })
      });
    } else {
      res = await fetch(`${API}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idProcess: parseInt(form.idProcess.value),
          code: form.code.value,
          name: form.name.value,
          date: form.date.value
        })
      });
    }
    
    const data = await res.json();
    if (data.success) {
      toast(data.message, 'success');
      toggleForm('inspecoes');
      form.code.readOnly = false;
      document.getElementById('selectProcessoInspecao').disabled = false;
      loadInspecoes();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

function confirmDelete(entity, ...args) {
  const modal = document.getElementById('confirmModal');
  const message = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  
  const itemName = args[args.length - 1];
  message.textContent = `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`;
  
  modal.classList.add('active');
  
  confirmBtn.onclick = () => executeDelete(entity, args);
}

function closeModal() {
  document.getElementById('confirmModal').classList.remove('active');
}

async function executeDelete(entity, args) {
  closeModal();
  
  const endpoints = {
    clientes: `/client/${args[0]}`,
    usuarios: `/user/${args[0]}`,
    embarcacoes: `/vessel/${args[0]}`,
    orgaos: `/organ/${args[0]}`,
    processos: `/process/${args[0]}`,
    documentos: `/document/${args[0]}`,
    inspecoes: `/inspection/${args[0]}/${encodeURIComponent(args[1])}`
  };
  
  try {
    const res = await fetch(`${API}${endpoints[entity]}`, { method: 'DELETE' });
    const data = await res.json();
    
    if (data.success) {
      toast(data.message, 'success');
      loadAllData();
    } else {
      toast(data.error, 'error');
    }
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function executarConsulta(tipo) {
  const container = document.getElementById('consultaResultado');
  container.innerHTML = '<div class="table-empty">Carregando...</div>';

  try {
    const res = await fetch(`${API}/consultas/${tipo}`);
    const data = await res.json();
    
    if (data.success && data.data.length > 0) {
      const columns = Object.keys(data.data[0]);
      let html = `<table class="data-table">
        <thead><tr>${columns.map(c => `<th>${formatColumn(c)}</th>`).join('')}</tr></thead>
        <tbody>`;
      
      data.data.forEach(row => {
        html += '<tr>';
        columns.forEach(col => {
          html += `<td>${formatValue(row[col])}</td>`;
        });
        html += '</tr>';
      });
      
      html += `</tbody></table>
        <div class="table-count">Total: ${data.data.length} resultado(s)</div>`;
      
      container.innerHTML = html;
      toast('Consulta executada!', 'success');
    } else {
      container.innerHTML = '<div class="table-empty">Nenhum resultado encontrado</div>';
    }
  } catch (err) {
    container.innerHTML = `<div class="table-empty">Erro: ${err.message}</div>`;
  }
}

function filterTable(entity) {
  const searchInput = document.getElementById('search' + capitalize(entity));
  const tableContainer = document.getElementById('table' + capitalize(entity));
  const table = tableContainer.querySelector('.data-table');
  
  if (!table || !searchInput) return;
  
  const filter = searchInput.value.toLowerCase().trim();
  const rows = table.querySelectorAll('tbody tr');
  let visibleCount = 0;
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const match = text.includes(filter);
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });
  
  const countDiv = tableContainer.querySelector('.table-count');
  if (countDiv) {
    const totalRows = rows.length;
    if (filter) {
      countDiv.textContent = `Mostrando ${visibleCount} de ${totalRows} registro(s)`;
    } else {
      countDiv.textContent = `Total: ${totalRows} registro(s)`;
    }
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatColumn(name) {
  return name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function formatValue(val) {
  if (val === null || val === undefined) return '<span style="color: var(--text-muted)">—</span>';
  if (typeof val === 'number') return val.toLocaleString('pt-BR');
  return val;
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
