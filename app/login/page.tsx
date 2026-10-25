"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Usuario = {
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
};

const funcoesPadrao = [
  "Fotografia",
  "Transmissão (OBS)",
  "Projeção (Holyrics)",
  "Social Media / Stories",
  "Áudio (Som)",
];

const normalizarNome = (valor: string) =>
  (valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [senha, setSenha] = useState("");
  const [atribuicoes, setAtribuicoes] = useState<string[]>([]);
  const [funcoes, setFuncoes] = useState<string[]>(funcoesPadrao);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Inclui também as funções extras cadastradas pelo admin, se existirem
  useEffect(() => {
    try {
      const salvas = JSON.parse(
        localStorage.getItem("funcoes") || "[]"
      ) as string[];

      if (Array.isArray(salvas) && salvas.length > 0) {
        setFuncoes(Array.from(new Set([...funcoesPadrao, ...salvas])));
      }
    } catch {
      // valor corrompido: segue com as padrão
    }
  }, []);

  const alternarFuncao = (funcao: string) => {
    setAtribuicoes((atuais) =>
      atuais.includes(funcao)
        ? atuais.filter((f) => f !== funcao)
        : [...atuais, funcao]
    );
  };

  const trocarModo = () => {
    setModo(modo === "entrar" ? "registrar" : "entrar");
    setErro("");
    setNome("");
    setSobrenome("");
    setSenha("");
    setAtribuicoes([]);
  };

  const entrar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { data, error } = await supabase
      .from("usuarios")
      .select("nome, sobrenome, atribuicoes, senha");

    setCarregando(false);

    if (error) {
      console.error("Erro no login:", error);
      setErro(`Falha ao consultar o banco: ${error.message}`);
      return;
    }

    const encontrado = (data ?? []).find(
      (u) =>
        normalizarNome(u.nome) === normalizarNome(nome) &&
        (u.senha ?? "") === senha
    );

    if (!encontrado) {
      setErro("Nome ou senha incorretos.");
      return;
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify({
        nome: encontrado.nome,
        sobrenome: encontrado.sobrenome ?? "",
        atribuicoes: encontrado.atribuicoes ?? [],
      })
    );

    router.push("/inicio");
  };

  const registrar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !senha) {
      setErro("Preencha nome e senha.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("solicitacoes").insert({
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      atribuicoes,
      senha,
    });

    setCarregando(false);

    if (error) {
      console.error("Erro ao registrar:", error);
      setErro(`Falha ao enviar o cadastro: ${error.message}`);
      return;
    }

    alert("Cadastro enviado! Aguarde a aprovação do líder.");
    trocarModo();
  };

  return (
    <div className="login-pagina">
      <div className="login-cartao">
        <h1 className="login-titulo">
          {modo === "entrar" ? "Entrar" : "Registrar"}
        </h1>

        <p className="login-subtitulo">
          {modo === "entrar"
            ? "Já tem cadastro? Informe seu nome e senha para acessar."
            : "Envie seu cadastro e aguarde a aprovação do líder."}
        </p>

        {modo === "entrar" ? (
          <form onSubmit={entrar} className="login-formulario">
            <div>
              <label className="login-rotulo" htmlFor="login-nome">
                Nome
              </label>

              <input
                id="login-nome"
                type="text"
                required
                autoComplete="username"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="login-campo"
              />
            </div>

            <div>
              <label className="login-rotulo" htmlFor="login-senha">
                Senha
              </label>

              <input
                id="login-senha"
                type="password"
                required
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="login-campo"
              />
            </div>

            {erro && (
              <p className="login-erro" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="login-botao"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              className="login-botao-secundario"
              onClick={trocarModo}
            >
              Registrar
            </button>
          </form>
        ) : (
          <form onSubmit={registrar} className="login-formulario">
            <div>
              <label className="login-rotulo" htmlFor="registro-nome">
                Nome
              </label>

              <input
                id="registro-nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className="login-campo"
              />
            </div>

            <div>
              <label className="login-rotulo" htmlFor="registro-sobrenome">
                Sobrenome
              </label>

              <input
                id="registro-sobrenome"
                type="text"
                value={sobrenome}
                onChange={(e) => setSobrenome(e.target.value)}
                placeholder="Digite seu sobrenome"
                className="login-campo"
              />
            </div>

            <div>
              <label className="login-rotulo" htmlFor="registro-senha">
                Senha
              </label>

              <input
                id="registro-senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie uma senha"
                className="login-campo"
              />
            </div>

            <div>
              <label className="login-rotulo">Funções:</label>

              <div className="login-lista-funcoes">
                {funcoes.map((funcao) => (
                  <label key={funcao} className="login-opcao">
                    <input
                      type="checkbox"
                      className="login-checkbox"
                      checked={atribuicoes.includes(funcao)}
                      onChange={() => alternarFuncao(funcao)}
                    />

                    {funcao}
                  </label>
                ))}
              </div>
            </div>

            {erro && (
              <p className="login-erro" role="alert">
                {erro}
              </p>
            )}

            <button
              type="submit"
              className="login-botao"
              disabled={carregando}
            >
              {carregando ? "Enviando..." : "Enviar cadastro"}
            </button>

            <button
              type="button"
              className="login-botao-secundario"
              onClick={trocarModo}
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}