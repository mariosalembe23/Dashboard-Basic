# ConviteCerto — convites digitais com QR code

Protótipo funcional, em HTML/JS puro (sem instalação), com três páginas:

| Página | Para quem | O que faz |
|---|---|---|
| `index.html` | Clientes | Montra dos modelos de convites, como funciona, vantagens |
| `gerador.html` | Equipa interna | Escolhe modelo → dados do evento → lista de convidados → gera 1 convite PNG por convidado (nome + QR único) e descarrega tudo em ZIP |
| `portaria.html` | Agentes à porta | Importa `portaria.csv`, lê o QR com a câmara do telemóvel, aceita a 1.ª leitura e bloqueia as seguintes ("JÁ UTILIZADO") |

Para abrir localmente: `python3 -m http.server` dentro desta pasta e aceder a `http://localhost:8000`.
A câmara da portaria só funciona em `https` ou `localhost`.

## Como funciona o anti-duplicado

1. Cada convidado recebe um código aleatório de 8 caracteres (ex.: `K7M3QX2A`).
2. O QR contém `CNV1|<id do evento>|<código>`.
3. A portaria tem a lista de códigos válidos. Ao ler um QR:
   - código desconhecido → **CONVITE INVÁLIDO** (vermelho)
   - código de outro evento → **OUTRO EVENTO** (vermelho)
   - código já lido → **JÁ UTILIZADO às HH:MM** (laranja) — quem reencaminhou o convite é apanhado aqui
   - caso contrário → **BEM-VINDO(A), Nome — Mesa X** (verde), e a entrada fica registada

## Transformar os vossos modelos em código

Em `assets/templates.js` cada modelo é uma função que recebe os dados e devolve HTML. Duas opções:

- **Recriar em HTML/CSS** (como os 5 modelos de exemplo): texto nítido, cores e textos editáveis por evento.
- **"O meu modelo" (imagem)**: carregar a arte original (PNG/JPG, sem nome nem QR) e posicionar o nome e o QR com os controlos. Já funciona no gerador, sem programar.

## Limitações do protótipo → o que falta para produção

- **Vários agentes/portas em simultâneo**: hoje cada telemóvel guarda as entradas localmente. Para produção é preciso um servidor central (ex.: Supabase/Firebase ou uma API Node) para que um código lido na porta A seja recusado na porta B, e funcionar offline com sincronização.
- **Segurança do QR**: assinar o conteúdo do QR no servidor (HMAC) para que não se possam inventar códigos.
- **Envio automático**: integração com WhatsApp Business API / e-mail para enviar cada convite ao respetivo convidado.
- **Área do cliente**: o cliente carrega a lista (Excel), aprova a pré-visualização e paga online; painel com quem já chegou em tempo real.
- **Importação de Excel (.xlsx)** direta (hoje: CSV ou colar a lista).
