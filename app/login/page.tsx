"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Usuario = {
  id: string;
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
  senha: string | null;
};

const funcoesPadrao = [
  "Fotografia",
  "Transmissão (OBS)",
  "Projeção (Holyrics)",
  "Social Media / Stories",
  "Áudio (Som)",
];

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Entrar
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");

  // Registrar
  const [nomeRegistro, setNomeRegistro] = useState("");
  const [senhaRegistro, setSenhaRegistro] = useState("");
  const [atribuicoesSelecionadas, setAtribuicoesSelecionadas] = useState<
    string[]
  >([]);

  const alternarFuncao = (funcao: string) => {
    setAtribuicoesSelecionadas((atual) =>
      atual.includes(funcao)
        ? atual.filter((f) => f !== funcao)
        : [...atual, funcao]
    );
  };

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setCarregando(true);

    const nomeLimpo = nome.trim().toLowerCase();

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .ilike("nome", nomeLimpo);

    if (error || !data || data.length === 0) {
      setCarregando(false);
      setErro("Nome não encontrado. Fale com o líder para se cadastrar.");
      return;
    }

    const usuario = data[0] as Usuario;

    if (usuario.senha && usuario.senha !== senha) {
      setCarregando(false);
      setErro("Senha incorreta.");
      return;
    }

    // Primeiro acesso: a senha digitada fica registrada no banco
    if (!usuario.senha) {
      const { error: erroSenha } = await supabase
        .from("usuarios")
        .update({ senha })
        .eq("id", usuario.id);

      if (erroSenha) {
        setCarregando(false);
        setErro("Não foi possível registrar a senha. Tente de novo.");
        return;
      }
    }

    localStorage.setItem(
      "usuario",
      JSON.stringify({
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        atribuicoes: usuario.atribuicoes ?? [],
      })
    );

    router.push("/inicio");
  };

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (atribuicoesSelecionadas.length === 0) {
      setErro("Selecione pelo menos uma função.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("solicitacoes").insert({
      nome: nomeRegistro.trim(),
      sobrenome: "",
      senha: senhaRegistro,
      atribuicoes: atribuicoesSelecionadas,
    });

    setCarregando(false);

    if (error) {
      console.error("Erro ao enviar solicitação ao Supabase:", error);
      setErro(`Falha ao salvar no Supabase: ${error.message}`);
      return;
    }

    setMensagem("Solicitação enviada! Aguarde a aprovação do líder.");
    setNomeRegistro("");
    setSenhaRegistro("");
    setAtribuicoesSelecionadas([]);
  };

  return (
    <div className="login-pagina">
      <div className="login-cartao">
        {modo === "entrar" ? (
          <>
            <h1 className="login-titulo">Entrar</h1>

            <p className="login-subtitulo">
              Já tem cadastro? Informe seu nome e senha para acessar.
            </p>

            <form onSubmit={entrar} className="login-formulario">
              <div>
                <label className="login-rotulo" htmlFor="nome">
                  Nome
                </label>

                <input
                  id="nome"
                  type="text"
                  required
                  placeholder="Digite seu nome"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value);
                    setErro("");
                  }}
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo" htmlFor="senha">
                  Senha
                </label>

                <input
                  id="senha"
                  type="password"
                  required
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro("");
                  }}
                  className="login-campo"
                />
              </div>

              {erro && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#a83232",
                    textAlign: "center",
                  }}
                >
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
                className="login-botao-topo"
                onClick={() => {
                  setModo("registrar");
                  setErro("");
                  setMensagem("");
                }}
              >
                Registrar
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="login-titulo">Registrar</h1>

            <p className="login-subtitulo">
              Escolha seu nome e sua senha. A solicitação vai para o líder
              aprovar.
            </p>

            <form onSubmit={registrar} className="login-formulario">
              <div>
                <label className="login-rotulo" htmlFor="nome-registro">
                  Nome
                </label>

                <input
                  id="nome-registro"
                  type="text"
                  required
                  placeholder="Digite seu nome"
                  value={nomeRegistro}
                  onChange={(e) => {
                    setNomeRegistro(e.target.value);
                    setErro("");
                  }}
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo" htmlFor="senha-registro">
                  Senha
                </label>

                <input
                  id="senha-registro"
                  type="password"
                  required
                  placeholder="Crie sua senha"
                  value={senhaRegistro}
                  onChange={(e) => {
                    setSenhaRegistro(e.target.value);
                    setErro("");
                  }}
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo">Funções</label>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {funcoesPadrao.map((funcao) => (
                    <label
                      key={funcao}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={atribuicoesSelecionadas.includes(funcao)}
                        onChange={() => alternarFuncao(funcao)}
                      />
                      {funcao}
                    </label>
                  ))}
                </div>
              </div>

              {erro && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#a83232",
                    textAlign: "center",
                  }}
                >
                  {erro}
                </p>
              )}

              {mensagem && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#2e7d32",
                    textAlign: "center",
                  }}
                >
                  {mensagem}
                </p>
              )}

              <button
                type="submit"
                className="login-botao"
                disabled={carregando}
              >
                {carregando ? "Enviando..." : "Enviar solicitação"}
              </button>

              <button
                type="button"
                className="login-botao-topo"
                onClick={() => {
                  setModo("entrar");
                  setErro("");
                  setMensagem("");
                }}
              >
                Voltar para entrar
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}