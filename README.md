# Sistema de Gestão - Sindicato Rural de Indiaroba

![Versão](https://img.shields.io/badge/version-6.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/license-MIT-green.svg)

## 📄 Descrição

Este é um sistema de gestão completo, projetado especificamente para as necessidades do Sindicato Rural de Indiaroba. A sua principal característica é a capacidade de funcionar **100% offline**, garantindo que o seu trabalho nunca seja interrompido, mesmo sem acesso à internet.

A aplicação é moderna, segura e armazena **todos os dados de forma automática e segura diretamente no navegador do usuário**. Isso significa que você não precisa se preocupar em carregar ou salvar arquivos no dia a dia. O sistema simplesmente funciona. Para garantir a segurança e portabilidade dos seus dados, foram implementadas funcionalidades robustas de **Backup** e **Restauração**, que permitem exportar todo o banco de dados para um único arquivo `.sqlite` e importá-lo novamente quando necessário.

---

## ✨ Funcionalidades Principais

O sistema é dividido em módulos intuitivos para cobrir todas as necessidades de gestão do sindicato:

-   **💾 Gerenciamento de Dados e Backup:**
    -   **Armazenamento Automático:** O sistema utiliza o banco de dados interno do navegador (IndexedDB) para salvar todas as informações. As alterações são persistidas automaticamente, sem a necessidade de clicar em "salvar".
    -   **Funcionamento Offline:** Após o primeiro carregamento, a aplicação funciona completamente sem conexão com a internet.
    -   **Backup em um Clique:** Gere um backup completo de todos os seus dados (associados, pagamentos, etc.) em um único arquivo `.sqlite` através do botão na barra lateral. Guarde este arquivo em um local seguro (pen drive, nuvem, etc.).
    -   **Restauração Segura:** Restaure o sistema a um estado anterior utilizando um arquivo de backup. Esta funcionalidade está disponível no painel de Administração e substitui todos os dados atuais.

-   **👤 Gestão de Associados:**
    -   Cadastro completo de associados com informações pessoais, de contato, data de filiação e foto.
    -   Edição, exclusão e busca rápida por nome ou CPF.
    -   Controle de status do associado (Ativo, Inativo, Suspenso) e **indicador visual de inadimplência**.
    -   Gerenciamento de documentos digitalizados por associado.
    -   **Registro de Atendimentos:** Mantenha um histórico de todas as interações e ocorrências com cada associado.

-   **💵 Gestão Financeira:**
    -   **Fluxo de Caixa:** Uma visão unificada de todas as receitas (pagamentos) e despesas, com filtros por período para um controle financeiro preciso.
    -   Lançamento de pagamentos mensais com seleção de mês/ano de referência.
    -   Geração de recibos de pagamento em PDF com um clique.
    -   Cadastro de todas as despesas do sindicato, com descrição, categoria e valor.

-   **📄 Comunicação e Documentos:**
    -   **Mala Direta e Etiquetas:** Gere etiquetas de endereçamento prontas para impressão para se comunicar com os associados via correio.
    -   **Integração com WhatsApp:** Envie mensagens rapidamente para os associados abrindo uma conversa no WhatsApp Web com um único clique.
    -   Emissão de **Declaração de Vínculo Associativo** e **Declaração de Situação de Pagamento** em PDF, personalizáveis no painel de administração.

-   **📊 Relatórios:**
    -   Relatórios mensais de pagantes e inadimplentes.
    -   Balanço financeiro anual consolidando receitas e despesas.

-   **🔐 Administração e Experiência de Uso:**
    -   **Modo Escuro:** Alterne entre temas claro e escuro para maior conforto visual.
    -   Sistema de autenticação com dois níveis de acesso: **Administrador** e **Usuário**.
    -   Painel de configurações para personalizar informações do sindicato (nome, CNPJ, etc.).
    -   Gerenciamento de usuários e ferramentas de diagnóstico do sistema (apenas para administradores).

---

## 🚀 Como Executar e Usar Offline

O sistema foi projetado para ser extremamente fácil de usar. Siga estes passos:

### Método 1: Para Usuários (Simples e Rápido)

1.  **Baixe o ZIP:** Baixe o código-fonte do projeto como um arquivo ZIP.
2.  **Extraia os Arquivos:** Descompacte o arquivo ZIP em uma pasta permanente no seu computador (por exemplo, em `Meus Documentos/Sistema Sindicato`).
3.  **Abra o `index.html`:** Navegue até a pasta que você extraiu e dê um duplo clique no arquivo `index.html`.
4.  **Adicione aos Favoritos:** O sistema será aberto no seu navegador. É altamente recomendável adicionar esta página aos seus favoritos para acesso rápido no futuro.
5.  **Pronto!** O sistema está funcionando.

### Como Funciona o Modo Offline

-   **Primeiro Acesso:** Você precisa de uma conexão com a internet **apenas na primeira vez** que abrir o sistema. Isso permite que o navegador baixe todos os arquivos necessários.
-   **Uso Diário (Offline):** Após o primeiro carregamento, você pode usar o sistema completamente offline. Todos os dados que você inserir (novos associados, pagamentos, etc.) serão salvos diretamente no seu computador, dentro do banco de dados do navegador.
-   **Acesso Futuro (Offline):** Para abrir o sistema novamente sem internet, basta usar o favorito que você criou ou abrir o arquivo `index.html` diretamente da pasta.

### Fluxo de Uso Simplificado

1.  **Primeiro Acesso:** Siga os passos do "Método 1" acima. O banco de dados será criado e configurado automaticamente no seu navegador.
2.  **Login:** Após o carregamento inicial, a tela de login aparecerá. Use as credenciais padrão:
    -   **Administrador:** `username: admin` | `password: admin`
3.  **Uso Diário:** Utilize o sistema normalmente. Todas as suas alterações são salvas de forma automática e instantânea.
4.  **Backup (Importante!):** Periodicamente, clique no botão **"Backup (Salvar Arquivo)"** na barra lateral. Um arquivo `.sqlite` com todos os seus dados será gerado para download. **Salve-o em um local seguro** (pen drive, Google Drive, etc.).
5.  **Restauração:** Para restaurar dados (por exemplo, ao trocar de computador), acesse a página **Administração**, vá para a **Zona de Perigo**, clique em **"Restaurar"** e selecione o seu arquivo de backup `.sqlite`. **Atenção:** Isso substituirá todos os dados existentes.

---

## 🛠️ Ferramentas e Tecnologias

-   **Interface e Lógica:**
    -   **React & TypeScript:** Para uma interface de usuário rápida, moderna e com código seguro e bem estruturado.
    -   **Tailwind CSS:** Para um design limpo, responsivo e personalizável.
-   **Armazenamento de Dados Offline:**
    -   **IndexedDB & Dexie.js:** O coração do sistema. Todos os dados são armazenados localmente no seu navegador, garantindo que o sistema funcione 100% offline com alta performance. O Dexie.js simplifica o acesso a este banco de dados.
-   **Backup e Portabilidade:**
    -   **SQLite (via sql.js):** Permite que o banco de dados inteiro seja exportado para um único arquivo `.sqlite` e restaurado a partir dele. Isso é possível executando o SQLite diretamente no navegador com WebAssembly.
-   **Geração de Documentos e Ícones:**
    -   **jsPDF & jsPDF-AutoTable:** Para a criação de relatórios e declarações em formato PDF diretamente no cliente.
    -   **Lucide Icons:** Para uma iconografia clara e moderna em toda a aplicação.

---

## ⚠️ Importante: Gerenciamento e Backup dos Dados

A grande vantagem deste sistema é a combinação de facilidade de uso com controle total dos dados.

-   **Salvamento é Automático:** Você não precisa se preocupar em salvar. Tudo o que você faz é gravado imediatamente.
-   **Backup é Essencial:** A responsabilidade de manter cópias de segurança é sua. **Faça backups regularmente!** Se os dados do seu navegador forem limpos ou o computador apresentar defeito, o backup será a única forma de recuperar suas informações.
-   **Segurança do Backup:** Guarde suas cópias de segurança (`.sqlite`) em locais seguros e diferentes (ex: um pen drive e um serviço de nuvem como Google Drive ou Dropbox).

---

## 📂 Estrutura do Projeto

```
/
├── components/         # Componentes React reutilizáveis
├── pages/              # Componentes de página (Dashboard, Clients, Admin)
├── services/           # Módulos de serviço (sqliteService.ts, db.ts, pdfService.ts)
├── types.ts            # Definições de tipos TypeScript
├── App.tsx             # Componente principal que gerencia o estado e o fluxo da aplicação
├── index.html          # Ponto de entrada da aplicação
├── index.tsx           # Ponto de montagem do React
└── README.md           # Este arquivo
```
---
## 📜 Licença

Este projeto está licenciado sob a **Licença MIT**.