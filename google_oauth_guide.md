# Guia: Configuração do Google OAuth para o Moto Hub Brasil 🔐🌐

Siga este passo a passo para gerar as chaves necessárias e ativar o login social no seu aplicativo.

## 1. Google Cloud Console
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. No topo, clique em **Select a Project** > **New Project**.
3. Nomeie como `Moto Hub Brasil` e clique em **Create**.

## 2. Tela de Consentimento (OAuth Consent Screen)
*Este passo define o que o usuário verá ao clicar no botão de login.*

1. No menu lateral, vá em **APIs & Services** > **OAuth consent screen**.
2. Escolha **External** e clique em **Create**.
3. **App Information**: 
   - App Name: `Moto Hub Brasil`
   - User support email: `seu-email@exemplo.com`
   - Developer contact info: `seu-email@exemplo.com`
4. Clique em **Save and Continue** até o final (não precisa configurar Scopes agora).
5. No final do resumo, clique em **Back to Dashboard**.
6. **IMPORTANTE**: No painel da Tela de Consentimento, clique em **Publish App** para que ele saia do modo de teste e permita logins reais.

## 3. Criar as Credenciais (API Keys)
1. No menu lateral, clique em **Credentials**.
2. Clique em **+ Create Credentials** > **OAuth client ID**.
3. Selecione o tipo: **Web application**.
4. Nome: `Supabase Auth`.
5. **Authorized redirect URIs (Obrigatório)**:
   - Vá ao painel do seu [Supabase](https://supabase.com/dashboard).
   - Vá em **Authentication** > **Providers** > **Google**.
   - Copie o **Callback URL** que aparece lá (será algo como `https://xxxx.supabase.co/auth/v1/callback`).
   - Volte ao Google e cole esse link no campo.
6. Clique em **Create**.

## 4. Finalizar no Supabase
1. O Google mostrará seu **Client ID** e **Client Secret**.
2. **Copie os dois** e cole nos respectivos campos no painel do Supabase (**Authentication** > **Providers** > **Google**).
3. Ative a chave **Enable Google Provider** no Supabase.
4. Clique em **Save**.

---

> [!TIP]
> **Dica de Segurança:** Nunca compartilhe o seu *Client Secret* com ninguém. Ele é a chave mestre da sua integração.

> [!IMPORTANT]
> Se você for testar no **Android**, certifique-se de que a URL de redirecionamento no código do app (no `UserContext.jsx`) aponte para o domínio correto onde o app está rodando. Para testes locais, `window.location.origin` funciona bem.
