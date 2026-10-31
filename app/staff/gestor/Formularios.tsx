"use client";

import { useActionState } from "react";
import { guardarConfiguracao, criarStaff, adicionarMesa } from "./actions";
import Mensagem from "../../componentes/Mensagem";
import { botaoPrimario, campo, rotulo } from "../../componentes/estilos";

const ESTADO_INICIAL = { mensagem: "", sucesso: false };

function Resposta({
  estado,
}: {
  estado: { mensagem: string; sucesso: boolean };
}) {
  if (!estado.mensagem) return null;
  return (
    <Mensagem tipo={estado.sucesso ? "sucesso" : "erro"}>
      {estado.mensagem}
    </Mensagem>
  );
}

export function FormularioConfiguracao({
  taxaPorPessoa,
  percentagemMinima,
}: {
  taxaPorPessoa: number;
  percentagemMinima: number;
}) {
  const [estado, formAction, pendente] = useActionState(
    guardarConfiguracao,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="taxaPorPessoa" className={rotulo}>
            Taxa de reserva por pessoa (MT)
          </label>
          <input
            id="taxaPorPessoa"
            name="taxaPorPessoa"
            type="number"
            min={1}
            step="any"
            defaultValue={taxaPorPessoa}
            required
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="percentagemMinima" className={rotulo}>
            Pagamento parcial mínimo (% do total)
          </label>
          <input
            id="percentagemMinima"
            name="percentagemMinima"
            type="number"
            min={1}
            max={100}
            step="any"
            defaultValue={percentagemMinima}
            required
            className={campo}
          />
        </div>
      </div>
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "A guardar..." : "Guardar valores"}
      </button>
      <Resposta estado={estado} />
    </form>
  );
}

export function FormularioNovoStaff() {
  const [estado, formAction, pendente] = useActionState(
    criarStaff,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className={rotulo}>
            Nome completo
          </label>
          <input id="nome" name="nome" required className={campo} />
        </div>
        <div>
          <label htmlFor="telefone" className={rotulo}>
            Número de telemóvel
          </label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            placeholder="84 123 4567"
            required
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="senha" className={rotulo}>
            Palavra-passe (mínimo 6 caracteres)
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            required
            className={campo}
          />
        </div>
        <div>
          <label htmlFor="perfil" className={rotulo}>
            Perfil
          </label>
          <select id="perfil" name="perfil" className={campo}>
            <option value="STAFF">Staff (operação do dia)</option>
            <option value="GESTOR">Gestor (acesso total)</option>
          </select>
        </div>
      </div>
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "A criar..." : "Criar conta"}
      </button>
      <Resposta estado={estado} />
    </form>
  );
}

export function FormularioNovaMesa({
  zonas,
}: {
  zonas: { id: string; nome: string }[];
}) {
  const [estado, formAction, pendente] = useActionState(
    adicionarMesa,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="zonaId" className={rotulo}>
            Área
          </label>
          <select id="zonaId" name="zonaId" className={campo}>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="capacidade" className={rotulo}>
            Lugares
          </label>
          <input
            id="capacidade"
            name="capacidade"
            type="number"
            min={1}
            max={20}
            defaultValue={4}
            required
            className={campo}
          />
        </div>
      </div>
      <button type="submit" disabled={pendente} className={botaoPrimario}>
        {pendente ? "A adicionar..." : "Adicionar mesa"}
      </button>
      <Resposta estado={estado} />
    </form>
  );
}
