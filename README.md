# 🍽️ Sabor Brasil — Sistema de Reserva e Gestão de Mesas

> **Projecto académico** · Engenharia de Software II · Instituto Superior Politécnico de Tete (ISPT)  
> Docente: Msc. Luís Nhacanhaca · Grupo 5 · Turno Diurno · Novembro 2026

**Site em produção:** https://sabor-brasil-neon.vercel.app
**Area de admin e staff:** https://sabor-brasil-neon.vercel.app/staff

---

## 👥 Equipa

| Nome | Papel |
|---|---|
| Chelton Maoze | Gestor de Projecto |
| Peter Namanha | Desenvolvimento |
| Gabriel Ussene | Desenvolvimento |
| Newton Bila | Desenvolvimento |
| Michael Chilala | Desenvolvimento |

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias e Ferramentas](#tecnologias-e-ferramentas)
3. [Arquitectura](#arquitectura)
4. [Padrões de Software Aplicados](#padrões-de-software-aplicados)
5. [Estrutura de Pastas](#estrutura-de-pastas)
6. [Base de Dados](#base-de-dados)
7. [Fluxo Completo da Aplicação](#fluxo-completo-da-aplicação)
8. [Controlo de Acesso por Perfil](#controlo-de-acesso-por-perfil)
9. [PWA — Aplicação Instalável](#pwa--aplicação-instalável)
10. [Segurança](#segurança)
11. [Deploy](#deploy)
12. [Como Correr Localmente](#como-correr-localmente)

---

## Visão Geral

O **Sabor Brasil** é um sistema web para gestão de reservas de mesas de um restaurante. Permite que clientes façam reservas online, paguem um sinal, e acompanhem o estado da sua reserva. O staff do restaurante gere as reservas do dia, atribui mesas e confirma pagamentos. O gestor controla contas de staff, valores da reserva e consulta o histórico completo.

O sistema é uma **Progressive Web App (PWA)**, instalável no telemóvel e no computador, com suporte a tema claro e escuro automático.

---

## Tecnologias e Ferramentas

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.4 | Framework React com App Router e Server Components |
| React | 19.3 | Interface do utilizador |
| TypeScript | 5.9 | Tipagem estática |
| Tailwind CSS | 4 | Estilo e tema claro/escuro |
| Bootstrap Icons (react-bootstrap-icons) | — | Ícones SVG sem fonte externa |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js Server Actions | — | Lógica de negócio no servidor, sem API REST separada |
| Prisma ORM | 7.10 | Acesso à base de dados com tipagem TypeScript |
| Node.js crypto (nativo) | — | Hash de passwords (scrypt) e assinatura de sessões (HMAC-SHA256) |

### Base de Dados e Infra
| Serviço | Uso |
|---|---|
| PostgreSQL | Base de dados relacional |
| Supabase | Hosting gerido do PostgreSQL (região Frankfurt) |
| Vercel | Deploy e hosting da aplicação (região Frankfurt) |
| GitHub | Repositório de código |

---

## Arquitectura

### Decisão: Monólito Modular

O sistema usa uma arquitectura **monolítica modular**, em que todo o código corre num único processo Next.js, mas está organizado em módulos com responsabilidades bem definidas.

**Por que não Microserviços?**

| Critério | Monólito Modular ✅ | Microserviços ❌ |
|---|---|---|
| Tamanho da equipa | Adequado (5 pessoas) | Requer equipas por serviço |
| Domínio | Coeso (um restaurante) | Fragmentado sem necessidade |
| Comunicação | Chamadas de função | HTTP / mensagens assíncronas |
| Deploy | Um processo (Vercel) | Orquestração (Kubernetes) |
| Custo inicial | Zero | Elevado |

### Camadas da Aplicação

```
┌─────────────────────────────────────────────────┐
│  CAMADA DE APRESENTAÇÃO  (app/)                 │
│  React Server Components + Client Components   │
│  Páginas, formulários, componentes visuais      │
├─────────────────────────────────────────────────┤
│  CAMADA DE APLICAÇÃO  (app/**/actions.ts)       │
│  Server Actions — validação de sessão,          │
│  controlo de acesso por perfil, orquestração    │
├─────────────────────────────────────────────────┤
│  CAMADA DE DOMÍNIO  (lib/)                      │
│  Regras de negócio puras:                       │
│  · Chain of Responsibility (validação reserva)  │
│  · LSP (hierarquia de pagamentos)               │
│  · Composite (cardápio)                         │
│  · Sessão, passwords, datas, configuração       │
├─────────────────────────────────────────────────┤
│  CAMADA DE DADOS  (Prisma + Supabase)           │
│  Prisma Client gerado a partir do schema        │
│  PostgreSQL na nuvem (Supabase, Frankfurt)      │
└─────────────────────────────────────────────────┘
```

Cada camada só conhece a que está imediatamente abaixo. Uma página nunca acede directamente à base de dados — passa sempre por uma Server Action, que por sua vez usa a biblioteca `lib/`.

---

## Padrões de Software Aplicados

### 1. Liskov Substitution Principle (LSP)

**Onde:** `lib/pagamentos/metodos.ts`

**Problema:** O sistema suporta três métodos de pagamento (M-Pesa, e-Mola, Conta Bancária). O código de processamento não deve mudar quando um novo método é adicionado.

**Solução:** A classe abstracta `Pagamento` define o contrato. Cada subtipo implementa `gerarReferencia()` e herda `processar()`. O resto do sistema trabalha exclusivamente com `Pagamento`, sem saber qual subtipo está a usar.

```typescript
abstract class Pagamento {
  abstract readonly tipo: TipoPagamento
  abstract readonly nome: string
  abstract gerarReferencia(): string

  async processar(valor: number): Promise<ResultadoPagamento> {
    if (valor <= 0) return { sucesso: false, referencia: '' }
    return { sucesso: true, referencia: this.gerarReferencia() }
  }
}

class PagamentoMPesa extends Pagamento {
  readonly tipo = 'MPESA' as const
  readonly nome = 'M-Pesa'
  gerarReferencia() { return `MP${digitos(8)}` }
}

// PagamentoEmola e PagamentoBanco seguem o mesmo contrato
```

**Prova do LSP:** A função `processar` recebe `Pagamento` (a classe base) e funciona com qualquer subtipo sem modificações.

---

### 2. Composite

**Onde:** `prisma/schema.prisma` (modelo `CategoriaCardapio`) e `lib/` (lógica de listagem)

**Problema:** O cardápio tem categorias (Pratos Principais, Bebidas) que contêm subcategorias (Churrasco, Cocktails) que contêm itens. O código de listagem não deve diferenciar entre ramos e folhas.

**Solução:** `CategoriaCardapio` aponta para si própria através de `categoriaPaiId`, formando uma árvore. O método `listarItens()` percorre recursivamente todos os ramos.

```typescript
class CategoriaCardapio {
  private subcategorias: CategoriaCardapio[] = []
  private itens: ItemCardapio[] = []

  listarItens(): ItemCardapio[] {
    return [
      ...this.itens,
      ...this.subcategorias.flatMap(sub => sub.listarItens()),
    ]
  }
}
```

**Benefício:** Adicionar um novo nível de subcategorias (ex: "Churrasco de Frango" dentro de "Churrasco") não muda uma linha da lógica de listagem.

---

### 3. Chain of Responsibility

**Onde:** `lib/reservas/validadores.ts`

**Problema:** Criar uma reserva exige verificar várias regras: o horário deve ser válido, a área deve ter capacidade, e deve haver lugares disponíveis. Cada regra é independente, e a ordem importa (verificações baratas primeiro).

**Solução:** Cada regra é um elo da cadeia. Se recusar, a cadeia para e devolve o motivo. Se aprovar, passa ao seguinte.

```
Pedido de reserva
       │
       ▼
┌──────────────┐    recusa    ┌─────────────────────────┐
│  Validador   │ ──────────► │ "Data já passou"        │
│  Horário     │             │ "Fora do horário"        │
└──────┬───────┘             │ "Duração deve ser 2h"   │
       │ aprova              └─────────────────────────┘
       ▼
┌──────────────┐    recusa    ┌─────────────────────────┐
│  Validador   │ ──────────► │ "Área não existe"       │
│  Capacidade  │             │ "Só tem X lugares"      │
└──────┬───────┘             └─────────────────────────┘
       │ aprova
       ▼
┌──────────────┐    recusa    ┌─────────────────────────┐
│  Validador   │ ──────────► │ "Só restam X lugares"   │
│  Disponibi-  │             │ "Área cheia nesse horário│
│  lidade      │             └─────────────────────────┘
└──────┬───────┘
       │ aprova
       ▼
  Reserva criada
```

```typescript
export abstract class ValidadorReserva {
  private proximo?: ValidadorReserva

  encadear(proximo: ValidadorReserva): ValidadorReserva {
    this.proximo = proximo
    return proximo
  }

  async validar(dados: DadosReserva): Promise<ResultadoValidacao> {
    const resultado = await this.verificar(dados)
    if (!resultado.valida) return resultado
    return this.proximo ? this.proximo.validar(dados) : resultado
  }

  protected abstract verificar(dados: DadosReserva): Promise<ResultadoValidacao>
}
```

**Montagem da cadeia:**
```typescript
export function criarCadeiaDeValidacao(): ValidadorReserva {
  const horario = new ValidadorHorario()
  horario.encadear(new ValidadorCapacidade())
        .encadear(new ValidadorDisponibilidade())
  return horario
}
```

**Benefício:** Adicionar um novo validador (ex: validar limite de reservas por cliente) é criar uma nova classe e encadeá-la, sem tocar nos existentes.

---

## Estrutura de Pastas

```
sabor-brasil/
│
├── app/                          # Camada de apresentação (Next.js App Router)
│   ├── page.tsx                  # Página inicial (zonas + cardápio)
│   ├── layout.tsx                # Layout global (tema, PWA, service worker)
│   ├── manifest.ts               # Manifesto PWA
│   ├── globals.css               # Variáveis de cor (tema claro e escuro)
│   │
│   ├── componentes/              # Componentes partilhados
│   │   ├── estilos.ts            # Classes Tailwind reutilizadas
│   │   ├── Marca.tsx             # Logo + botão de tema
│   │   ├── Topo.tsx              # Cabeçalho das páginas
│   │   ├── Mensagem.tsx          # Mensagens de erro/sucesso
│   │   ├── SeloEstado.tsx        # Etiqueta colorida de estado da reserva
│   │   ├── IconeZona.tsx         # Ícone por área (Interior/Esplanada/Piscina)
│   │   └── AlternarTema.tsx      # Botão claro/escuro
│   │
│   ├── entrar/                   # Login do cliente
│   ├── registar/                 # Registo do cliente
│   ├── reservar/                 # Formulário de nova reserva
│   ├── reservas/                 # Lista de reservas do cliente
│   │   └── [id]/pagar/           # Página de pagamento de uma reserva
│   │
│   ├── staff/                    # Painel do staff e gestor
│   │   ├── entrar/               # Login do staff/gestor
│   │   ├── gestor/               # Área exclusiva do gestor
│   │   │   └── clientes/         # Lista de clientes registados
│   │   ├── AtribuirMesa.tsx      # Componente de atribuição de mesa
│   │   └── actions.ts            # Ações do staff (atribuir, concluir, cancelar)
│   │
│   ├── BotaoInstalar.tsx         # Aviso PWA de instalação
│   ├── CabecalhoUtilizador.tsx   # Menu do cliente (nome, links, sair)
│   ├── Separadores.tsx           # Navegação por separadores/filtros
│   └── RegistarServiceWorker.tsx # Registo do service worker PWA
│
├── lib/                          # Camada de domínio (lógica de negócio)
│   ├── prisma.ts                 # Singleton do Prisma Client
│   ├── sessao.ts                 # Cookies assinados (cliente + staff)
│   ├── senha.ts                  # Hash scrypt + verificação
│   ├── telefone.ts               # Normalização de números de Moçambique
│   ├── configuracao.ts           # Leitura da configuração do restaurante
│   ├── datas.ts                  # Utilitários de datas no fuso de Moçambique
│   ├── clientes.ts               # Consulta de clientes (gestor)
│   │
│   ├── pagamentos/
│   │   ├── metodos.ts            # LSP: Pagamento, MPesa, eMola, Banco
│   │   └── valores.ts            # Cálculo do total e do mínimo
│   │
│   └── reservas/
│       ├── validadores.ts        # Chain of Responsibility
│       ├── ciclo-de-vida.ts      # Expiração automática e regras de cancelamento
│       └── historico.ts          # Consulta do histórico (gestor vs staff)
│
├── prisma/
│   ├── schema.prisma             # Modelos da base de dados (8 tabelas)
│   └── migrations/               # Histórico de migrações
│
├── public/
│   ├── icons/                    # Ícones PWA (192px, 512px, maskable, apple)
│   ├── sw.js                     # Service worker (cache da página offline)
│   └── offline.html              # Página sem internet
│
├── tests/                        # Testes automatizados (Vitest)
│   ├── telefone.test.ts
│   ├── senha.test.ts
│   ├── pagamentos.test.ts
│   └── validadores.test.ts
│
├── .env                          # Variáveis de ambiente (não vai ao GitHub)
├── package.json
├── prisma7.config.ts             # Configuração do Prisma 7
├── vercel.json                   # Região de deploy (Frankfurt)
└── vitest.config.ts              # Configuração dos testes
```

---

## Base de Dados

### Modelos (8 tabelas)

```
Cliente ──────────────────── Reserva
  id                           id
  nome                         clienteId ──► Cliente
  telefone (único)             zonaId ──────► Zona
  senhaHash                    mesaId ──────► Mesa (opcional)
  dataRegisto                  staffId ─────► Staff (opcional)
  reservas[]                   nPessoas
                               dataHora
                               duracao (fixo: 120 min)
                               estado (PENDENTE | AGUARDA_PAGAMENTO |
                               criadaEm        CONFIRMADA | CONCLUIDA | CANCELADA)
                               pagamento ───► Pagamento (opcional)

Zona ──────────────────────── Mesa
  id                           id
  nome                         zonaId ──────► Zona
  mesas[]                      capacidade
  reservas[]                   tipo

Staff                          Pagamento
  id                           id
  nome                         reservaId ───► Reserva (único: 1-para-1)
  telefone (único)             tipo (MPESA | EMOLA | BANCO)
  senhaHash                    valorPago
  perfil (STAFF | GESTOR)      valorTotal
  ativo                        referencia
  reservas[]                   estado (PARCIAL | TOTAL)

CategoriaCardapio ─────────── ItemCardapio
  id                           id
  nome                         categoriaId ─► CategoriaCardapio
  categoriaPaiId ──► self      nome
  subcategorias[]              descricao
  itens[]                      preco

Configuracao
  id (fixo: "geral")
  taxaPorPessoa
  percentagemMinima
```

### Estados da Reserva (Diagrama de Estados)

```
                    ┌─────────────┐
                    │   PENDENTE  │
                    └──────┬──────┘
                           │ cliente paga
                           ▼
                ┌──────────────────────┐
                │  AGUARDA_PAGAMENTO   │◄── criada aqui
                └────┬─────────────────┘
                     │                 │
           paga      │                 │ 30 min sem pagamento
                     ▼                 ▼
              ┌────────────┐    ┌────────────┐
              │ CONFIRMADA │    │ CANCELADA  │◄── também por cliente
              └────┬───────┘    │ ou staff   │
                   │            └────────────┘
     mesa + pago   │
     completo      │
                   ▼
              ┌────────────┐
              │  CONCLUIDA │
              └────────────┘
```

---

## Fluxo Completo da Aplicação

### Ecrã 1 — Página inicial (`/`)

**O que mostra:** Logo com botão de tema, menu de navegação, cartão verde de boas-vindas com botão "Reservar mesa", lista das 3 áreas do restaurante (Interior, Esplanada, Piscina) com número de mesas e lugares, cardápio completo organizado por categorias e subcategorias.

**Dados carregados:** Zonas com mesas, categorias do cardápio com subcategorias e itens (leitura directa do Supabase, sem cache).

**Acesso:** Público. Visitantes sem conta podem ver o cardápio e as áreas.

---

### Ecrã 2 — Criar conta (`/registar`)

**O que mostra:** Formulário com 4 campos: nome completo, número de telemóvel moçambicano, palavra-passe (mínimo 6 caracteres), confirmação de palavra-passe.

**Validações (servidor):**
- Nome com pelo menos 3 caracteres
- Número de telemóvel normalizado (`+258` + prefixo 82-87 + 7 dígitos)
- Palavra-passe com pelo menos 6 caracteres
- As duas palavras-passe coincidem
- Número não está já registado

**O que acontece:** A palavra-passe nunca é guardada. O sistema cria um hash com `scrypt` + sal aleatório de 16 bytes, e guarda só o hash. Em caso de sucesso, aparece a mensagem e um link para entrar.

---

### Ecrã 3 — Entrar (`/entrar`)

**O que mostra:** Formulário com número de telemóvel e palavra-passe.

**Validações (servidor):**
- Número válido
- Número existe na base de dados
- Palavra-passe corresponde ao hash guardado (verificada com `timingSafeEqual` para prevenir ataques de temporização)

**O que acontece:** Em caso de sucesso, cria um cookie de sessão assinado com HMAC-SHA256 (válido 7 dias) e redireciona para a página inicial, que já mostra "Olá, [nome]" no cabeçalho.

**Nota de segurança:** A mensagem de erro é a mesma para "número não existe" e "palavra-passe errada", para não revelar quais números têm conta.

---

### Ecrã 4 — Reservar mesa (`/reservar`)

**O que mostra:** Formulário com 3 campos: área preferida (cartões com ícone — Interior, Esplanada, Piscina), número de pessoas, data e hora.

**Acesso:** Requer sessão. Sem sessão, redireciona para `/entrar`.

**Validações em cadeia (Chain of Responsibility):**

1. **ValidadorHorário:**
   - Data e hora são futuras?
   - Duração é de 2 horas?
   - A hora está dentro do horário de funcionamento (11:00–22:00, fuso de Moçambique)?

2. **ValidadorCapacidade:**
   - A área existe e tem mesas?
   - O número de pessoas não excede os lugares totais da área?

3. **ValidadorDisponibilidade:**
   - Contagem de lugares já reservados nesse horário na mesma área
   - Há lugares livres suficientes?

A cadeia para na primeira recusa e devolve o motivo ao cliente.

**O que acontece:** Reserva criada com estado `AGUARDA_PAGAMENTO`. O cliente é redireccionado para "As minhas reservas".

---

### Ecrã 5 — As minhas reservas (`/reservas`)

**O que mostra:** Dois separadores — **Ativas** e **Histórico**.

- **Ativas:** reservas com estado PENDENTE, AGUARDA_PAGAMENTO ou CONFIRMADA, da mais próxima para a mais distante.
- **Histórico:** reservas CONCLUÍDAS e CANCELADAS, da mais recente para a mais antiga.

**Para cada reserva ativa mostra:**
- Área, número de pessoas, data/hora, duração
- Etiqueta de estado colorida
- Se AGUARDA_PAGAMENTO: botão "Pagar agora" + prazo (hora de expiração)
- Se tem pagamento: valor pago, valor total, método, referência, e aviso se falta pagar o restante
- Se pode cancelar (estado activo + mais de 2 horas até à reserva): botão "Cancelar reserva"

**Expiração automática:** Ao abrir esta página, o sistema cancela automaticamente as reservas que ultrapassaram o prazo de 30 minutos sem pagamento, libertando os lugares.

---

### Ecrã 6 — Pagar reserva (`/reservas/[id]/pagar`)

**O que mostra:** Resumo da reserva (área, data, pessoas), escolha de modalidade de pagamento e método.

**Modalidades:**
- **Pagamento parcial** (mínimo definido pelo gestor, por defeito 30%): garante a reserva, o restante paga no restaurante com a mesma referência.
- **Pagamento total**: tudo pago online.

**Métodos (LSP — todos substituem `Pagamento`):**
- M-Pesa → referência `MP` + 8 dígitos
- e-Mola → referência `EM` + 8 dígitos
- Conta bancária → referência `BK` + 10 dígitos

**O que acontece:** O pagamento é simulado (aprovado imediatamente). O sistema grava o pagamento e actualiza o estado da reserva para `CONFIRMADA` numa transacção atómica.

---

### Ecrã 7 — Login do staff (`/staff/entrar`)

**O que mostra:** Formulário com número de telemóvel e palavra-passe.

**Diferença do login do cliente:** A sessão é guardada num cookie separado (`sessao_staff`), para nunca conflituar com a sessão do cliente. Uma conta de staff desactivada (`ativo: false`) não consegue entrar, mesmo com as credenciais correctas.

---

### Ecrã 8 — Painel do staff (`/staff`)

**O que mostra:** Cabeçalho com nome e perfil (Staff ou Gestor), link para a área do gestor (só visível para o Gestor), e 6 separadores:

- **Hoje / Amanhã / Próximos / Anteriores / Todas:** filtros por data das reservas ativas.
- **Histórico:** reservas concluídas e canceladas, com pesquisa.

**Para cada reserva activa:**
- Nome e telemóvel do cliente
- Área, data/hora, número de pessoas
- Etiqueta de estado
- Dados do pagamento e referência
- Mesa atribuída (se já foi atribuída)
- Selector de mesa + botão "Atribuir mesa" (só se CONFIRMADA)
- Botão "Confirmar pagamento do restante" (se falta valor)
- Botão "Concluir atendimento" (só com mesa atribuída + pagamento completo)
- Botão "Cancelar reserva" (liberta lugares e mesa)

**Separador Histórico:**
- Staff: últimos 30 dias
- Gestor: todo o histórico
- Pesquisa por nome, telemóvel ou referência de pagamento

---

### Ecrã 9 — Área do gestor (`/staff/gestor`)

**Acesso:** Só perfil GESTOR. O perfil STAFF é redireccionado para o painel.

**O que mostra:**

**Cartão de acesso rápido:**
- Total de clientes registados → link para `/staff/gestor/clientes`

**Secção: Valores da reserva**
- Taxa por pessoa (MT)
- Pagamento parcial mínimo (%)
- Botão "Guardar valores" — actualiza em tempo real, afecta as próximas reservas

**Secção: Contas do restaurante**
- Lista de todas as contas com nome, telemóvel, perfil e estado (Ativa/Desativada)
- Botão "Desativar/Ativar" (o gestor não pode desactivar a sua própria conta)
- Formulário para criar nova conta (nome, telemóvel, palavra-passe, perfil STAFF ou GESTOR)

**Secção: Zonas e mesas**
- Cada zona com o total de mesas e lugares
- Lista de mesas com capacidade, e botão "Remover" (bloqueado se a mesa tem reserva confirmada)
- Formulário para adicionar mesa (seleccionar área e número de lugares)

---

### Ecrã 10 — Clientes registados (`/staff/gestor/clientes`)

**Acesso:** Só perfil GESTOR.

**O que mostra:**
- Dois cartões de resumo: total de clientes e novos nos últimos 7 dias
- Caixa de pesquisa (nome ou telemóvel)
- Lista de clientes com nome, telemóvel, data de registo e número de reservas
- Máximo de 200 resultados (os mais recentes)

---

## Controlo de Acesso por Perfil

| Rota | Visitante | Cliente | Staff | Gestor |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/entrar`, `/registar` | ✅ | ✅ | ✅ | ✅ |
| `/reservar` | → `/entrar` | ✅ | → `/entrar` | → `/entrar` |
| `/reservas` | → `/entrar` | ✅ (só as suas) | → `/entrar` | → `/entrar` |
| `/reservas/[id]/pagar` | → `/entrar` | ✅ (só a sua) | → `/entrar` | → `/entrar` |
| `/staff/entrar` | ✅ | ✅ | ✅ | ✅ |
| `/staff` | → `/staff/entrar` | → `/staff/entrar` | ✅ | ✅ |
| `/staff/gestor` | → `/staff/entrar` | → `/staff/entrar` | → `/staff` | ✅ |
| `/staff/gestor/clientes` | → `/staff/entrar` | → `/staff/entrar` | → `/staff` | ✅ |

---

## PWA — Aplicação Instalável

O sistema está configurado como Progressive Web App, instalável no telemóvel e no computador.

**Ficheiros PWA:**
- `app/manifest.ts` — nome, cores, ícones, atalhos
- `public/sw.js` — service worker (guarda só a página offline, nunca dados de reservas)
- `public/offline.html` — página mostrada sem internet
- `public/icons/` — ícones 192px, 512px, maskable (Android) e apple-touch-icon (iOS)

**Comportamento:**
- **Android (Chrome/Edge):** botão de instalação nativo + aviso no site
- **iOS (Safari):** instruções para "Adicionar ao ecrã principal"
- **Sem internet:** mostra a página offline em vez de um erro do navegador
- **Dados:** nunca são guardados em cache local (cada página é sempre lida do servidor), para garantir que o cliente nunca vê informação desactualizada

**Tema claro/escuro:**
- Detecta automaticamente a preferência do sistema operativo
- Botão para alternar manualmente (guardado no localStorage)
- Aplica-se a todas as páginas, incluindo o painel do staff

---

## Segurança

| Mecanismo | Implementação |
|---|---|
| Passwords | `scrypt` com sal aleatório de 16 bytes (`node:crypto`) — nunca texto simples |
| Verificação de password | `timingSafeEqual` — previne ataques de temporização |
| Sessão do cliente | Cookie `HttpOnly` + `SameSite=Lax`, assinado com HMAC-SHA256 |
| Sessão do staff | Cookie separado (`sessao_staff`), mesmo mecanismo |
| Controlo de acesso | Verificado no servidor em cada Server Action |
| Dados sensíveis | `.env` no `.gitignore`, variáveis de ambiente na Vercel |
| Referências de pagamento | Geradas aleatoriamente no servidor, nunca previsíveis |

---

## Deploy

O sistema está publicado em produção na Vercel, com a base de dados no Supabase.

**URL de produção:** https://sabor-brasil-neon.vercel.app

**Configuração:**
- Região Vercel: `fra1` (Frankfurt) — mesma região do Supabase, para mínima latência
- Variáveis de ambiente na Vercel: `DATABASE_URL` e `SESSION_SECRET`
- Build command: `prisma generate --config prisma7.config.ts && next build`

**Actualizações:** Cada commit no GitHub despoleta um novo deploy automático na Vercel (1–3 minutos).

---

## Como Correr Localmente

### Pré-requisitos
- Node.js 20+
- Conta no Supabase (base de dados PostgreSQL)

### Passos

**1. Clonar o repositório**
```bash
git clone https://github.com/[utilizador]/sabor-brasil.git
cd sabor-brasil
```

**2. Instalar dependências**
```bash
npm install
npm approve-scripts prisma @prisma/engines
```

**3. Configurar variáveis de ambiente**

Criar o ficheiro `.env` na raiz do projecto:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
SESSION_SECRET="[64 caracteres aleatórios — gerados com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"]"
```

**4. Criar as tabelas na base de dados**
```bash
npx prisma db push --config prisma7.config.ts
```

**5. Gerar o cliente Prisma**
```bash
npx prisma generate --config prisma7.config.ts
```

**6. Carregar dados iniciais**
```bash
npm run dev
# abrir no navegador: http://localhost:3000/api/seed
# apagar a pasta app/api depois de usar
```

**7. Correr o servidor de desenvolvimento**
```bash
npm run dev
# http://localhost:3000
```

**8. Criar a primeira conta de gestor**

Criar temporariamente `app/api/criar-gestor/route.ts`, abrir `http://localhost:3000/api/criar-gestor`, e apagar a pasta `api` depois.

### Comandos úteis

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # compilação de produção
npm test             # testes automatizados
npm run test:coverage # cobertura de testes
```

---

## Referências

- Pressman, R. S. (2010). *Engenharia de Software: Uma Abordagem Profissional* (7ª ed.)
- Sommerville, I. (2011). *Software Engineering* (9ª ed.)
- Gamma, E., Helm, R., Johnson, R., Vlissides, J. (1994). *Design Patterns*
- Bezerra, E. (2015). *Princípios de Análise e Projecto de Sistemas com UML*
- Da Silva, A. M. R., Videira, C. A. E. (2001). *UML, Metodologias e Ferramentas CASE*
- Refactoring.guru — https://refactoring.guru/design-patterns
- Documentação Next.js — https://nextjs.org/docs
- Documentação Prisma — https://www.prisma.io/docs
- Documentação Supabase — https://supabase.com/docs

---

*Sistema desenvolvido no âmbito da disciplina de Engenharia de Software II, ISPT, 2026.*
