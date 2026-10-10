"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Usuario = {
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
};

export default function EntrarPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lista: Usuario[] = JSON.parse(
      localStorage.getItem("usuarios") || "[]"
    );
    const normalizar = (t: string) => t.trim().toLowerCase();

    const encontrado = lista.find(
      (u) =>
        normalizar(u.nome) === normalizar(nome) &&
        normalizar(u.sobrenome) === normalizar(sobrenome)
    );

    if (!encontrado) {
      const pendentes: Usuario[] = JSON.parse(
        localStorage.getItem("solicitacoes") || "[]"
      );
      const aguardando = pendentes.some(
        (u) =>
          normalizar(u.nome) === normalizar(nome) &&
          normalizar(u.sobrenome) === normalizar(sobrenome)
      );
      setErro(
        aguardando
          ? "Seu cadastro ainda está aguardando a aprovação do líder."
          : "Cadastro não encontrado. Confira o nome ou crie sua conta."
      );
      return;
    }

    localStorage.setItem("usuario", JSON.stringify(encontrado));
    router.push("/inicio");
  };

  return (
    <div className="login-pagina">
      <div className="login-topo">
        <Link href="/login" className="login-botao-topo">
          Criar conta
        </Link>
      </div>

      <div className="login-cartao">
        <h2 className="login-titulo">Entrar</h2>
        <p className="login-subtitulo">
          Já tem cadastro? Informe seu nome para acessar.
        </p>

        <form onSubmit={handleSubmit} className="login-formulario">
          <div>
            <label className="login-rotulo">Nome</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              className="login-campo"
            />
          </div>

          <div>
            <label className="login-rotulo">Sobrenome</label>
            <input
              type="text"
              required
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              placeholder="Digite seu sobrenome"
              className="login-campo"
            />
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" className="login-botao">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}