# Publicar o Mundo Pet na Vercel

O site já usa a planilha e a API Google configuradas. Não precisa recriar nada no Google.

1. Descompacte o ZIP.
2. Envie o conteúdo da pasta `mundo-pet` para seu repositório GitHub.
3. Na Vercel, importe o repositório. A raiz do projeto deve ser a pasta que contém `package.json` e `vercel.json`.
4. A configuração está pronta: Framework **Other**, Build Command **npm run build**, Output Directory **dist**.
5. Clique em Deploy e abra o endereço fornecido pela Vercel.

Não há variáveis de ambiente a cadastrar. A URL pública da API e o link da planilha estão em `js/config.js`.

## Administração por você e pela Carol

A planilha foi compartilhada com a Carol como editora. Os dois e-mails foram mantidos nas propriedades administrativas do Apps Script.

Abra https://docs.google.com/spreadsheets/d/1AXfgJSkpLwdjHzZESV6lUKLepl_yV6_JEsUqbJjeRNE/edit no computador, com a conta Google autorizada. Escolha **Mundo Pet → Abrir agenda**. Na primeira abertura, autorize o próprio projeto Google, se solicitado.

O cliente escolhe data, horário, cachorro ou gato, raça e serviço e envia a solicitação pelo WhatsApp. Depois de confirmar com o cliente, a proprietária bloqueia o horário pelo painel. O pedido por WhatsApp não ocupa um horário automaticamente.

O painel funciona no navegador do computador. O aplicativo Google Sheets do celular não executa o painel.

## Conteúdo do pacote

- HTML, CSS, JavaScript e logo do site.
- `dist/`: site estático pronto, gerado pelo build.
- `vercel.json`: configuração da Vercel.
- `apps-script/`: fonte do backend Google já instalado, para manutenção.
- `tests/`: testes, não publicados em `dist/`.
- `README.md`: instruções completas e histórico das verificações.

Referência da Vercel: https://vercel.com/docs/project-configuration/vercel-json
