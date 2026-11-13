# 🍽️ Sabor Brasil — Sistema de Reserva e Gestão de Mesas

> **Projecto académico** · Engenharia de Software II · Instituto Superior Politécnico de Tete (ISPT)
> Docente: Msc. Luís Nhacanhaca · Grupo 5 · Turno Diurno · Novembro 2026

---

## 🌐 Acesso ao Sistema

| Perfil | Endereço | Como aceder |
|---|---|---|
| **Cliente** | https://sabor-brasil-neon.vercel.app | Crie uma conta em `/registar` |
| **Gestor** | https://sabor-brasil-neon.vercel.app/staff/entrar | Use as credenciais abaixo |
| **Github** | https://github.com/centralajuda339-cpu/sabor-brasil |

### Credenciais de demonstração (Gestor)

```
Telemóvel : 84 000 0000   (ou o número definido na instalação)
Senha     : (definida pelo grupo — apresentar ao docente em papel)
```

> ⚠️ Por segurança, as credenciais reais do gestor são entregues ao docente
> separadamente e não ficam neste ficheiro público.

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

1. [O que é este sistema](#o-que-é-este-sistema)
2. [Funcionalidades](#funcionalidades)
3. [Tecnologias e Ferramentas](#tecnologias-e-ferramentas)
4. [Princípios SOLID Aplicados](#princípios-solid-aplicados)
5. [Padrões de Design Aplicados](#padrões-de-design-aplicados)
6. [Arquitectura](#arquitectura)
7. [Estrutura de Pastas](#estrutura-de-pastas)
8. [Base de Dados](#base-de-dados)
9. [Fluxo Completo da Aplicação](#fluxo-completo-da-aplicação)
10. [Controlo de Acesso por Perfil](#controlo-de-acesso-por-perfil)
11. [Segurança](#segurança)
12. [PWA — Aplicação Instalável](#pwa--aplicação-instalável)
13. [Deploy](#deploy)
14. [Como Correr Localmente](#como-correr-localmente)
15. [Referências Bibliográficas](#referências-bibliográficas)

---

## O que é este sistema

O **Sabor Brasil** é um sistema web completo para gestão de reservas de mesas de um restaurante. Foi desenvolvido como projecto académico da disciplina de Engenharia de Software II, aplicando os padrões e princípios estudados ao longo do semestre.

### O problema que resolve

Antes deste sistema, o restaurante Sabor Brasil geria as reservas por telefone, sem registo digital. Isto causava:

- Overbooking (aceitar mais reservas do que lugares disponíveis)
- Sem controlo de pagamentos antecipados
- Staff sem visibilidade das reservas do dia
- Sem histórico de clientes

### A solução

Um sistema web acessível em qualquer dispositivo, instalável como aplicação no telemóvel (PWA), com três níveis de acesso distintos: **Cliente**, **Staff** e **Gestor**.

---

## Funcionalidades

### Para o Cliente
- Criar conta com número de telemóvel moçambicano e palavra-passe
- Ver as áreas do restaurante (Interior, Esplanada, Piscina) e o cardápio
- Fazer uma reserva escolhendo área, número de pessoas e data/hora
- Pagar online (pagamento parcial ou total) via M-Pesa, e-Mola ou conta bancária
- Acompanhar o estado das reservas (Ativas e Histórico)
- Cancelar uma reserva até 2 horas antes
- Instalar a aplicação no telemóvel (Android e iOS)
- Tema claro e escuro automático

### Para o Staff
- Ver as reservas do dia, de amanhã, próximas e todas (separadores)
- Atribuir a mesa concreta a cada reserva confirmada
- Confirmar o pagamento do restante quando o cliente chega
- Concluir o atendimento quando o cliente é servido
- Cancelar reservas e libertar lugares
- Consultar o histórico dos últimos 30 dias com pesquisa

### Para o Gestor (tudo do Staff mais)
- Ver a lista de todos os clientes registados com total de reservas
- Definir a taxa de reserva por pessoa e a percentagem mínima do pagamento parcial
- Criar e desactivar contas de Staff
- Adicionar e remover mesas por área
- Consultar todo o histórico de reservas sem limite de datas

---

## Tecnologias e Ferramentas

### Frontend
| Tecnologia | Versão | Para que serve |
|---|---|---|
| Next.js | 16.4 | Framework React com App Router e Server Components |
| React | 19.3 | Construção da interface do utilizador |
| TypeScript | 5.9 | Tipagem estática — detecta erros antes de correr o código |
| Tailwind CSS | 4 | Estilo e tema claro/escuro via variáveis CSS |
| Bootstrap Icons | — | Ícones SVG sem descarregar fontes externas |

### Backend
| Tecnologia | Versão | Para que serve |
|---|---|---|
| Next.js Server Actions | 16.4 | Lógica de negócio no servidor, sem API REST separada |
| Prisma ORM | 7.10 | Acesso à base de dados com tipagem TypeScript gerada automaticamente |
| Node.js crypto (nativo) | — | Hash de passwords (scrypt) e assinatura de sessões (HMAC-SHA256) |

### Base de Dados e Infra
| Serviço | Para que serve |
|---|---|
| PostgreSQL | Base de dados relacional |
| Supabase | Hosting gerido do PostgreSQL na nuvem (região Frankfurt) |
| Vercel | Deploy e hosting da aplicação (região Frankfurt) |
| GitHub | Repositório de código e CI/CD automático |

### Ferramentas de Desenvolvimento
| Ferramenta | Para que serve |
|---|---|
| VS Code | Editor de código |
| Vitest | Testes automatizados |
| PlantUML / PlantText | Diagramas UML |
| ESLint | Verificação de qualidade do código |

---

## Princípios SOLID Aplicados

SOLID é um conjunto de cinco princípios de design de software orientado a objectos. Aplicámos três de forma directa:

### S — Single Responsibility Principle
*"Cada módulo deve ter uma única razão para mudar."*

Cada ficheiro da pasta `lib/` tem uma responsabilidade só:

| Ficheiro | Responsabilidade única |
|---|---|
| `lib/senha.ts` | Criar e verificar hashes de passwords |
| `lib/sessao.ts` | Criar, ler e terminar cookies de sessão |
| `lib/telefone.ts` | Normalizar números de telemóvel moçambicanos |
| `lib/reservas/validadores.ts` | Validar se uma reserva pode ser criada |
| `lib/pagamentos/metodos.ts` | Processar pagamentos simulados |
| `lib/configuracao.ts` | Ler a configuração do restaurante |

Se as regras de validação de telemóvel mudarem, só `lib/telefone.ts` precisa de ser alterado.

### O — Open/Closed Principle
*"Aberto para extensão, fechado para modificação."*

**Na cadeia de validação:** Para adicionar uma nova regra (ex: "máximo de 3 reservas por cliente por dia"), cria-se uma nova classe `ValidadorLimiteCliente` e encadeia-se. Os validadores existentes não mudam:

```typescript
horario.encadear(capacidade)
       .encadear(disponibilidade)
       .encadear(new ValidadorLimiteCliente()) // novo, sem mudar os outros
```

**Nos métodos de pagamento:** Para adicionar e-Zit ou outro método, cria-se uma nova classe que estende `Pagamento`. O código de processamento não muda.

### L — Liskov Substitution Principle
*"Subtipos devem poder substituir o tipo base sem alterar o comportamento do programa."*

Aplicado na hierarquia de pagamentos — ver secção seguinte.

---

## Padrões de Design Aplicados

### 1. Liskov Substitution Principle — Hierarquia de Pagamentos

**Ficheiro:** `lib/pagamentos/metodos.ts`

**O problema:** O sistema suporta três métodos de pagamento. O código de processamento não deve mudar quando um novo método é adicionado.

**A solução:** A classe abstracta `Pagamento` define o contrato. Cada subtipo implementa `gerarReferencia()` com a sua própria lógica, e herda `processar()` sem a precisar de redefinir.

```
           Pagamento (abstracta)
           ├── processar(valor): ResultadoPagamento
           └── gerarReferencia(): string  ← abstracto
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   MPesa           eMola        Banco
   MP+8dígitos   EM+8dígitos  BK+10dígitos
```

```typescript
abstract class Pagamento {
  abstract readonly tipo: TipoPagamento
  abstract readonly nome: string
  abstract gerarReferencia(): string

  // Este método funciona com qualquer subtipo (LSP)
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
```

**Prova do LSP:** A função abaixo recebe `Pagamento` (a classe base) e funciona com qualquer subtipo sem modificações:

```typescript
async function processarQualquerPagamento(metodo: Pagamento, valor: number) {
  return metodo.processar(valor) // nunca precisa de saber qual subtipo é
}
```

**Benefício:** Adicionar e-Zit é criar uma classe e juntá-la à lista. Zero linhas alteradas no resto do sistema.

---

### 2. Composite — Cardápio em Árvore

**Ficheiro:** `prisma/schema.prisma` (modelo `CategoriaCardapio`)

**O problema:** O cardápio tem categorias que contêm subcategorias que contêm itens. A lógica de listagem não deve diferenciar ramos de folhas.

**A solução:** `CategoriaCardapio` aponta para si própria através de `categoriaPaiId`, formando uma árvore. O método `listarItens()` percorre recursivamente todos os níveis.

```
Cardápio
├── Pratos Principais  (categoria raiz)
│   ├── Churrasco       (subcategoria = ramo)
│   │   ├── Picanha na brasa   950 MT  (item = folha)
│   │   └── Costela assada     890 MT
│   ├── Pizzas
│   │   ├── Margherita         520 MT
│   │   └── Calabresa          580 MT
│   └── Mariscos
│       └── Camarão grelhado  1200 MT
└── Bebidas
    ├── Cocktails
    │   ├── Caipirinha         320 MT
    │   └── Mojito             350 MT
    └── Cervejas
        └── Cerveja gelada     120 MT
```

```typescript
class CategoriaCardapio {
  private subcategorias: CategoriaCardapio[] = []
  private itens: ItemCardapio[] = []

  listarItens(): ItemCardapio[] {
    return [
      ...this.itens,
      // percorre todos os ramos recursivamente
      ...this.subcategorias.flatMap(sub => sub.listarItens()),
    ]
  }
}
```

**Benefício:** Adicionar um novo nível (ex: "Regional" dentro de "Pratos Principais") não muda uma linha da lógica de listagem nem da interface.

---

### 3. Chain of Responsibility — Validação da Reserva

**Ficheiro:** `lib/reservas/validadores.ts`

**O problema:** Criar uma reserva exige verificar várias regras independentes. A ordem importa (verificações baratas primeiro), e cada regra deve poder recusar sem conhecer as outras.

**A solução:** Cada regra é um elo da cadeia. Se recusar, a cadeia para imediatamente e devolve o motivo ao cliente. Se aprovar, passa ao seguinte.

```
Pedido de reserva
       │
       ▼
┌──────────────────┐
│ ValidadorHorário │── recusa ──► "Data e hora já passaram"
│                  │             "Fora do horário (11h-22h)"
│                  │             "Cada reserva dura 2 horas"
└────────┬─────────┘
         │ aprova
         ▼
┌──────────────────┐
│ValidadorCapaci-  │── recusa ──► "Área não existe"
│    dade          │             "Só tem X lugares no total"
└────────┬─────────┘
         │ aprova
         ▼
┌──────────────────┐
│ValidadorDisponi- │── recusa ──► "Só restam X lugares nesse horário"
│   bilidade       │             "Área cheia nesse horário"
└────────┬─────────┘
         │ aprova
         ▼
    Reserva criada ✓
```

**Implementação da classe base:**
```typescript
export abstract class ValidadorReserva {
  private proximo?: ValidadorReserva

  // Liga este elo ao seguinte
  encadear(proximo: ValidadorReserva): ValidadorReserva {
    this.proximo = proximo
    return proximo
  }

  // Se recusa, pára. Se aprova, passa ao seguinte.
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

**Benefício:** Adicionar um novo validador (ex: "máximo 3 reservas por cliente") é criar uma classe e encadeá-la. Os validadores existentes não mudam.

---

## Arquitectura

### Decisão: Monólito Modular

Estudámos dois estilos arquitecturais e justificámos a nossa escolha:

| Critério | Monólito Modular ✅ (escolhido) | Microserviços ❌ (rejeitado) |
|---|---|---|
| Tamanho da equipa | Adequado para 5 pessoas | Requer equipas dedicadas por serviço |
| Domínio de negócio | Coeso (um restaurante) | Fragmentado sem necessidade real |
| Comunicação interna | Chamadas de função directas | HTTP entre serviços (latência + complexidade) |
| Deploy | Um único processo (Vercel) | Orquestração complexa (ex: Kubernetes) |
| Custo inicial | Zero (plano gratuito) | Elevado |
| Curva de aprendizagem | Adequada ao nível académico | Requer conhecimentos avançados de infra |

**Conclusão:** Para um restaurante de dimensão média, com uma equipa pequena e prazo académico, o monólito modular oferece as mesmas vantagens de organização sem a complexidade operacional dos microserviços.

### As Quatro Camadas

```
┌─────────────────────────────────────────────────────────┐
│  CAMADA 1 — APRESENTAÇÃO  (app/)                        │
│                                                         │
│  Páginas React (Server Components + Client Components)  │
│  Formulários, listas, cartões, separadores              │
│  Componentes partilhados (estilos, ícones, mensagens)   │
└──────────────────────────┬──────────────────────────────┘
                           │ chama
┌──────────────────────────▼──────────────────────────────┐
│  CAMADA 2 — APLICAÇÃO  (app/**/actions.ts)              │
│                                                         │
│  Server Actions — correm exclusivamente no servidor     │
│  Verificam sessão e perfil antes de qualquer operação   │
│  Orquestram chamadas à camada de domínio                │
└──────────────────────────┬──────────────────────────────┘
                           │ chama
┌──────────────────────────▼──────────────────────────────┐
│  CAMADA 3 — DOMÍNIO  (lib/)                             │
│                                                         │
│  Regras de negócio puras, independentes do framework    │
│  Chain of Responsibility, LSP, Composite                │
│  Sessão, passwords, datas, configuração, histórico      │
└──────────────────────────┬──────────────────────────────┘
                           │ chama
┌──────────────────────────▼──────────────────────────────┐
│  CAMADA 4 — DADOS  (Prisma + Supabase)                  │
│                                                         │
│  Prisma Client gerado a partir do schema                │
│  PostgreSQL na nuvem (Supabase, Frankfurt)              │
│  8 tabelas, relações, transacções atómicas              │
└─────────────────────────────────────────────────────────┘
```

**Regra fundamental:** Uma página nunca acede directamente à base de dados. Passa sempre por uma Server Action, que usa a biblioteca `lib/`.

---

## Estrutura de Pastas

```
sabor-brasil/
│
├── app/                            # Camada de apresentação
│   ├── page.tsx                    # Página inicial (zonas + cardápio)
│   ├── layout.tsx                  # Layout global (tema, PWA, service worker)
│   ├── manifest.ts                 # Manifesto PWA
│   ├── globals.css                 # Variáveis de cor (tema claro e escuro)
│   │
│   ├── componentes/                # Componentes visuais partilhados
│   │   ├── estilos.ts              # Classes Tailwind reutilizadas em todo o projecto
│   │   ├── Marca.tsx               # Logo + botão de tema claro/escuro
│   │   ├── Topo.tsx                # Cabeçalho das páginas (logo + voltar)
│   │   ├── Mensagem.tsx            # Mensagens de erro/sucesso com ícone
│   │   ├── SeloEstado.tsx          # Etiqueta colorida do estado da reserva
│   │   ├── IconeZona.tsx           # Ícone por área (Interior/Esplanada/Piscina)
│   │   └── AlternarTema.tsx        # Botão lua/sol para alternar tema
│   │
│   ├── entrar/                     # Login do cliente
│   │   ├── page.tsx                # Formulário de login
│   │   └── actions.ts              # Verificar credenciais + criar sessão
│   │
│   ├── registar/                   # Registo do cliente
│   │   ├── page.tsx                # Formulário de registo
│   │   └── actions.ts              # Validar + criar conta
│   │
│   ├── reservar/                   # Nova reserva
│   │   ├── page.tsx                # Formulário de reserva
│   │   ├── FormularioReserva.tsx   # Componente client com estado do formulário
│   │   └── actions.ts              # Cadeia de validação + criar reserva
│   │
│   ├── reservas/                   # Lista de reservas do cliente
│   │   ├── page.tsx                # Separadores Ativas / Histórico
│   │   ├── actions.ts              # Cancelar reserva
│   │   └── [id]/pagar/             # Pagamento de uma reserva específica
│   │       ├── page.tsx            # Página de pagamento
│   │       ├── FormularioPagamento # Componente client com estado
│   │       └── actions.ts          # Processar pagamento
│   │
│   ├── staff/                      # Área do restaurante
│   │   ├── entrar/                 # Login do staff/gestor
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── gestor/                 # Área exclusiva do gestor
│   │   │   ├── page.tsx            # Configuração, contas, zonas
│   │   │   ├── Formularios.tsx     # Formulários client do gestor
│   │   │   ├── actions.ts          # Acções do gestor
│   │   │   └── clientes/           # Lista de clientes registados
│   │   │       └── page.tsx
│   │   ├── page.tsx                # Painel principal (reservas + histórico)
│   │   ├── AtribuirMesa.tsx        # Componente de atribuição de mesa
│   │   └── actions.ts              # Atribuir, concluir, cancelar, sair
│   │
│   ├── BotaoInstalar.tsx           # Aviso PWA de instalação
│   ├── CabecalhoUtilizador.tsx     # Menu do cliente (nome, links, sair)
│   ├── Separadores.tsx             # Navegação por separadores/filtros
│   └── RegistarServiceWorker.tsx   # Registo do service worker PWA
│
├── lib/                            # Camada de domínio (regras de negócio)
│   ├── prisma.ts                   # Singleton do Prisma Client
│   ├── sessao.ts                   # Cookies assinados (cliente + staff separados)
│   ├── senha.ts                    # Hash scrypt + verificação com timingSafeEqual
│   ├── telefone.ts                 # Normalização de números de Moçambique (+258 82-87)
│   ├── configuracao.ts             # Leitura da configuração do restaurante
│   ├── datas.ts                    # Utilitários de datas no fuso Africa/Maputo
│   ├── clientes.ts                 # Consulta de clientes (só gestor)
│   │
│   ├── pagamentos/
│   │   ├── metodos.ts              # LSP: Pagamento + MPesa + eMola + Banco
│   │   └── valores.ts              # Cálculo do total e do mínimo (async, usa config)
│   │
│   └── reservas/
│       ├── validadores.ts          # Chain of Responsibility (Horário+Capacidade+Disp.)
│       ├── ciclo-de-vida.ts        # Expiração automática e regras de cancelamento
│       └── historico.ts            # Consulta do histórico (gestor=tudo, staff=30dias)
│
├── prisma/
│   ├── schema.prisma               # 8 modelos da base de dados
│   └── migrations/                 # Histórico de alterações ao schema
│
├── public/
│   ├── icons/                      # Ícones PWA (192px, 512px, maskable, apple)
│   ├── sw.js                       # Service worker (cache página offline)
│   └── offline.html                # Página mostrada sem internet
│
├── tests/                          # Testes automatizados
│   ├── telefone.test.ts            # 9 testes do validador de telemóvel
│   ├── senha.test.ts               # 5 testes de hash e verificação
│   ├── pagamentos.test.ts          # 9 testes do LSP nos pagamentos
│   └── validadores.test.ts         # 12 testes da cadeia de validação
│
├── .env                            # Variáveis privadas (não vai ao GitHub)
├── package.json                    # Dependências e scripts
├── prisma7.config.ts               # Configuração do Prisma 7
├── vercel.json                     # Região de deploy (Frankfurt = fra1)
└── vitest.config.ts                # Configuração dos testes automatizados
```

---

## Base de Dados

### Os 8 Modelos

```
Cliente                          Reserva
────────────────────             ──────────────────────────────
id          String (cuid)        id          String (cuid)
nome        String               clienteId   → Cliente
telefone    String (único)       zonaId      → Zona
senhaHash   String               mesaId      → Mesa (opcional)
dataRegisto DateTime             staffId     → Staff (opcional)
reservas[]  Reserva[]            nPessoas    Int
                                 dataHora    DateTime
                                 duracao     Int (fixo: 120 min)
                                 estado      String
                                 criadaEm    DateTime
                                 pagamento   → Pagamento (opcional)

Zona                             Mesa
────────────────────             ──────────────────────────────
id          String (cuid)        id          String (cuid)
nome        String (único)       zonaId      → Zona
mesas[]     Mesa[]               capacidade  Int
reservas[]  Reserva[]            tipo        String

Staff                            Pagamento
────────────────────             ──────────────────────────────
id          String (cuid)        id          String (cuid)
nome        String               reservaId   → Reserva (único)
telefone    String (único)       tipo        String
senhaHash   String               valorPago   Float
perfil      String               valorTotal  Float
ativo       Boolean              referencia  String
reservas[]  Reserva[]            estado      String

CategoriaCardapio                ItemCardapio
────────────────────             ──────────────────────────────
id             String (cuid)     id          String (cuid)
nome           String            categoriaId → CategoriaCardapio
categoriaPaiId → self (Composite)nome        String
subcategorias[]                  descricao   String (opcional)
itens[]                          preco       Float

Configuracao
────────────────────
id                String (fixo: "geral")
taxaPorPessoa     Float (padrão: 200 MT)
percentagemMinima Float (padrão: 30%)
```

### Diagrama de Estados da Reserva

```
Reserva criada
      │
      ▼
AGUARDA_PAGAMENTO ──── 30 min sem pagamento ────► CANCELADA
      │                                               ▲
      │ cliente paga                                  │
      ▼                                               │
 CONFIRMADA ──────── cliente/staff cancela ───────────┘
      │
      │ mesa atribuída + pagamento completo
      ▼
 CONCLUÍDA
```

---

## Fluxo Completo da Aplicação

### Ecrã 1 — Página Inicial (`/`)
**Acesso:** Público (qualquer pessoa)
**Mostra:** Logo com botão de tema, menu (Entrar / Criar conta), cartão de boas-vindas verde com botão Reservar mesa, lista das 3 áreas com mesas e lugares, cardápio organizado por categorias e subcategorias com preços em MT.
**Dados:** Lidos directamente do Supabase em tempo real, sem cache.

---

### Ecrã 2 — Criar conta (`/registar`)
**Acesso:** Público
**Mostra:** Formulário com 4 campos (nome, telemóvel, password, confirmar password).
**Validações no servidor:**
- Nome com 3+ caracteres
- Telemóvel moçambicano válido (+258, prefixo 82–87, 9 dígitos)
- Password com 6+ caracteres
- As duas passwords coincidem
- Número não está já registado
**Segurança:** A password é transformada em hash com `scrypt` + sal aleatório de 16 bytes. Nunca é guardada em texto simples.

---

### Ecrã 3 — Entrar (`/entrar`)
**Acesso:** Público
**Mostra:** Formulário com telemóvel e password.
**O que acontece:** Verifica as credenciais com `timingSafeEqual` (previne ataques de temporização). Em caso de sucesso, cria um cookie de sessão assinado com HMAC-SHA256, válido 7 dias.
**Nota:** A mensagem de erro é a mesma para "número não existe" e "password errada", para não revelar quais números têm conta.

---

### Ecrã 4 — Reservar mesa (`/reservar`)
**Acesso:** Requer sessão de cliente
**Mostra:** Área preferida (3 cartões com ícone), número de pessoas, data e hora.
**Cadeia de validação (Chain of Responsibility):**
1. **ValidadorHorário** — data futura? duração 2h? dentro de 11h–22h?
2. **ValidadorCapacidade** — área existe? pessoas ≤ lugares totais?
3. **ValidadorDisponibilidade** — lugares livres nesse horário suficientes?
Se qualquer elo recusar, o cliente vê o motivo e a cadeia para.

---

### Ecrã 5 — As minhas reservas (`/reservas`)
**Acesso:** Requer sessão de cliente
**Mostra:** Separadores Ativas e Histórico.
- Ativas: da mais próxima para a mais distante
- Histórico: concluídas e canceladas, da mais recente
- Cada reserva: área, data, pessoas, etiqueta de estado, dados de pagamento
- Botão Pagar agora (se aguarda pagamento, com prazo de expiração)
- Botão Cancelar reserva (se activa + mais de 2h antes)
**Expiração automática:** Ao abrir, o sistema cancela reservas com mais de 30 min sem pagamento.

---

### Ecrã 6 — Pagar reserva (`/reservas/[id]/pagar`)
**Acesso:** Requer sessão + reserva pertence ao cliente
**Mostra:** Resumo da reserva, escolha de modalidade e método.
**Modalidades:**
- Pagamento parcial (mínimo definido pelo gestor, ex: 30%) — garante a reserva
- Pagamento total — tudo pago online
**Métodos (LSP):**
- M-Pesa → referência `MP` + 8 dígitos
- e-Mola → referência `EM` + 8 dígitos
- Conta Bancária → referência `BK` + 10 dígitos
**Pagamento simulado** — aprovado imediatamente. Em produção real, integraria com as APIs da M-Pesa e e-Mola.

---

### Ecrã 7 — Login do staff (`/staff/entrar`)
**Acesso:** Público
**Diferença do login do cliente:** Sessão guardada num cookie separado (`sessao_staff`). Uma conta desactivada não consegue entrar mesmo com as credenciais correctas.

---

### Ecrã 8 — Painel do staff (`/staff`)
**Acesso:** Requer sessão de staff ou gestor
**Mostra:** 6 separadores de reservas activas (Hoje, Amanhã, Próximos, Anteriores, Todas, Histórico).
**Para cada reserva activa:**
- Nome e telemóvel do cliente
- Área, data, pessoas, estado
- Dados de pagamento e referência
- Selector de mesa + botão Atribuir mesa
- Botão Confirmar pagamento do restante
- Botão Concluir atendimento (só com mesa + pagamento completo)
- Botão Cancelar reserva
**Histórico:** Staff vê últimos 30 dias; Gestor vê tudo. Pesquisa por nome, telemóvel ou referência.

---

### Ecrã 9 — Área do gestor (`/staff/gestor`)
**Acesso:** Só perfil GESTOR (staff é redireccionado)
**Mostra:**
- Cartão com total de clientes → link para a lista
- Valores da reserva (taxa + percentagem mínima do pagamento parcial)
- Contas do restaurante (criar, activar, desactivar)
- Zonas e mesas (adicionar, remover)

---

### Ecrã 10 — Clientes registados (`/staff/gestor/clientes`)
**Acesso:** Só perfil GESTOR
**Mostra:** Total de clientes, novos nos últimos 7 dias, lista com nome, telemóvel, data de registo e número de reservas. Pesquisa por nome ou telemóvel.

---

## Controlo de Acesso por Perfil

| Rota | Visitante | Cliente | Staff | Gestor |
|---|---|---|---|---|
| `/` (página inicial) | ✅ | ✅ | ✅ | ✅ |
| `/entrar`, `/registar` | ✅ | ✅ | ✅ | ✅ |
| `/reservar` | → `/entrar` | ✅ | → `/entrar` | → `/entrar` |
| `/reservas` | → `/entrar` | ✅ só as suas | → `/entrar` | → `/entrar` |
| `/reservas/[id]/pagar` | → `/entrar` | ✅ só a sua | → `/entrar` | → `/entrar` |
| `/staff/entrar` | ✅ | ✅ | ✅ | ✅ |
| `/staff` (painel) | → `/staff/entrar` | → `/staff/entrar` | ✅ | ✅ |
| `/staff/gestor` | → `/staff/entrar` | → `/staff/entrar` | → `/staff` | ✅ |
| `/staff/gestor/clientes` | → `/staff/entrar` | → `/staff/entrar` | → `/staff` | ✅ |

---

## Segurança

| Mecanismo | Como está implementado |
|---|---|
| Passwords | `scrypt` com sal aleatório de 16 bytes — nunca texto simples |
| Verificação de password | `timingSafeEqual` — previne ataques de temporização |
| Sessão do cliente | Cookie `HttpOnly + SameSite=Lax`, assinado HMAC-SHA256, válido 7 dias |
| Sessão do staff | Cookie separado (`sessao_staff`), mesmo mecanismo |
| Controlo de acesso | Verificado no servidor em cada Server Action, antes de qualquer operação |
| Dados sensíveis | `.env` no `.gitignore`, variáveis de ambiente na Vercel (nunca no código) |
| Mensagens de erro | Genéricas no login (não revela se o número existe) |
| Transacções | Pagamento + actualização de estado numa transacção atómica (não fica em estado inconsistente) |

---

## PWA — Aplicação Instalável

O sistema está configurado como Progressive Web App. Pode ser instalado no telemóvel e no computador sem passar por uma loja de aplicações.

**Componentes:**
- `app/manifest.ts` — nome, cores, ícones, atalhos (Reservar mesa, As minhas reservas)
- `public/sw.js` — service worker simples: guarda só a página offline, nunca dados de reservas
- `public/offline.html` — página mostrada sem internet ("Verificar a ligação e tentar de novo")
- `public/icons/` — 4 tamanhos: 192px, 512px, maskable (Android adapta a forma), apple-touch-icon (iOS)

**Por que não usámos Workbox ou outro framework PWA?**
O nosso caso de uso é simples: só precisamos da página offline. Um framework traria complexidade desnecessária.

**Instalação:**
- **Android (Chrome/Edge):** botão nativo do browser + aviso no site
- **iOS (Safari):** botão Partilhar → Adicionar ao ecrã principal
- **Computador:** ícone na barra de endereços

**Tema claro/escuro:**
- Detecta automaticamente a preferência do sistema operativo
- Botão para alternar manualmente (guardado no localStorage)
- Aplica-se a todas as páginas e níveis de acesso

---

## Deploy

**URL de produção:** https://sabor-brasil-neon.vercel.app

| Componente | Serviço | Plano | Região |
|---|---|---|---|
| Aplicação | Vercel | Hobby (gratuito) | Frankfurt (fra1) |
| Base de dados | Supabase | Free (gratuito) | Frankfurt (eu-central-1) |
| Repositório | GitHub | Free (privado) | — |

**Porquê Frankfurt?** A base de dados (Supabase) está em Frankfurt. A aplicação (Vercel) foi configurada para a mesma região (`vercel.json`), minimizando a latência nas consultas.

**CI/CD:** Cada commit no GitHub despoleta um novo deploy automático na Vercel (1–3 minutos). Zero configuração manual.

**Build command:**
```
prisma generate --config prisma7.config.ts && next build
```
O Prisma Client é gerado no servidor da Vercel a partir do schema, antes de compilar o Next.js.

---

## Como Correr Localmente

### Pré-requisitos
- Node.js 20 ou superior
- Conta no Supabase (base de dados PostgreSQL gratuita)

### Passo a passo

**1. Descarregar o código**
```bash
# Com Git
git clone https://github.com/[utilizador]/sabor-brasil.git
cd sabor-brasil

# Ou descarregar o ZIP do GitHub e extrair
```

**2. Instalar dependências**
```bash
npm install
npm approve-scripts prisma @prisma/engines
```

**3. Variáveis de ambiente**

Criar o ficheiro `.env` na raiz (nunca partilhar este ficheiro):
```env
DATABASE_URL="postgresql://postgres.[referencia]:[password]@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
SESSION_SECRET="[64 caracteres — gerados com o comando abaixo]"
```

Gerar o SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**4. Criar as tabelas**
```bash
npx prisma db push --config prisma7.config.ts
```

**5. Gerar o cliente Prisma**
```bash
npx prisma generate --config prisma7.config.ts
```

**6. Dados iniciais (cardápio e mesas)**
```bash
npm run dev
# abrir no browser: http://localhost:3000/api/seed
# apagar a pasta app/api depois
```

**7. Conta de gestor**

Criar `app/api/criar-gestor/route.ts` temporariamente (ver documentação), abrir `http://localhost:3000/api/criar-gestor`, e apagar depois.

**8. Correr**
```bash
npm run dev
# http://localhost:3000        → cliente
# http://localhost:3000/staff  → staff/gestor
```

### Scripts disponíveis

```bash
npm run dev           # servidor de desenvolvimento com hot reload
npm run build         # compilação de produção
npm start             # servidor de produção (depois do build)
npm test              # testes automatizados (Vitest)
npm run test:coverage # cobertura de testes
```

---

## Referências Bibliográficas

- Pressman, R. S. (2010). *Engenharia de Software: Uma Abordagem Profissional* (7ª ed.). McGraw-Hill.
- Sommerville, I. (2011). *Software Engineering* (9ª ed.). Addison-Wesley.
- Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.
- Bezerra, E. (2015). *Princípios de Análise e Projecto de Sistemas com UML* (3ª ed.). Campus.
- Da Silva, A. M. R., & Videira, C. A. E. (2001). *UML, Metodologias e Ferramentas CASE*. Centro Atlântico.
- Refactoring Guru — Padrões de Design: https://refactoring.guru/design-patterns
- Documentação Next.js: https://nextjs.org/docs
- Documentação Prisma: https://www.prisma.io/docs
- Documentação Supabase: https://supabase.com/docs
- Documentação Tailwind CSS: https://tailwindcss.com/docs

---

*Desenvolvido no âmbito da disciplina de Engenharia de Software II · ISPT · Grupo 5 · Novembro 2026*
