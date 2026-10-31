import { CheckCircleFill, ExclamationCircleFill } from "react-bootstrap-icons";

export default function Mensagem({
  tipo = "erro",
  children,
}: {
  tipo?: "erro" | "sucesso";
  children: React.ReactNode;
}) {
  const sucesso = tipo === "sucesso";

  return (
    <p
      role={sucesso ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        sucesso
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {sucesso ? (
        <CheckCircleFill size={16} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <ExclamationCircleFill
          size={16}
          className="mt-0.5 shrink-0"
          aria-hidden
        />
      )}
      <span>{children}</span>
    </p>
  );
}
