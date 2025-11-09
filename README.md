
# Sistema de Gestão Desktop - Sindicato Rural de Indiaroba

![Versão](https://img.shields.io/badge/version-8.0.0--desktop-blue.svg)
![Plataforma](https://img.shields.io/badge/platform-Electron-blueviolet.svg)
![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/license-MIT-green.svg)

## 📄 Descrição

Bem-vindo à nova era do Sistema de Gestão do Sindicato Rural de Indiaroba. Esta é uma **aplicação de desktop completa**, projetada para rodar nativamente em seu computador (Windows, macOS ou Linux), garantindo máxima performance, segurança e confiabilidade.

Construído com **Electron, React e TypeScript**, o sistema agora armazena todos os seus dados em um **banco de dados SQLite local**. Isso significa que suas informações ficam salvas em um arquivo seguro diretamente no seu computador, eliminando qualquer dependência da internet ou do navegador. Seus dados são 100% seus, privados e sempre acessíveis.

---

## 🚀 Como Baixar e Instalar (Para Usuários Finais)

Siga estes passos simples para ter o sistema funcionando em seu computador:

1.  **➡️ Acesse a Página de Downloads:**
    Clique no link abaixo para ir para a nossa página de releases (versões), onde você encontrará os instaladores mais recentes.
    -   **[Clique Aqui para Baixar a Última Versão](https://github.com/SEU_USUARIO/SEU_REPOSITORIO/releases/latest)**
    *(Nota: Este é um link de exemplo. O administrador do projeto deve substituí-lo pelo link real do repositório no GitHub.)*

2.  **💻 Baixe o Instalador Correto:**
    Na página de releases, procure pela seção "Assets" e baixe o arquivo compatível com o seu sistema operacional:
    -   **Para Windows:** Baixe o arquivo que termina em `.exe` (ex: `SindicatoGestao-Setup-8.0.0.exe`).
    -   **Para macOS:** Baixe o arquivo que termina em `.dmg`.
    -   **Para Linux:** Baixe o arquivo que termina em `.deb` ou `.rpm`.

3.  **✅ Instale o Aplicativo:**
    -   Execute o arquivo que você baixou e siga as instruções na tela. O programa será instalado e um atalho será criado em sua área de trabalho ou menu de aplicativos.

---

## ✨ Funcionalidades Principais

Todas as funcionalidades que você já conhece foram aprimoradas pela nova plataforma:

-   **💾 Gestão de Dados Robusta:**
    -   **Instalação Simples:** Baixe e execute o instalador para ter o sistema pronto em segundos.
    -   **Dados 100% Locais e Privados:** O banco de dados fica armazenado em uma pasta segura do seu perfil de usuário.
    -   **Backup e Restauração Simplificados:** Fazer backup é tão simples quanto copiar um arquivo. Restaurar é apenas colar o arquivo de volta.
    -   **Funcionamento Totalmente Offline:** Nenhuma conexão com a internet é necessária.

-   **👤 Gestão de Associados:**
    -   Cadastro completo, edição, exclusão e busca rápida.
    -   Controle de status (Ativo, Inativo, Suspenso) e indicador visual de inadimplência.
    -   Gerenciamento de documentos e histórico de atendimentos por associado.

-   **💵 Gestão Financeira:**
    -   Fluxo de Caixa completo com filtros de período.
    -   Lançamento de pagamentos e despesas.
    -   Geração de recibos em PDF com um clique.

-   **📄 Comunicação e Documentos:**
    -   Geração de etiquetas de Mala Direta prontas para impressão.
    -   Integração com WhatsApp para contato rápido.
    -   Emissão de Declarações em PDF com templates personalizáveis.

-   **📊 Relatórios e Administração:**
    -   Relatórios financeiros e de associados.
    -   Painel de administração para configurar o sistema, gerenciar usuários e templates de documentos.

---

## ▶️ Primeiro Uso

Após a instalação, siga estes passos:

1.  **Abrir o Aplicativo:** Clique no ícone do programa para iniciar.
2.  **Login:** Na primeira vez, use as credenciais padrão:
    -   **Administrador:** `username: admin` | `password: admin`
3.  **Comece a Usar:** O sistema está pronto. Todos os dados serão salvos automaticamente no seu computador.

---

## 🔄 Backup, Restauração e Migração

O processo agora é muito mais simples e seguro.

### Onde Ficam os Dados?

O sistema salva seu banco de dados em um único arquivo chamado `sindicato.sqlite`. Ele está localizado em uma pasta padrão de dados de aplicativos no seu computador:
-   **Windows:** `C:\Users\SEU_USUARIO\AppData\Roaming\Sindicato Gestão`
-   **macOS:** `/Users/SEU_USUARIO/Library/Application Support/Sindicato Gestão`
-   **Linux:** `~/.config/Sindicato Gestão`

### Como Fazer Backup

No menu lateral, clique em **"Backup (Salvar Arquivo)"**. Uma janela do sistema será aberta para que você escolha onde salvar o seu arquivo de backup. Salve-o em um local seguro (pen drive, HD externo, Google Drive, etc.).

### Como Restaurar ou Migrar para Outro Computador

1.  Instale o sistema no novo computador.
2.  Abra o menu de **Administração**.
3.  Na seção "Zona de Perigo", clique no botão **"Restaurar"**.
4.  Selecione o seu arquivo de backup (`sindicato.sqlite`).
5.  Confirme a operação. O aplicativo será reiniciado com todos os seus dados restaurados.

---

## 🛠️ Tecnologias Utilizadas

-   **Plataforma Desktop:**
    -   **Electron:** Permite criar aplicações de desktop com tecnologias web.
    -   **Node.js:** Para o "motor" da aplicação e acesso ao sistema.
-   **Interface e Lógica:**
    -   **React & TypeScript:** Para uma interface de usuário rápida, moderna e com código seguro.
    -   **Tailwind CSS:** Para um design limpo e responsivo.
-   **Armazenamento de Dados:**
    -   **SQLite:** O banco de dados relacional mais utilizado no mundo, embutido diretamente na aplicação via `sqlite3`.
-   **Geração de Documentos e Ícones:**
    -   **jsPDF:** Para a criação de relatórios e declarações em PDF.
    -   **Lucide Icons:** Para uma iconografia clara e moderna.

---

## 👨‍💻 Para Desenvolvedores

Para rodar o projeto em modo de desenvolvimento:

```bash
# 1. Clone o repositório e entre na pasta
# (Assumindo que você tenha o Node.js e npm instalados)

# 2. Instale as dependências
npm install

# 3. Inicie a aplicação em modo de desenvolvimento
npm start

# 4. Para criar os instaladores (Windows, macOS, Linux)
npm run make
```
O comando `npm run make` irá gerar os instaladores na pasta `/out`. Você pode então fazer o upload desses arquivos para a seção "Releases" do seu repositório GitHub.

---

## 📂 Estrutura do Projeto (Electron)

```
/
├── out/                  # Arquivos de instalação gerados
├── src/                  # Código fonte da interface (Renderer Process)
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types.ts
│   ├── App.tsx
│   └── index.tsx
├── main.js               # Ponto de entrada do Electron (Main Process)
├── preload.js            # Ponte segura entre Main e Renderer
├── package.json          # Dependências e scripts do projeto
└── README.md             # Este arquivo
```
---
## 📜 Licença

Este projeto está licenciado sob a **Licença MIT**.
