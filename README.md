# Sistema de Gestão - Sindicato Rural de Indiaroba

![Versão](https://img.shields.io/badge/version-6.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/license-MIT-green.svg)

## 📄 Descrição

Este é um sistema de gestão completo, projetado especificamente para as necessidades do Sindicato Rural de Indiaroba. A sua principal característica é a capacidade de funcionar **100% offline**, garantindo que o seu trabalho nunca seja interrompido, mesmo sem acesso à internet.

A aplicação é moderna, segura e armazena **todos os dados de forma automática e segura diretamente no navegador do usuário**. Para garantir a segurança e a portabilidade total dos dados, o sistema conta com funcionalidades robustas de **Backup e Restauração**, que são essenciais para o seu uso a longo prazo.

---

## ⚠️ Atenção: Entendendo o Armazenamento Offline e a Importância do Backup

Antes de começar, é fundamental entender como seus dados são salvos.

-   **Onde os Dados Ficam?** Seus dados (associados, pagamentos, etc.) são salvos em um banco de dados seguro **dentro do seu navegador** (Google Chrome, Firefox, etc.). Isso permite que o sistema seja extremamente rápido e funcione offline.
-   **Isolamento dos Dados:** Cada navegador guarda seus dados de forma isolada. Isso significa que os dados salvos no Chrome **não estarão disponíveis** no Firefox, e vice-versa. Da mesma forma, os dados em um computador não estarão disponíveis em outro.
-   **O Backup é a Sua Segurança!** A função de **Backup** é a ferramenta que lhe dá controle total sobre seus dados. Ela exporta tudo para um único arquivo `.sqlite` que você pode salvar em qualquer lugar (pen drive, nuvem, etc.). Este arquivo é a sua garantia de segurança e a forma de **mover seus dados** para outro navegador ou computador.

**Conclusão:** Faça backups regularmente. É a única maneira de proteger seus dados contra imprevistos (como limpar o cache do navegador ou problemas no computador) e de garantir a portabilidade.

---

## ✨ Funcionalidades Principais

O sistema é dividido em módulos intuitivos para cobrir todas as necessidades de gestão do sindicato:

-   **💾 Gerenciamento de Dados e Backup:**
    -   **Armazenamento Automático:** O sistema utiliza o banco de dados interno do navegador (IndexedDB) para salvar todas as informações. As alterações são persistidas automaticamente.
    -   **Funcionamento Offline:** Após o primeiro carregamento, a aplicação funciona completamente sem conexão com a internet.
    -   **Backup em um Clique:** Gere um backup completo de todos os seus dados em um único arquivo `.sqlite`.
    -   **Restauração Segura:** Restaure o sistema a um estado anterior utilizando um arquivo de backup. Esta funcionalidade substitui todos os dados atuais e é a forma de migrar o sistema para um novo computador ou navegador.

-   **👤 Gestão de Associados:**
    -   Cadastro completo de associados com informações pessoais, de contato, data de filiação e foto.
    -   Edição, exclusão e busca rápida por nome ou CPF.
    -   Controle de status do associado (Ativo, Inativo, Suspenso) e **indicador visual de inadimplência**.
    -   Gerenciamento de documentos digitalizados por associado.
    -   **Registro de Atendimentos:** Mantenha um histórico de todas as interações e ocorrências com cada associado.

-   **💵 Gestão Financeira:**
    -   **Fluxo de Caixa:** Uma visão unificada de todas as receitas (pagamentos) e despesas, com filtros por período.
    -   Lançamento de pagamentos mensais e geração de recibos em PDF.
    -   Cadastro de todas as despesas do sindicato.

-   **📄 Comunicação e Documentos:**
    -   **Mala Direta e Etiquetas:** Gere etiquetas de endereçamento prontas para impressão.
    -   **Integração com WhatsApp:** Envie mensagens rapidamente para os associados.
    -   Emissão de **Declaração de Vínculo Associativo** e **Declaração de Situação de Pagamento** em PDF, com templates personalizáveis.

-   **📊 Relatórios:**
    -   Relatórios mensais de pagantes e inadimplentes.
    -   Balanço financeiro anual consolidando receitas e despesas.

-   **🔐 Administração e Experiência de Uso:**
    -   **Modo Escuro:** Alterne entre temas claro e escuro.
    -   Sistema de autenticação com dois níveis de acesso: **Administrador** e **Usuário**.
    -   Painel de configurações para personalizar informações do sindicato.
    -   Gerenciamento de usuários e ferramentas de diagnóstico do sistema (apenas para administradores).

---

## 🚀 Como Começar a Usar

1.  **Baixe e Extraia:** Baixe o projeto como um arquivo ZIP e extraia-o para uma pasta permanente no seu computador (ex: `Meus Documentos/Sistema Sindicato`).
2.  **Abra o `index.html`:** Dê um duplo clique no arquivo `index.html`. O sistema será aberto no seu navegador.
3.  **Adicione aos Favoritos:** Adicione esta página aos favoritos para acesso rápido.
4.  **Login:** Na primeira vez, o sistema criará um banco de dados vazio. Use as credenciais padrão para entrar:
    -   **Administrador:** `username: admin` | `password: admin`
5.  **Comece a Usar:** Cadastre seus associados, pagamentos, etc. Tudo é salvo automaticamente.
6.  **Faça seu Primeiro Backup:** Assim que tiver inserido alguns dados, vá para a barra lateral e clique em **"Backup (Salvar Arquivo)"**. Salve o arquivo `.sqlite` em um local seguro. Crie o hábito de fazer isso regularmente.

### 🔄 Como Mudar de Computador ou Navegador (Migração de Dados)

Este é um processo simples usando o sistema de Backup/Restauração.

1.  **No Computador/Navegador Antigo:**
    -   Abra o sistema e faça um **Backup**, salvando o arquivo `.sqlite` em um pen drive ou serviço de nuvem.

2.  **No Computador/Navegador Novo:**
    -   Abra o arquivo `index.html` (o sistema estará vazio).
    -   Faça login como `admin`.
    -   Vá para a página de **Administração**.
    -   Na seção "Zona de Perigo", clique em **"Restaurar"**.
    -   Selecione o arquivo de backup `.sqlite` que você salvou.
    -   Confirme a operação. **Atenção:** Isso substituirá todos os dados atuais no novo local.
    -   Pronto! Após a recarga, todos os seus dados estarão disponíveis no novo local.

---

## 🛠️ Ferramentas e Tecnologias

-   **Interface e Lógica:**
    -   **React & TypeScript:** Para uma interface de usuário rápida, moderna e com código seguro.
    -   **Tailwind CSS:** Para um design limpo e responsivo.
-   **Armazenamento de Dados Offline:**
    -   **IndexedDB & Dexie.js:** O coração do sistema. Armazena os dados localmente no navegador, garantindo performance e funcionamento 100% offline.
-   **Backup e Portabilidade:**
    -   **SQLite (via sql.js):** Permite que o banco de dados inteiro seja exportado para um único arquivo `.sqlite` e restaurado a partir dele, garantindo a portabilidade dos dados.
-   **Geração de Documentos e Ícones:**
    -   **jsPDF & jsPDF-AutoTable:** Para a criação de relatórios e declarações em PDF.
    -   **Lucide Icons:** Para uma iconografia clara e moderna.

---

## 📂 Estrutura do Projeto

```
/
├── components/         # Componentes React reutilizáveis
├── pages/              # Componentes de página (Dashboard, Clients, Admin)
├── services/           # Módulos de serviço (sqliteService.ts, db.ts, pdfService.ts)
├── types.ts            # Definições de tipos TypeScript
├── App.tsx             # Componente principal da aplicação
├── index.html          # Ponto de entrada da aplicação
├── index.tsx           # Ponto de montagem do React
└── README.md           # Este arquivo
```
---
## 📜 Licença

Este projeto está licenciado sob a **Licença MIT**.
