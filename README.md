# 🔗 Encurtador de Links Pro

> **Projeto de Estudo** - Sistema completo de encurtamento de URLs com painel administrativo e recursos avançados.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## 📋 Sobre o Projeto

Este é um **projeto de estudo** desenvolvido para demonstrar a implementação de um sistema completo de encurtamento de URLs. O projeto inclui funcionalidades básicas de um encurtador de links com algumas features avançadas para fins educacionais.

### 🎯 Objetivo Educacional

O projeto foi criado para praticar e demonstrar:
- Arquitetura MVC com Node.js e Express
- Operações CRUD com MySQL
- Autenticação JWT e gerenciamento de sessões
- Frontend responsivo com JavaScript vanilla
- Boas práticas de segurança em aplicações web
- Desenvolvimento de APIs RESTful

## 📚 Código Totalmente Documentado

**TODO O CÓDIGO está extensivamente comentado** para facilitar o aprendizado e edição:

### ✅ **Comentários Educativos**
- **Explicações detalhadas** de cada função e classe
- **Exemplos de uso** nos comentários
- **Conceitos técnicos** explicados de forma didática
- **Boas práticas** justificadas nos comentários

### ✅ **Estrutura dos Comentários**
- **Cabeçalhos explicativos** em cada arquivo
- **JSDoc** para funções e métodos
- **Comentários inline** para lógicas complexas
- **Seções organizadas** com separadores visuais

### ✅ **Facilita Edição e Aprendizado**
- Qualquer desenvolvedor pode **entender rapidamente** cada parte
- **Modificações seguras** com contexto completo
- **Aprendizado progressivo** através dos comentários
- **Referência técnica** integrada ao código

## ✨ Funcionalidades

### 🌐 **Frontend Público**
- ✅ Encurtamento de URLs com códigos únicos
- ✅ URLs personalizadas (ex: `/meulink`)
- ✅ QR codes automáticos para cada link
- ✅ Sistema de expiração configurável (1h, 24h, 7 dias)
- ✅ Interface responsiva e moderna
- ✅ Validação em tempo real
- ✅ Download de QR codes com nomes inteligentes

### 🔧 **Painel Administrativo**
- ✅ Dashboard com estatísticas detalhadas
- ✅ Gerenciamento completo de URLs
- ✅ Sistema de autenticação JWT
- ✅ Controle de usuários administradores
- ✅ Filtros e busca avançada
- ✅ Exportação de dados (CSV)
- ✅ Limpeza automática de URLs expiradas

### 📊 **Recursos Avançados**
- ✅ Analytics de cliques (IP, User-Agent, Referer)
- ✅ Cache em memória para performance
- ✅ Compressão GZIP
- ✅ Pool de conexões MySQL
- ✅ Validações de segurança

## 🚀 Como Clonar e Executar

> **💡 Dica:** Quer apenas testar? Acesse a [demonstração online](#-demonstração-online) sem precisar instalar nada!

### 📋 Pré-requisitos

- Node.js 16+
- MySQL Server 5.7+
- Git

### 🔧 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/luispieri/encurtador-link.git
cd encurtador-link
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Execute o script SQL no seu MySQL
mysql -u root -p < database-setup.sql
```

4. **Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas configurações
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=encurtador_links
```

5. **Crie um usuário administrador**
```bash
node create-admin.js
```

6. **Execute a aplicação**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

7. **Acesse a aplicação**
- Site Principal: http://localhost:8080
- Painel Admin: http://localhost:8080/admin

## 🌐 Demonstração Online

### 🔗 **Acesso Público**
O projeto está disponível online para testes e demonstração:

**🌐 URL da Aplicação:** https://encurtador-links-34n9.onrender.com

**⚙️ Painel Administrativo:** https://encurtador-links-34n9.onrender.com/admin

> **📝 Hospedado no Render** para demonstração e testes. A aplicação pode ter um pequeno delay na primeira inicialização (cold start).

### 🔑 **Acesso ao Painel Administrativo**
Para testar as funcionalidades administrativas, use as credenciais abaixo:

```
📧 Login: admin@pieritech.com.br
🔐 Senha: AdMin123
```

**⚠️ Importante:** Estas são credenciais de **demonstração pública**. 
- Use apenas para testes e exploração das funcionalidades
- Não utilize para dados sensíveis ou pessoais
- Os dados podem ser limpos periodicamente

### 🎯 **O que você pode testar:**

#### **Frontend Público:**
- ✅ Criar URLs encurtadas
- ✅ Usar códigos personalizados
- ✅ Definir título e descrição
- ✅ Configurar tempo de expiração
- ✅ Baixar QR codes
- ✅ Testar redirecionamentos

#### **Painel Administrativo:**
- ✅ Dashboard com estatísticas
- ✅ Gerenciar todas as URLs
- ✅ Filtrar e buscar URLs
- ✅ Ver analytics detalhados
- ✅ Exportar dados em CSV
- ✅ Limpar URLs expiradas

## 🚀 Deploy em Produção

### 🌐 **Para Hospedagem Web**

1. **Configure o banco MySQL** na sua hospedagem
2. **Execute o script SQL** (database-setup.sql) no seu banco
3. **Configure variáveis de ambiente** usando .env.production.example como base
4. **Crie usuário admin** com: `node create-admin.js`
5. **Inicie aplicação** com: `npm start`

### 📋 **Configurações Recomendadas**

- **Node.js 16+** no servidor
- **MySQL 5.7+** ou superior
- **SSL/HTTPS** para produção
- **PM2** para gerenciamento de processos
- **Nginx** como proxy reverso (opcional)

### 🔧 **Variáveis de Ambiente Importantes**

```bash
# Essenciais para produção
DB_HOST=seu-mysql-host
DB_USER=seu-usuario
DB_PASSWORD=sua-senha-forte
DB_NAME=seu-banco
JWT_SECRET=sua-chave-jwt-forte
NODE_ENV=production
```

## 📁 Estrutura do Projeto

```
encurtador-link/
├── 📁 src/
│   ├── 📁 config/          # Configurações do banco
│   ├── 📁 controllers/     # Lógica de controle
│   ├── 📁 models/          # Modelos de dados
│   ├── 📁 routes/          # Definição de rotas
│   ├── 📁 services/        # Lógica de negócios
│   └── 📁 utils/           # Utilitários
├── 📁 public/              # Frontend estático
│   ├── 📁 assets/          # CSS, JS, imagens
│   ├── index.html          # Página principal
│   └── admin.html          # Painel admin
├── 📄 database-setup.sql   # Script de setup do banco
├── 📄 create-admin.js      # Script para criar admin
├── 📄 package.json         # Dependências do projeto
└── 📄 README.md           # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL2** - Driver para MySQL
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **QRCode** - Geração de QR codes
- **Moment** - Manipulação de datas

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização responsiva
- **JavaScript Vanilla** - Lógica do frontend
- **Fetch API** - Comunicação com backend

## 📊 Banco de Dados

O projeto utiliza MySQL com as seguintes tabelas:

- **`url_links`** - URLs encurtadas e metadados
- **`url_clicks`** - Estatísticas de cliques
- **`admin_users`** - Usuários administrativos
- **`admin_sessions`** - Controle de sessões

## 🔒 Segurança

- ✅ Validação rigorosa de URLs
- ✅ Sanitização de inputs
- ✅ Proteção contra SQL Injection
- ✅ Hash seguro de senhas (Bcrypt)
- ✅ Autenticação JWT
- ✅ Verificação de expiração de links

## 📱 Responsividade

- ✅ Interface adaptável para mobile
- ✅ Design responsivo
- ✅ UX otimizada para diferentes dispositivos

## 🔮 Implementações Futuras

Algumas ideias para expansão do projeto:

### 🚀 **Funcionalidades Avançadas**
- [ ] **Rate Limiting** - Limitação de requests por IP
- [ ] **Analytics Geográficos** - Localização dos cliques
- [ ] **Sistema de Usuários** - Registro público de usuários
- [ ] **Domínio Personalizado** - URLs com domínio próprio
- [ ] **Bulk Upload** - Upload em massa de URLs
- [ ] **API Keys** - Sistema de chaves para API

### 📊 **Analytics e Relatórios**
- [ ] **Gráficos Avançados** - Charts.js ou D3.js
- [ ] **Relatórios Semanais/Mensais** - Reports automáticos
- [ ] **Heatmap de Cliques** - Visualização de dados
- [ ] **Export Avançado** - PDF, Excel

### 🔧 **Melhorias Técnicas**
- [ ] **Redis Cache** - Cache distribuído
- [ ] **WebSockets** - Atualizações em tempo real
- [ ] **Testes Automatizados** - Jest, Mocha
- [ ] **CI/CD Pipeline** - GitHub Actions
- [ ] **Docker** - Containerização
- [ ] **Monitoring** - Logs estruturados

### 🌐 **Integrações**
- [ ] **APIs Externas** - Google Analytics, Bitly
- [ ] **Redes Sociais** - Compartilhamento automático
- [ ] **Webhooks** - Notificações externas
- [ ] **OAuth** - Login social (Google, GitHub)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Luis Felipe de Pieri**

- 📧 Email: luis@pieritech.com.br
- 💼 LinkedIn: [linkedin.com/in/luispieri](https://linkedin.com/in/luispieri)
- 🐙 GitHub: [github.com/luispieri](https://github.com/luispieri)
- 📱 WhatsApp: (12) 99753-3555
- 📍 São José dos Campos - SP

---

## ⭐ Considerações Finais

Este projeto foi desenvolvido como um **exercício de aprendizado** e demonstra a implementação de um sistema completo com:

- Arquitetura bem estruturada
- Boas práticas de desenvolvimento
- Interface moderna e responsiva
- Recursos básicos de um encurtador profissional

Sinta-se à vontade para:
- ⭐ **Dar uma estrela** se achou interessante
- 🔧 **Fazer fork** para seus próprios estudos
- 📝 **Sugerir melhorias** através de issues
- 🤝 **Contribuir** com pull requests

**Desenvolvido com ❤️ para fins educacionais | Pieri Tech Web Solutions**
