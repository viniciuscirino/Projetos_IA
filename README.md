# Sistema de Gestão - Sindicato Rural de Indiaroba

![Versão](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-ativo-success.svg)
![Licença](https://img.shields.io/badge/license-MIT-green.svg)

## 📄 Descrição

O **Sistema de Gestão para o Sindicato Rural de Indiaroba** é uma aplicação web completa com uma arquitetura **100% offline-first**. Seu objetivo é modernizar e simplificar a administração das operações diárias do sindicato. A ferramenta armazena todos os dados diretamente no **banco de dados do navegador (IndexedDB)**, garantindo total privacidade e acesso contínuo às funcionalidades mesmo sem conexão à internet após o primeiro carregamento.

A aplicação foi construída com foco em usabilidade, permitindo o gerenciamento de associados, controle de pagamentos, geração de documentos oficiais e relatórios financeiros detalhados, sem a necessidade de gerenciar arquivos externos.

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
    -   **Backup e Restauração (via JSON):** Ferramenta crucial para exportar todos os dados do sistema para um único arquivo JSON e importá-los quando necessário. **Este é o único método para garantir a segurança e a portabilidade dos dados.**
    -   Painel de configurações para personalizar informações do sindicato (nome, CNPJ, endereço) e o modelo da declaração.
    -   Gerenciamento de usuários (apenas para administradores).

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com tecnologias modernas, focando em uma arquitetura que não exige um servidor de back-end nem um processo de build complexo.

-   **Frontend:**
    -   [**React**](https://reactjs.org/) - Biblioteca para construção da interface de usuário.
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

Este projeto foi desenvolvido para ser executado diretamente no navegador, sem a necessidade de um processo de build complexo ou instalação de dependências via `npm`.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/sindicato-gestao.git
    ```

2.  **Execute um servidor local:**
    -   Para garantir o funcionamento correto e evitar problemas de segurança (CORS), é recomendado usar um servidor web local. Se você tem o Node.js instalado, o método mais simples é usar o pacote `serve`:
        ```bash
        # Navegue até a pasta do projeto
        cd sindicato-gestao

        # Instale e execute o servidor
        npx serve .
        ```
    -   Após executar o comando, acesse o endereço fornecido no terminal (geralmente `http://localhost:3000`). O sistema irá diretamente para a tela de login. O banco de dados será criado e populado automaticamente no primeiro acesso.

3.  **Alternativa (abrir arquivo diretamente):**
    -   Você também pode abrir o arquivo `index.html` diretamente no seu navegador. No entanto, alguns navegadores podem restringir funcionalidades quando arquivos são abertos localmente (protocolo `file:///`). O uso de um servidor local é sempre recomendado.

### Uso Offline

A aplicação foi projetada com uma abordagem **offline-first**:

-   **Primeiro Acesso:** É necessário ter uma conexão com a internet no primeiro acesso para que o navegador possa baixar as dependências externas (React, Tailwind CSS, etc.) dos CDNs.
-   **Uso Subsequente:** Após o primeiro carregamento, o navegador armazena esses arquivos em cache. **Enquanto o cache do navegador não for limpo**, a aplicação poderá ser iniciada e utilizada completamente offline. Todos os dados de associados, pagamentos, etc., são sempre salvos localmente no seu navegador e não dependem de internet.

### Login Padrão

Para acessar o sistema pela primeira vez, utilize uma das credenciais padrão:
-   **Administrador:** `username: admin` | `password: admin`
-   **Usuário:** `username: vinicius` | `password: user`

---

## ⚠️ Importante: Backup dos Dados

Como todos os dados são armazenados no **IndexedDB** do navegador, eles estão **vinculados ao navegador e ao perfil de usuário específico** onde a aplicação é acessada. Os dados podem ser perdidos permanentemente caso o usuário limpe o cache do site, os dados de navegação ou formate o computador.

É **extremamente recomendado** que o administrador realize **backups regulares** utilizando a funcionalidade de **Exportar Dados** no painel de **Administração**. O arquivo `.json` gerado é a única garantia de recuperação dos dados em caso de perda e o único meio de transferir os dados para outro computador.

---

## 📂 Estrutura do Projeto

```
/
├── components/         # Componentes React reutilizáveis (ex: Sidebar)
├── pages/              # Componentes de página (ex: Dashboard, Clients, Admin)
├── services/           # Módulos de serviço (db.ts, pdfService.ts, reportService.ts)
├── types.ts            # Definições de tipos TypeScript
├── App.tsx             # Componente principal que gerencia o estado da aplicação
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

Este projeto está licenciado sob a **Licença MIT**.
