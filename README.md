# Mundo Pet — Agenda de Natal 2026 🎄🐾

Site estático em HTML, CSS e JavaScript, sem dependências de execução. Google Sheets guarda disponibilidade, espécie e raça dos atendimentos confirmados; nomes e telefones ficam no formulário e na mensagem que o cliente envia pelo WhatsApp. Não há reserva automática.

## O que está entregue e o que falta

Implementados: visual natalino com ilustração SVG própria, calendário responsivo, 163 horários em 20 dias, formulário validado, mensagem de WhatsApp, atualização automática a cada 30 segundos, tratamento de falhas, API pública de leitura e painel administrativo autenticado com escrita individual ou em lote, confirmação do servidor e detecção de conflito entre janelas.

**Planilha criada na conta Google do proprietário do projeto:** [abrir agenda](https://docs.google.com/spreadsheets/d/1AXfgJSkpLwdjHzZESV6lUKLepl_yV6_JEsUqbJjeRNE/edit). A aba Agenda contém os 163 horários conferidos e o arquivo tem acesso restrito. A URL administrativa já está preenchida em `js/config.js`.

**Integração ativada:** o Apps Script vinculado à planilha foi instalado, autorizado e implantado. A URL pública `/exec` já está preenchida em `js/config.js`. A API retorna somente os horários ocupados, sem espécie, raça ou dados pessoais. O administrador é a conta Google usada na configuração inicial.

A logo oficial enviada foi incorporada ao cabeçalho, à área principal, ao rodapé e ao ícone do site, preservando a imagem original. O tema usa roxo, vermelho, rosa, creme, dourado e verde da marca.

**Site público ativo:** https://mundo-pet-natal-2026.spectacularconch.chatgpt.site

O site está público e a API Google está ativa. A planilha continua restrita às contas autorizadas. Este pacote também está preparado para publicar na Vercel, usando a mesma API e a mesma planilha.

## 1. Executar localmente

Abra o terminal na pasta `mundo-pet` e rode:

```sh
python3 -m http.server 4173
```

Acesse http://localhost:4173. Não abra `index.html` por duplo clique: os módulos JavaScript precisam de HTTP. Python serve apenas para a prévia, não para produção. Alternativa com Node: `npx serve .`.

Com Node 20 ou superior, os testes e a geração dos arquivos de publicação não exigem instalação:

```sh
npm test
npm run build
```

O resultado pronto para hospedagem fica em `dist/`. Nunca publique `tests/` ou `apps-script/` como pasta raiz do site.

## 2. Criar a planilha Google privada

1. A planilha já foi criada na conta Google conectada. Para uma instalação do zero, entre no Google com a conta que administrará a agenda.
2. Crie uma planilha chamada **Mundo Pet — Dezembro 2026**.
3. Mantenha o compartilhamento como **Restrito**. Não use “qualquer pessoa com o link” nem publique a planilha na web.
4. Abra **Extensões → Apps Script**. O script precisa estar vinculado a esta planilha.
5. Copie `apps-script/Code.gs` para o arquivo `Code.gs` do editor.
6. Crie um arquivo **HTML**, nome **Admin**, e cole `apps-script/Admin.html`.
7. Em Configurações do projeto, habilite a exibição do manifesto `appsscript.json` e substitua pelo arquivo fornecido. O fuso é `America/Sao_Paulo`.
8. Salve. No seletor de funções do editor, execute **configurarAgenda** com a conta da Carol e autorize o acesso solicitado pelo seu próprio projeto.
9. A aba `Agenda` será criada com as colunas **Data**, **Horário**, **Status**, **Data da última alteração**, **Espécie** e **Raça**. São 163 linhas de atendimento, todas inicialmente disponíveis. A função preserva uma aba já existente e nunca reinicializa reservas.

A data e o horário usam texto (`2026-12-01`, `09:30`), o status é `disponivel` ou `ocupado` e a alteração usa ISO UTC. Não ordene, remova ou insira linhas na aba Agenda. A validação falha de forma segura se o conjunto de linhas estiver incompleto ou alterado.

## 3. Configurar a API de leitura do Apps Script

1. No editor, clique em **Implantar → Nova implantação → Aplicativo da Web**.
2. Em **Executar como**, escolha **Eu**, conectado à conta proprietária.
3. Em **Quem pode acessar**, escolha **Qualquer pessoa**, incluindo acesso anônimo. Essa opção expõe somente o resultado de `doGet`, que contém datas/horários ocupados e nenhum dado pessoal.
4. Implante e copie a URL terminada em `/exec`, não `/dev`.
5. Abra essa URL em janela anônima. A resposta correta tem `"ok":true` e `"busy":[]` se não houver bloqueios.
6. Se a conta corporativa impedir acesso anônimo, use uma conta pessoal Google gratuita ou peça ao administrador da organização para avaliar a política. Não torne a planilha pública como contorno.

Ao modificar `Code.gs`, crie uma **nova versão na implantação existente**: Implantar → Gerenciar implantações → Editar → Nova versão. Assim, a URL permanece a mesma. Só salvar o código no editor não atualiza o aplicativo público.

O cliente usa JSONP com callback restrito e timeout de 15 segundos para a consulta pública. Isso evita depender de cabeçalhos CORS que o ContentService não permite configurar livremente. Esse canal é exclusivamente de leitura de disponibilidade pública. Não o use para nomes, telefones ou segredos.

## 4. Conectar o frontend

Edite `js/config.js`:

```js
export const config = {
  apiUrl: 'https://script.google.com/macros/s/ID_REAL_DA_IMPLANTACAO/exec',
  ownerUrl: 'https://docs.google.com/spreadsheets/d/ID_REAL_DA_PLANILHA/edit',
  refreshMs: 30000,
};
```

Essas URLs são públicas na configuração. A URL da planilha **não concede acesso** a uma planilha restrita. Não inclua senhas, tokens, chaves privadas ou dados da conta Google. Depois de alterar a configuração, gere e publique `dist/` novamente.

## 5. Como funciona a segurança administrativa

O painel abre como diálogo **dentro do Google Sheets**, em vez de um formulário de senha no site. O botão Área da Proprietária leva à planilha e explica o menu. O Google autentica a conta; toda leitura administrativa e escrita verifica no servidor o e-mail ativo contra `ADMIN_EMAIL` e `ADMIN_EMAILS`, armazenados nas Propriedades do Script.

`configurarAgenda` registra o e-mail da conta proprietária em `ADMIN_EMAIL` e o preserva nas execuções seguintes. Para adicionar administradores sem remover o proprietário, preencha `ADMIN_EMAILS` nas Configurações → Propriedades do Script com os e-mails adicionais separados por vírgula. Cada pessoa também precisa de permissão **Editor** na planilha.

A conta do proprietário permanece administradora. A Carol foi adicionada como editora da planilha e seu e-mail foi cadastrado em `ADMIN_EMAILS`, mantendo o proprietário em `ADMIN_EMAIL`. Na primeira abertura do painel, ela deverá usar o Gmail informado e autorizar o projeto Google, se solicitado. Compartilhe apenas com pessoas de confiança: editores da planilha podem editar o código vinculado.

**Não existe `doPost` nem rota HTTP de escrita.** `doGet` ignora ações e retorna exclusivamente disponibilidade. As alterações passam por `google.script.run` no diálogo autenticado, com validação de slots, trava no servidor e comparação da revisão antes de salvar. Nenhum dado enviado pelo site público é confiado para autorização. Espécie e raça são lidas somente pelo painel privado; a resposta pública não inclui esses campos.

### Limitação e escolha adotada

Uma implantação Apps Script pública executada como proprietária não deve usar o e-mail do visitante como autenticação de escrita: essa identidade pode não estar disponível. Por isso, não expomos operações administrativas nela. O painel dentro da planilha é a alternativa gratuita segura implementada, mantendo Google Sheets como armazenamento.

**O painel requer Google Sheets no navegador de computador. O aplicativo móvel do Sheets não executa esse diálogo.** A jornada dos clientes funciona em iPhone. Se administrar no iPhone for indispensável, a alternativa é um segundo aplicativo web privado do Apps Script, executado como usuário e acessível somente à conta da Carol, ou OAuth Google validado por um backend gratuito. Essa extensão não faz parte desta versão; não remova a autenticação para adaptar o painel.

Referências oficiais: [scripts vinculados e permissões](https://developers.google.com/apps-script/guides/bound), [aplicativos web e identidade de execução](https://developers.google.com/apps-script/guides/web), [Content Service e JSONP](https://developers.google.com/apps-script/guides/content), [chamadas do painel ao servidor](https://developers.google.com/apps-script/guides/html/reference/run).

## 6. Publicar gratuitamente

### GitHub Pages

1. Crie um repositório GitHub para o site.
2. Rode `npm run build`.
3. Envie **o conteúdo de `dist/`** para a raiz da branch que será publicada, por exemplo `gh-pages`. A raiz dessa branch deve conter `index.html`, `css`, `js` e `assets`.
4. Em Settings → Pages, escolha publicar da branch `gh-pages`, pasta `/ (root)`.
5. Aguarde a publicação e abra a URL informada pelo GitHub.

Todos os caminhos dos assets são relativos, então o site também funciona em `usuario.github.io/repositorio/`.

### Vercel

1. Descompacte o ZIP e envie o conteúdo da pasta `mundo-pet` para um repositório GitHub seu.
2. Na Vercel, importe esse repositório. Se a pasta `mundo-pet` estiver dentro do repositório, escolha-a em **Root Directory**.
3. O arquivo `vercel.json` já define **Other**, build `npm run build` e saída `dist`. Não há variáveis de ambiente nem senha para cadastrar na Vercel.
4. Publique usando o plano gratuito elegível à sua utilização. Só `dist/` será servido ao público; Apps Script e testes não fazem parte dessa pasta.
5. Abra a URL HTTPS da Vercel e consulte um horário. A URL da API e o link da planilha já estão preenchidos em `js/config.js`; não é necessário criar outra planilha ou instalar outro script.
6. Guarde o projeto completo como fonte. O diretório `dist/` é recriado a cada build.

Configuração conforme a [documentação oficial do vercel.json](https://vercel.com/docs/project-configuration/vercel-json).

O projeto não requer serviços pagos. Google Apps Script e hospedagens possuem quotas e termos próprios; a planilha não deve ser usada como banco para volume elevado. Não há analytics, cookies próprios ou service worker. As fontes são carregadas de Google Fonts; sem acesso a elas, o site usa fontes locais de fallback.

## 7. Como a Carol bloqueia e libera horários

1. Confirme primeiro o agendamento com o cliente pelo WhatsApp.
2. No computador, abra a planilha com a conta Google autorizada. Atualize a página para aparecer o menu **Mundo Pet**.
3. Vá em **Mundo Pet → Abrir agenda**.
4. Escolha o dia. O painel mostra quantos horários estão livres e ocupados nesse dia e no mês inteiro.
5. Clique em um horário livre para bloquear; clique em um ocupado para liberar. Aguarde **Alteração salva e confirmada na planilha**.
6. Use **Bloquear o dia** ou **Liberar o dia** para alterar todos os horários do dia em uma operação. Há confirmação com a quantidade.
7. Para bloquear apenas alguns horários, clique individualmente nos desejados. Cada clique salva imediatamente após validação do servidor.
8. Use **Atualizar** para buscar alterações feitas em outra janela. Se houver conflito, o painel pede atualização sem sobrescrever os dados mais recentes.
9. Em **Dados do pet confirmado**, escolha o horário, **Cachorro** ou **Gato** e preencha a raça (ou **SRD**). **Salvar dados e ocupar horário** grava os campos e bloqueia o horário em uma operação. Ao liberar, os dados desse atendimento são apagados.
10. Clientes verão o resultado na próxima consulta, em até cerca de 30 segundos enquanto a página estiver visível, mais o tempo de resposta da API. Ao voltar para a aba, o site consulta novamente. Há também botão de atualização manual.

Se a conexão falhar durante uma escrita, o servidor pode ter concluído a alteração. Atualize o painel para reconciliar antes de repetir. Nunca há confirmação falsa de salvamento. Nomes e telefones não são armazenados na planilha. A Carol mantém as informações da conversa no WhatsApp e registra espécie e raça do pet no painel após confirmar. O formulário do cliente exige espécie e raça e as inclui na mensagem, sem gravar nem bloquear o horário automaticamente.

## 8. Regras verificadas

- 01, 02, 03, 04, 07, 08, 09, 10, 11, 14, 15, 16, 17: 6 horários por dia (09:30 a 15:30 com os intervalos pedidos).
- 18, 19, 21, 22, 23: 15 horários por dia (08:00 a 17:20, a cada 40 minutos).
- 20 e 24: 08:00, 08:40, 09:20, 10:00, 10:40. “Até 11h” é interpretado como início do atendimento até 11h; a grade de 40 minutos não inclui 11:00.
- Total: **163 horários**, 20 dias. 01/12/2026 é terça-feira.
- Nenhum horário é bloqueado ao preencher o formulário ou abrir o WhatsApp. O site faz uma nova consulta antes de gerar o link; a confirmação final continua sendo da Carol.

## 9. Testes e limites de verificação

`npm test` executa 10 testes sem dependências, incluindo o código real de `Code.gs` em ambiente controlado. Verifica datas e horários, paridade frontend/backend, mensagem e codificação do WhatsApp, bloqueio/liberação, nova leitura persistida, resposta pública, rejeição de visitantes e contas erradas, validação de entrada, conflito de revisão, callbacks JSONP e timeout.

**Esses testes usam uma planilha em memória, não os servidores Google.** O navegador foi exercitado com a página real e, separadamente, com `tests/ui/`, uma página de teste com disponibilidade fictícia e abertura do WhatsApp interceptada. Essa página fica fora de `dist/`, não deve ser publicada e não prova integração Google. A página pública não simula disponibilidade.

Verificações de interface feitas: desktop e viewport 390 × 844, seleção de data e horário, exceção de 24/12, campo de telefone inválido, geração de mensagem válida sem envio, estado ocupado desabilitado, aviso de configuração ausente, ausência de rolagem horizontal em 390 px e consulta ao console. Nenhuma mensagem foi enviada a terceiros.

### Checklist obrigatório após configurar o Google

- [ ] URL `/exec` em janela anônima retorna `ok:true`.
- [ ] Visitante sem acesso à planilha não abre o painel nem altera dados.
- [ ] Carol abre o menu sem erro de autorização.
- [ ] Bloquear 01/12 às 09:30 e esperar confirmação.
- [ ] Recarregar o painel e verificar que permanece ocupado.
- [ ] Abrir o site em dois dispositivos, aguardar atualização e confirmar o mesmo bloqueio.
- [ ] Liberar o horário e conferir ambos os dispositivos novamente.
- [ ] Bloquear e liberar um dia inteiro, conferindo quantidades.
- [ ] Testar uma segunda janela com revisão antiga: deve pedir atualização.
- [ ] Desconectar a internet: nenhum horário não verificado pode ser selecionado e nenhuma alteração deve ser confirmada sem resposta.
- [ ] Testar no iPhone real: formulário, teclado, retorno do WhatsApp e navegação.
- [ ] Verificar o console e enviar uma solicitação real somente quando desejar agendar.

**Integração real verificada em 06/11/2026:** configuração e autorização do Apps Script concluídas; API anônima com `ok:true`; painel autenticado gravou espécie Gato e raça de teste, bloqueou o horário e confirmou a gravação; leitura independente da planilha confirmou os valores; o frontend recebeu o bloqueio e desabilitou o horário; atualizar o painel preservou os dados; liberar o horário apagou espécie e raça e a API voltou a retornar lista vazia. O teste foi desfeito. O formulário gerou mensagem com espécie e raça em ambiente de teste, sem enviar mensagem.

Teste em dois aparelhos físicos e no iPhone real ainda não foi executado. A verificação foi feita em navegadores e viewport de celular.

## Estrutura

```text
index.html
css/style.css
js/config.js
js/calendar.js
js/api.js
js/app.js
assets/natal-pets.svg
assets/favicon.svg
apps-script/Code.gs
apps-script/Admin.html
apps-script/appsscript.json
tests/agenda.test.js
tests/ui/index.html
build.mjs
package.json
README.md
```
# caroldezembro
