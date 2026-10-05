# 📬 Catálogo de Templates de E-mail — Voxy

Este documento define todos os templates transacionais de e-mail necessários para o ecossistema do **Voxy**, organizados por prioridade, fluxo de negócio, aliases oficiais no **Resend** e variáveis dinâmicas esperadas.

---

## 🎨 Guia de Estilo & Identidade Visual dos E-mails

Para garantir uma experiência consistente com a identidade do aplicativo Voxy (Dark Mode, temática Discord-like):

| Elemento | Valor / Especificação |
|---|---|
| **Background Geral** | `#0f1117` |
| **Card / Container Central** | `#161922` com borda sólida de `1px solid #282d3d` |
| **Raio de Borda (Border Radius)** | `12px` nos cards e `8px` nos botões CTA |
| **Cor Primária (Acentos / Botões)** | `#6366f1` (Índigo Voxy) com hover `#4f46e5` |
| **Texto Principal** | `#f3f4f6` (Quase branco) |
| **Texto Secundário / Legendas** | `#9ca3af` (Cinza médio) |
| **Tipografia Recomendada** | `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` |
| **Largura Máxima do Container** | `580px` centralizado na tela |

---

## 🚀 1. Autenticação, Onboarding & Segurança da Conta (Prioridade Máxima)

### 1.1. Verificação de Conta (Código de 6 Dígitos)
- **Alias no Resend:** `voxy-email-verification` *(Já implementado)*
- **Gatilho:** Cadastro de novo usuário ou solicitação manual de reenvio de código (`/auth/resend-code`).
- **Objetivo:** Confirmar posse do endereço de e-mail e ativar a conta.
- **Assunto Sugerido:** `{{CODE}} é o seu código de verificação Voxy`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário cadastrado.
  - `{{CODE}}`: Código de 6 dígitos alfanuméricos/numéricos.
  - `{{D1}}`, `{{D2}}`, `{{D3}}`, `{{D4}}`, `{{D5}}`, `{{D6}}`: Dígitos separados para visualização estilizada em caixas individuais.
  - `{{EXPIRES_IN}}`: Tempo de validade do código (ex: `15 minutos`).

---

### 1.2. Boas-vindas ao Voxy
- **Alias no Resend:** `voxy-welcome`
- **Gatilho:** Imediatamente após a verificação bem-sucedida do e-mail.
- **Objetivo:** Introduzir o usuário aos recursos da plataforma, links de download e engajamento inicial.
- **Assunto Sugerido:** `Bem-vindo ao Voxy, {{USERNAME}}! 🎙️`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{DOWNLOAD_URL}}`: Link para baixar o cliente desktop do Voxy (Windows/Linux/Mac).
  - `{{COMMUNITY_SERVER_URL}}`: Convite para o servidor oficial da comunidade Voxy.
  - `{{DOCUMENTATION_URL}}`: Guia de primeiros passos.

---

### 1.3. Recuperação de Senha
- **Alias no Resend:** `voxy-password-reset`
- **Gatilho:** Usuário clica em "Esqueci minha senha" na tela de login.
- **Objetivo:** Permitir redefinição segura de credenciais com link temporário de uso único.
- **Assunto Sugerido:** `Redefinição de senha para sua conta Voxy`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{RESET_LINK}}`: Link único com token seguro de expiração curta (ex: 30 minutos).
  - `{{EXPIRES_IN}}`: Tempo limite para expirar o link (ex: `30 minutos`).
  - `{{IP_ADDRESS}}`: IP de onde partiu a solicitação.
  - `{{DEVICE_INFO}}`: Sistema operacional / navegador de onde a solicitação foi feita.

---

### 1.4. Confirmação de Senha Alterada
- **Alias no Resend:** `voxy-password-changed`
- **Gatilho:** Quando a senha da conta for atualizada com sucesso.
- **Objetivo:** Notificar o proprietário e fornecer um canal rápido de contenção caso tenha sido um ataque.
- **Assunto Sugerido:** `Segurança: Sua senha do Voxy foi alterada`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{TIMESTAMP}}`: Data e hora da alteração formatada no fuso local.
  - `{{DISAVOW_LINK}}`: Link de segurança rápida para bloquear/desconectar todas as sessões ativas caso o usuário não reconheça a alteração.

---

### 1.5. Alerta de Novo Login / Dispositivo Desconhecido
- **Alias no Resend:** `voxy-new-login-alert`
- **Gatilho:** Login realizado a partir de um IP ou dispositivo diferente do histórico recente.
- **Objetivo:** Prevenir invasões e acessos não autorizados.
- **Assunto Sugerido:** `Novo login detectado na sua conta Voxy`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{DEVICE_NAME}}`: Dispositivo (ex: `Voxy Desktop Windows 11`, `Chrome 120`).
  - `{{LOCATION}}`: Cidade / País aproximado baseado no IP.
  - `{{IP_ADDRESS}}`: Endereço IP do login.
  - `{{TIMESTAMP}}`: Data e horário exatos.
  - `{{REVOKE_SESSION_LINK}}`: Link direto para encerrar a sessão imediatamente.

---

## 🛡️ 2. Controle Parental & Proteção a Menores (Age Signal Protocol)

O Voxy conta com um protocolo de proteção etária e integração com o sistema operacional (`CHILD`, `TEEN`, `ADULT`).

### 2.1. Solicitação de Consentimento Parental
- **Alias no Resend:** `voxy-parental-consent`
- **Gatilho:** O sistema operacional sinaliza que a conta pertence a um menor (`CHILD`) e o cadastro requer aprovação do responsável.
- **Objetivo:** Informar aos pais as permissões e solicitar autorização explícita com verificação.
- **Assunto Sugerido:** `Aprovação necessária: Conta Voxy para {{CHILD_USERNAME}}`
- **Variáveis Dinâmicas:**
  - `{{PARENT_NAME}}`: Nome do responsável (se informado).
  - `{{CHILD_USERNAME}}`: Nome de usuário da criança.
  - `{{APPROVAL_LINK}}`: Link seguro para o responsável autorizar a criação da conta.
  - `{{POLICIES_URL}}`: Termos de uso e diretrizes de segurança infantil da plataforma.

---

### 2.2. Alerta de Tentativa de Acesso Restrito / Bloqueio
- **Alias no Resend:** `voxy-parental-security-alert`
- **Gatilho:** Tentativa bloqueada de entrada em servidores marcados como 18+ ou tentativa de adulteração de sinal de idade via HMAC.
- **Objetivo:** Notificar os pais sobre conteúdos ou canais bloqueados por proteção.
- **Assunto Sugerido:** `Aviso de Segurança Voxy: Tentativa de acesso restrito bloqueada`
- **Variáveis Dinâmicas:**
  - `{{PARENT_EMAIL}}`: E-mail do responsável cadastrado.
  - `{{CHILD_USERNAME}}`: Nome da conta infantil.
  - `{{REASON}}`: Motivo do bloqueio (ex: `Canal classificado como 18+`).
  - `{{SERVER_NAME}}`: Nome do servidor em questão.
  - `{{TIMESTAMP}}`: Momento do evento.

---

## 👥 3. Engajamento Social, Servidores e Comunidade

### 3.1. Convite para Servidor por E-mail
- **Alias no Resend:** `voxy-server-invite`
- **Gatilho:** Um usuário envia um convite para o e-mail de um amigo ou membro da comunidade.
- **Objetivo:** Trazer novos usuários para dentro de um servidor específico.
- **Assunto Sugerido:** `{{INVITER_NAME}} convidou você para o servidor {{SERVER_NAME}} no Voxy`
- **Variáveis Dinâmicas:**
  - `{{INVITER_NAME}}`: Nome de quem convidou.
  - `{{SERVER_NAME}}`: Nome do servidor.
  - `{{SERVER_ICON_URL}}`: URL do ícone do servidor (Cloudflare R2).
  - `{{SERVER_MEMBER_COUNT}}`: Quantidade atual de membros no servidor.
  - `{{INVITE_LINK}}`: Link do convite (com código do servidor).

---

### 3.2. Solicitação de Amizade Pendente (Digest)
- **Alias no Resend:** `voxy-friend-request-digest`
- **Gatilho:** Usuário está offline há mais de 24 horas e acumulou solicitações de amizade pendentes.
- **Objetivo:** Reengajamento sem flood de notificações.
- **Assunto Sugerido:** `{{REQUESTER_NAME}} quer ser seu amigo no Voxy`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Destinatário.
  - `{{REQUESTER_NAME}}`: Nome de quem enviou o pedido.
  - `{{REQUESTER_AVATAR_URL}}`: Avatar de quem enviou.
  - `{{ACCEPT_LINK}}`: Link direto para abrir o app e aceitar.

---

### 3.3. Resumo de Menções e Mensagens Diretas Não Lidas
- **Alias no Resend:** `voxy-unread-digest`
- **Gatilho:** Mensagens diretas ou menções (`@username`) recebidas enquanto o usuário está ausente há mais de 48h.
- **Objetivo:** Manter o usuário informado sobre conversas importantes sem expor mensagens privadas na íntegra.
- **Assunto Sugerido:** `Você tem {{UNREAD_COUNT}} mensagens não lidas no Voxy`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do destinatário.
  - `{{UNREAD_COUNT}}`: Total de mensagens pendentes.
  - `{{SENDER_LIST}}`: Lista resumida de quem enviou ou onde houve menção.
  - `{{OPEN_APP_LINK}}`: Link para abrir o app diretamente na conversa.

---

## ⚖️ 4. Ciclo de Vida e Conformidade (LGPD / GDPR)

### 4.1. Solicitação de Exclusão de Conta (Direito ao Esquecimento)
- **Alias no Resend:** `voxy-account-deletion`
- **Gatilho:** Usuário inicia o processo de exclusão da sua conta nas configurações.
- **Objetivo:** Confirmar a solicitação e conceder prazo de carência (ex: 14 dias) antes da remoção definitiva dos dados do banco e armazenamento R2.
- **Assunto Sugerido:** `Sua conta Voxy será excluída em 14 dias`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{DELETION_DATE}}`: Data final em que todos os dados e mídias serão apagados permanentemente.
  - `{{CANCEL_DELETION_LINK}}`: Link de segurança para cancelar a exclusão com um clique caso mude de ideia.

---

### 4.2. Aviso de Retenção de Dados e Histórico
- **Alias no Resend:** `voxy-data-retention-notice`
- **Gatilho:** Conforme o serviço de retenção do Voxy (`ChatRetentionService`), aviso prévio sobre expiração de anexos ou canais inativos.
- **Assunto Sugerido:** `Aviso de limpeza de histórico e anexos expirados`
- **Variáveis Dinâmicas:**
  - `{{USERNAME}}`: Nome do usuário.
  - `{{RETENTION_DAYS}}`: Dias configurados de retenção (ex: 60 dias).
  - `{{EXPIRING_COUNT}}`: Quantidade de arquivos com remoção programada.

---

## 📋 Resumo Consolidado de Aliases para o Resend

Para adicionar ao catálogo `RESEND_TEMPLATES` no backend ([`resend-templates.ts`](file:///e:/Development/ATeV%20Sistemas/Voxy/backend/src/infrastructure/adapters/communication/resend-templates.ts)):

```typescript
export const RESEND_TEMPLATES = {
  // 1. Autenticação & Conta
  EMAIL_VERIFICATION: 'voxy-email-verification',
  WELCOME: 'voxy-welcome',
  PASSWORD_RESET: 'voxy-password-reset',
  PASSWORD_CHANGED: 'voxy-password-changed',
  NEW_LOGIN_ALERT: 'voxy-new-login-alert',

  // 2. Proteção Parental
  PARENTAL_CONSENT: 'voxy-parental-consent',
  PARENTAL_ALERT: 'voxy-parental-security-alert',

  // 3. Social & Comunidade
  SERVER_INVITE: 'voxy-server-invite',
  FRIEND_REQUEST: 'voxy-friend-request-digest',
  UNREAD_DIGEST: 'voxy-unread-digest',

  // 4. LGPD & Retenção
  ACCOUNT_DELETION: 'voxy-account-deletion',
  DATA_RETENTION: 'voxy-data-retention-notice',
} as const;
```
