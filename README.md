# Sistema de Gestão - Sindicato Rural de Indiaroba

![Versão](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/license-MIT-green.svg)

## 📄 Descrição

O **Sistema de Gestão para o Sindicato Rural de Indiaroba** é uma aplicação web completa, projetada para funcionar de forma **100% offline**. Seu objetivo é modernizar e simplificar a administração das operações diárias do sindicato, oferecendo uma ferramenta robusta e segura que armazena todos os dados diretamente no navegador do usuário, garantindo privacidade e acesso contínuo mesmo sem internet.

A aplicação foi construída com foco em usabilidade, permitindo o gerenciamento de associados, controle de pagamentos, geração de documentos oficiais e relatórios financeiros detalhados.

---

## ✨ Funcionalidades Principais

O sistema é dividido em módulos intuitivos para cobrir todas as necessidades de gestão do sindicato:

-   **👤 Gestão de Associados:**
    -   Cadastro completo de associados com informações pessoais, de contato, data de filiação e foto.
    -   Edição, exclusão e busca rápida por nome ou CPF.
    -   Controle de status do associado (Ativo, Inativo, Suspenso).
    -   Armazenamento de documentos digitalizados por associado.

-   **💵 Registro de Pagamentos:**
    -   Lançamento de pagamentos mensais com seleção de mês/ano de referência.
    -   Geração de recibos de pagamento em PDF com um clique.
    -   Histórico completo de pagamentos por associado.

-   **📉 Gestão de Despesas:**
    -   Cadastro de todas as despesas do sindicato, com descrição, categoria e valor.
    -   Organização financeira e base para relatórios de balanço.

-   **📄 Geração de Declarações:**
    -   Emissão de **Declaração de Vínculo Associativo** em PDF, com layout profissional e personalizável.
    -   Emissão de **Declaração de Situação de Pagamento**, atestando que o associado está em dia com suas obrigações.
    -   Histórico de todas as declarações emitidas.

-   **📊 Relatórios:**
    -   **Relatórios Mensais:**
        -   Listagem de associados pagantes no mês de referência.
        -   Listagem de associados inadimplentes.
    -   **Relatórios Anuais:**
        -   Balanço financeiro completo, consolidando receitas (pagamentos) e despesas para análise do resultado líquido.
    -   Todos os relatórios são gerados em uma nova aba, com layout otimizado para impressão.

-   **🔐 Administração e Segurança:**
    -   Sistema de autenticação com dois níveis de acesso: **Administrador** e **Usuário**.
    -   **Backup e Restauração:** Ferramenta crucial para exportar todos os dados do sistema para um arquivo JSON e importá-los quando necessário, garantindo a segurança dos dados.
    -   Painel de configurações para personalizar informações do sindicato (nome, CNPJ, endereço) e o modelo da declaração.
    -   Gerenciamento de usuários (apenas para administradores).

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com tecnologias modernas, focando em uma arquitetura que não exige um servidor de back-end nem um processo de build complexo.

-   **Frontend:**
    -   [**React**](https://reactjs.org/) (v19) - Biblioteca para construção da interface de usuário.
    -   [**TypeScript**](https://www.typescriptlang.org/) - Superset do JavaScript que adiciona tipagem estática.
    -   [**Tailwind CSS**](https://tailwindcss.com/) - Framework CSS para estilização rápida e responsiva.

-   **Banco de Dados (Local):**
    -   [**IndexedDB**](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - API de banco de dados do navegador para armazenamento local.
    -   [**Dexie.js**](https://dexie.org/) - Wrapper poderoso para IndexedDB, simplificando as operações de banco de dados.

-   **Geração de Documentos:**
    -   [**jsPDF**](https://github.com/parallax/jsPDF) & [**jsPDF-AutoTable**](https://github.com/simonbengtsson/jsPDF-AutoTable) - Para a criação dinâmica de documentos PDF.

-   **Ícones:**
    -   [**Lucide Icons**](https://lucide.dev/) - Biblioteca de ícones open-source, leve e personalizável.

---

## 🚀 Como Executar o Projeto

A beleza deste projeto está em sua simplicidade. Não há necessidade de instalar dependências com `npm` ou `yarn`, nem de um processo de `build`.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/sindicato-gestao.git
    ```

2.  **Abra o arquivo `index.html`:**
    -   Navegue até a pasta do projeto e abra o arquivo `index.html` diretamente no seu navegador de preferência (Google Chrome, Firefox, etc.).
    -   Para uma melhor experiência, especialmente para evitar problemas com políticas de segurança do navegador, você pode usar um servidor local simples:
        ```bash
        # Se você tiver o Node.js instalado, pode usar o 'serve'
        npx serve .
        ```
        E então acesse o endereço fornecido (geralmente `http://localhost:3000`).

### Login Padrão

Para acessar o sistema pela primeira vez, utilize as credenciais padrão:
-   **Administrador:** `username: admin` | `password: admin`

---

## ⚠️ Importante: Backup dos Dados

Como todos os dados são armazenados no **IndexedDB** do navegador, eles estão sujeitos a serem apagados caso o usuário limpe o cache do site ou os dados de navegação.

É **extremamente recomendado** que o usuário realize backups periódicos utilizando a funcionalidade de **Exportar Dados** no painel de **Administração**. O arquivo JSON gerado é a única garantia de recuperação dos dados em caso de perda.

---

## 📂 Estrutura do Projeto

```
/
├── components/         # Componentes React reutilizáveis (ex: Sidebar)
├── pages/              # Componentes de página (ex: Dashboard, Clients, Admin)
├── services/           # Módulos de serviço (db.ts, pdfService.ts, reportService.ts)
├── types.ts            # Definições de tipos TypeScript
├── App.tsx             # Componente principal que gerencia rotas e estado da aplicação
├── index.html          # Ponto de entrada da aplicação
├── index.tsx           # Ponto de montagem do React
└── README.md           # Este arquivo
```

---

## 🤝 Contribuições

Contribuições são bem-vindas! Se você deseja melhorar o sistema, siga os passos abaixo:

1.  Faça um **fork** deste repositório.
2.  Crie uma nova **branch** para sua feature (`git checkout -b minha-feature`).
3.  Faça **commit** de suas alterações (`git commit -m 'Adiciona nova feature'`).
4.  Faça **push** para a sua branch (`git push origin minha-feature`).
5.  Abra um **Pull Request**.

---

## 📜 Licença

Este projeto está licenciado sob a **Licença MIT**. Veja o arquivo `LICENSE` para mais detalhes.