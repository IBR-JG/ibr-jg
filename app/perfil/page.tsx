"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, erroConfiguracao } from "../../lib/supabase";
import { lerUsuario, salvarUsuario, type Usuario } from "../../lib/sessao";

type Resposta = {
  ok: boolean;
  erro?: string;
  usuario?: Usuario;
};

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoSobrenome, setNovoSobrenome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const atual = lerUsuario();

    if (!atual) {
      router.replace("/login");
      return;
    }

    setUsuario(atual);
    setNovoNome(atual.nome);
    setNovoSobrenome(atual.sobrenome);
    setVerificando(false);
  }, [router]);

  const salvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");
    setAviso("");

    if (erroConfiguracao || !supabase) {
      setErro(erroConfiguracao ?? "Supabase não configurado.");
      return;
    }

    if (!usuario) {
      return;
    }

    if (!senhaAtual) {
      setErro("Informe sua senha atual para confirmar a alteração.");
      return;
    }

    if (!novoNome.trim()) {
      setErro("O nome não pode ficar vazio.");
      return;
    }

    if (novaSenha && novaSenha !== confirmacao) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }

    setSalvando(true);

    try {
      const { data, error } = await supabase.rpc("atualizar_perfil", {
        p_nome_atual: usuario.nome,
        p_senha_atual: senhaAtual,
        p_novo_nome: novoNome.trim(),
        p_novo_sobrenome: novoSobrenome.trim(),
        p_nova_senha: novaSenha,
      });

      if (error) {
        console.error("Erro ao salvar perfil:", error);
        setErro(`Falha ao salvar: ${error.message}`);
        return;
      }

      const resposta = data as Resposta;

      if (!resposta?.ok || !resposta.usuario) {
        setErro(resposta?.erro ?? "Não foi possível salvar o perfil.");
        return;
      }

      salvarUsuario(resposta.usuario);
      setUsuario(resposta.usuario);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setAviso("Perfil atualizado.");
    } catch (err) {
      console.error("Erro inesperado ao salvar perfil:", err);
      setErro("Erro inesperado ao salvar o perfil.");
    } finally {
      setSalvando(false);
    }
  };

  if (verificando) {
    return (
      <div className="login-pagina">
        <div className="login-cartao">
          <p className="login-subtitulo">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="login-pagina">
      <div className="login-cartao">
        <h1 className="login-titulo">Meu perfil</h1>

        <p className="login-subtitulo">
          Altere seu nome, sobrenome ou senha. Para confirmar, informe sua senha
          atual.
        </p>

        <form onSubmit={salvar} className="login-formulario">
          <div>
            <label className="login-rotulo" htmlFor="perfil-nome">
              Nome
            </label>

            <input
              id="perfil-nome"
              type="text"
              required
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="login-campo"
            />
          </div>

          <div>
            <label className="login-rotulo" htmlFor="perfil-sobrenome">
              Sobrenome
            </label>

            <input
              id="perfil-sobrenome"
              type="text"
              value={novoSobrenome}
              onChange={(e) => setNovoSobrenome(e.target.value)}
              className="login-campo"
            />
          </div>

          <div>
            <label className="login-rotulo" htmlFor="perfil-senha-atual">
              Senha atual
            </label>

            <input
              id="perfil-senha-atual"
              type="password"
              required
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Confirme sua senha atual"
              className="login-campo"
            />
          </div>

          <div>
            <label className="login-rotulo" htmlFor="perfil-nova-senha">
              Nova senha (opcional)
            </label>

            <input
              id="perfil-nova-senha"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="login-campo"
            />
          </div>

          <div>
            <label className="login-rotulo" htmlFor="perfil-confirmacao">
              Confirmar nova senha
            </label>

            <input
              id="perfil-confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="Repita a nova senha"
              className="login-campo"
            />
          </div>

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          {aviso && (
            <p className="login-subtitulo" role="status">
              {aviso}
            </p>
          )}

          <button type="submit" className="login-botao" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>

          <Link href="/inicio" className="login-botao-secundario">
            Voltar
          </Link>
        </form>
      </div>
    </div>
  );
}