# Apenas Para Dizer — Web

Aplicação web do Apenas Para Dizer, criada com React e Vite. O acesso é
protegido por autenticação Google no Firebase e os dados de cada conta são
persistidos pela API separada do produto.

## Recursos

- autenticação obrigatória com Google;
- cadastro e edição de pessoas, incluindo imagem em Base64;
- várias mensagens por pessoa;
- registro de momentos com mensagem escolhida aleatoriamente;
- dados isolados pelo usuário autenticado;
- interface responsiva e mobile first.

## Rodar localmente

```bash
cp .env.example .env.local
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## Configuração

| Variável | Descrição |
| --- | --- |
| `VITE_API_URL` | URL da API do Apenas Para Dizer |

Por padrão, o exemplo aponta para
`https://apenas-para-dizer-api.vercel.app`.

O Firebase Web usa o projeto `apenas-para-dizer`. Para o login funcionar em
um novo domínio, ele também deve constar em **Authentication → Settings →
Authorized domains** no Firebase Console.

## Validação

```bash
npm run lint
npm run build
```
