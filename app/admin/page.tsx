"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Usuario = {
  id: string;
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
};

type Restricao = {
  nome: string;
  sobrenome: string;
  data: string;
  motivo: string;
  periodo?: "manha" | "tarde";
};

type ItemEscala = {
  funcao: string;
  manha: string | null;
  tarde: string | null;
};

type DiaEscala = {
  data: string;
  itens: ItemEscala[];
};

type Solicitacao = {
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

const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
};

const nomeDiaSemana = (iso: string) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "long",
  });
};

const proximoMes = () => {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function AdminPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [erroSolicitacoes, setErroSolicitacoes] = useState("");
  const [erroMembros, setErroMembros] = useState("");
  const [funcoes, setFuncoes] = useState<string[]>(funcoesPadrao);
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [escala, setEscala] = useState<DiaEscala[]>([]);
  const [pronto, setPronto] = useState(false);
  const [mostrarMembros, setMostrarMembros] = useState(false);
  const [mostrarFuncoes, setMostrarFuncoes] = useState(false);
  const [mostrarEscala, setMostrarEscala] = useState(false);
  const [mostrarAvisos, setMostrarAvisos] = useState(false);

  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  // Modal: novo / editar membro
  const [modalAberto, setModalAberto] = useState(false);
  const [membroEditando, setMembroEditando] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [atribuicoes, setAtribuicoes] = useState<string[]>([]);

  // Modal: nova função
  const [modalFuncaoAberto, setModalFuncaoAberto] = useState(false);
  const [novaFuncao, setNovaFuncao] = useState("");
  const [membrosEscolhidos, setMembrosEscolhidos] = useState<number[]>([]);
  const [erroFuncao, setErroFuncao] = useState("");

  // Modal: gerar escala
  const [modalEscalaAberto, setModalEscalaAberto] = useState(false);
  const [mesEscala, setMesEscala] = useState("");
  const [erroEscala, setErroEscala] = useState("");

  // Mini formulário: nova restrição
  const [modalRestricaoAberto, setModalRestricaoAberto] = useState(false);
  const [membroRestricao, setMembroRestricao] = useState("");
  const [dataRestricao, setDataRestricao] = useState("");
  const [periodoRestricao, setPeriodoRestricao] = useState<"manha" | "tarde">(
    "manha"
  );
  const [erroRestricao, setErroRestricao] = useState("");
  const [restricaoEditando, setRestricaoEditando] = useState<number | null>(
    null
  );
  const [dataEdicaoRestricao, setDataEdicaoRestricao] = useState("");
  const [periodoEdicaoRestricao, setPeriodoEdicaoRestricao] = useState<
    "manha" | "tarde" | ""
  >("");
  const [erroEdicaoRestricao, setErroEdicaoRestricao] = useState("");

  const carregarSolicitacoes = async () => {
    const { data, error } = await supabase
      .from("solicitacoes")
      .select("id, nome, sobrenome, atribuicoes, senha")
      .order("criado_em", { ascending: true });

    if (error) {
      console.error("Erro ao carregar solicitações:", error.message);
      setErroSolicitacoes(
        `Não foi possível carregar solicitações: ${error.message}`
      );
      return;
    }

    setErroSolicitacoes("");
    setSolicitacoes((data ?? []) as Solicitacao[]);
  };

  const carregarUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, sobrenome, atribuicoes")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar membros:", error.message);
      setErroMembros(`Não foi possível carregar os membros: ${error.message}`);
      return;
    }

    setErroMembros("");
    setUsuarios(
      (data ?? []).map((u) => ({
        id: u.id,
        nome: u.nome ?? "",
        sobrenome: u.sobrenome ?? "",
        atribuicoes: u.atribuicoes ?? [],
      }))
    );
  };

  useEffect(() => {
    const salvo = localStorage.getItem("usuario");
    if (!salvo) {
      router.replace("/login");
      return;
    }

    const atual = JSON.parse(salvo);
    const lider = (atual.atribuicoes || []).some(
      (a: string) => a.trim().toLowerCase() === "líder"
    );

    if (!lider) {
      router.replace("/inicio");
      return;
    }

    setRestricoes(JSON.parse(localStorage.getItem("restricoes") || "[]"));
    setEscala(JSON.parse(localStorage.getItem("escala") || "[]"));

    const funcoesSalvas = localStorage.getItem("funcoes");
    if (funcoesSalvas) setFuncoes(JSON.parse(funcoesSalvas));

    void carregarUsuarios();
    void carregarSolicitacoes();

    setPronto(true);
  }, [router]);

  const salvarFuncoes = (lista: string[]) => {
    setFuncoes(lista);
    localStorage.setItem("funcoes", JSON.stringify(lista));
  };

  const salvarUsuarios = (lista: Usuario[]) => {
    setUsuarios(lista);
    localStorage.setItem("usuarios", JSON.stringify(lista));
  };

  const salvarEscala = (lista: DiaEscala[]) => {
    setEscala(lista);
    localStorage.setItem("escala", JSON.stringify(lista));
  };

  const salvarRestricoes = (lista: Restricao[]) => {
    localStorage.setItem("restricoes", JSON.stringify(lista));
    setRestricoes(lista);
  };

  const sincronizarAtribuicoes = async (lista: Usuario[]) => {
    for (const membro of lista) {
      const { error } = await supabase
        .from("usuarios")
        .update({ atribuicoes: membro.atribuicoes })
        .eq("id", membro.id);

      if (error) {
        alert(
          `Não foi possível atualizar as funções de ${membro.nome} no Supabase: ${error.message}`
        );
        return;
      }
    }
  };

  const aprovarSolicitacao = async (id: string) => {
    const solicitacao = solicitacoes.find((item) => item.id === id);
    if (!solicitacao) return;

    const { error: erroCadastro } = await supabase.from("usuarios").insert({
      nome: solicitacao.nome,
      sobrenome: solicitacao.sobrenome ?? "",
      atribuicoes: solicitacao.atribuicoes ?? [],
      senha: solicitacao.senha,
    });

    if (erroCadastro) {
      alert(`Não foi possível aprovar o cadastro: ${erroCadastro.message}`);
      return;
    }

    const { error: erroRemocao } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", id);

    if (erroRemocao) {
      alert(
        `O membro foi salvo em usuarios, mas não foi possível remover a solicitação: ${erroRemocao.message}`
      );
      await carregarSolicitacoes();
      return;
    }

    await carregarUsuarios();
    await carregarSolicitacoes();
  };

  const recusarSolicitacao = async (id: string) => {
    const solicitacao = solicitacoes.find((item) => item.id === id);
    if (!solicitacao) return;

    if (
      !confirm(
        `Recusar a solicitação de ${solicitacao.nome} ${solicitacao.sobrenome}?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", id);

    if (error) {
      alert(`Não foi possível recusar a solicitação: ${error.message}`);
      return;
    }

    await carregarSolicitacoes();
  };

  const iniciarEdicao = (funcao: string) => {
    setEditando(funcao);
    setTextoEdicao(funcao);
  };

  const confirmarEdicao = async (antiga: string) => {
    const nova = textoEdicao.trim();
    if (!nova || (nova !== antiga && funcoes.includes(nova))) return;

    const afetados = usuarios
      .filter((u) => u.atribuicoes.includes(antiga))
      .map((u) => ({
        ...u,
        atribuicoes: u.atribuicoes.map((a) => (a === antiga ? nova : a)),
      }));

    salvarFuncoes(funcoes.map((f) => (f === antiga ? nova : f)));
    salvarUsuarios(
      usuarios.map((u) => ({
        ...u,
        atribuicoes: u.atribuicoes.map((a) => (a === antiga ? nova : a)),
      }))
    );

    await sincronizarAtribuicoes(afetados);

    setEditando(null);
  };

  const apagarFuncao = async (funcao: string) => {
    if (!confirm(`Apagar a função "${funcao}"?`)) return;

    const afetados = usuarios
      .filter((u) => u.atribuicoes.includes(funcao))
      .map((u) => ({
        ...u,
        atribuicoes: u.atribuicoes.filter((a) => a !== funcao),
      }));

    salvarFuncoes(funcoes.filter((f) => f !== funcao));
    salvarUsuarios(
      usuarios.map((u) => ({
        ...u,
        atribuicoes: u.atribuicoes.filter((a) => a !== funcao),
      }))
    );

    await sincronizarAtribuicoes(afetados);
  };

  // ----- Membros -----
  const alternarFuncao = (funcao: string) => {
    setAtribuicoes((atual) =>
      atual.includes(funcao)
        ? atual.filter((item) => item !== funcao)
        : [...atual, funcao]
    );
  };

  const fecharModal = () => {
    setModalAberto(false);
    setMembroEditando(null);
    setNome("");
    setSobrenome("");
    setAtribuicoes([]);
  };

  const adicionarMembro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (membroEditando !== null) {
      const original = usuarios[membroEditando];
      if (!original) return;

      const { error } = await supabase
        .from("usuarios")
        .update({ nome, sobrenome, atribuicoes })
        .eq("id", original.id);

      if (error) {
        alert(`Não foi possível salvar as alterações: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase
        .from("usuarios")
        .insert({ nome, sobrenome, atribuicoes });

      if (error) {
        alert(`Não foi possível cadastrar o membro: ${error.message}`);
        return;
      }
    }

    await carregarUsuarios();

    setMostrarMembros(true);
    fecharModal();
  };

  const abrirEdicaoMembro = (indice: number) => {
    const u = usuarios[indice];
    setNome(u.nome);
    setSobrenome(u.sobrenome);
    setAtribuicoes(u.atribuicoes);
    setMembroEditando(indice);
    setModalAberto(true);
  };

  const apagarMembro = async (indice: number) => {
    const membro = usuarios[indice];
    if (!membro) return;

    if (!confirm(`Apagar o membro ${membro.nome} ${membro.sobrenome ?? ""}?`)) {
      return;
    }

    const { data: apagados, error: erroApagar } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", membro.id)
      .select("id");

    if (erroApagar) {
      alert(`Erro ao apagar no Supabase: ${erroApagar.message}`);
      return;
    }

    if (!apagados || apagados.length === 0) {
      alert(
        "O Supabase não confirmou a exclusão. Verifique as políticas de exclusão (RLS) da tabela usuarios."
      );
      return;
    }

    salvarUsuarios(usuarios.filter((_, i) => i !== indice));
  };

  // ----- Nova função -----
  const alternarMembroEscolhido = (indice: number) => {
    setMembrosEscolhidos((atual) =>
      atual.includes(indice)
        ? atual.filter((i) => i !== indice)
        : [...atual, indice]
    );
  };

  const fecharModalFuncao = () => {
    setModalFuncaoAberto(false);
    setNovaFuncao("");
    setMembrosEscolhidos([]);
    setErroFuncao("");
  };

  const adicionarFuncao = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeFuncao = novaFuncao.trim();

    if (!nomeFuncao) {
      setErroFuncao("Digite o nome da função.");
      return;
    }

    if (funcoes.some((f) => f.toLowerCase() === nomeFuncao.toLowerCase())) {
      setErroFuncao("Essa função já existe.");
      return;
    }

    const listaAtualizada = usuarios.map((u, i) =>
      membrosEscolhidos.includes(i)
        ? { ...u, atribuicoes: [...u.atribuicoes, nomeFuncao] }
        : u
    );

    salvarFuncoes([...funcoes, nomeFuncao]);
    salvarUsuarios(listaAtualizada);

    await sincronizarAtribuicoes(
      listaAtualizada.filter((_, i) => membrosEscolhidos.includes(i))
    );

    fecharModalFuncao();
  };

  const cancelarEdicaoRestricao = () => {
    setRestricaoEditando(null);
    setErroEdicaoRestricao("");
  };

  const iniciarEdicaoRestricao = (indice: number) => {
    const r = restricoes[indice];
    setRestricaoEditando(indice);
    setDataEdicaoRestricao(r.data);
    setPeriodoEdicaoRestricao(r.periodo ?? "");
    setErroEdicaoRestricao("");
  };

  const salvarEdicaoRestricao = () => {
    if (restricaoEditando === null) return;

    if (!dataEdicaoRestricao) {
      setErroEdicaoRestricao("Escolha a data da restrição.");
      return;
    }

    const original = restricoes[restricaoEditando];
    if (!original) return;

    const periodo = periodoEdicaoRestricao || undefined;
    const jaExiste = restricoes.some(
      (r, i) =>
        i !== restricaoEditando &&
        r.nome === original.nome &&
        r.sobrenome === original.sobrenome &&
        r.data === dataEdicaoRestricao &&
        (!r.periodo || !periodo || r.periodo === periodo)
    );

    if (jaExiste) {
      setErroEdicaoRestricao(
        "Esse membro já possui uma restrição nessa data e período."
      );
      return;
    }

    try {
      salvarRestricoes(
        restricoes.map((r, i) =>
          i === restricaoEditando
            ? { ...r, data: dataEdicaoRestricao, periodo }
            : r
        )
      );
      cancelarEdicaoRestricao();
    } catch {
      setErroEdicaoRestricao(
        "Não foi possível salvar a alteração no navegador."
      );
    }
  };

  const apagarRestricao = (indice: number) => {
    const r = restricoes[indice];

    if (
      !confirm(
        `Apagar a restrição de ${r.nome} ${r.sobrenome} em ${formatarData(r.data)}?`
      )
    ) {
      return;
    }

    try {
      salvarRestricoes(restricoes.filter((_, i) => i !== indice));
      cancelarEdicaoRestricao();
    } catch {
      alert("Não foi possível apagar a restrição no navegador.");
    }
  };

  // ----- Nova restrição -----
  const abrirModalRestricao = () => {
    setMembroRestricao("");
    setDataRestricao("");
    setPeriodoRestricao("manha");
    setErroRestricao("");
    setModalRestricaoAberto(true);
  };

  const fecharModalRestricao = () => {
    setModalRestricaoAberto(false);
    setMembroRestricao("");
    setDataRestricao("");
    setPeriodoRestricao("manha");
    setErroRestricao("");
  };

  const adicionarRestricao = (e: React.FormEvent) => {
    e.preventDefault();

    if (membroRestricao === "") {
      setErroRestricao("Selecione o membro.");
      return;
    }

    const membro = usuarios[Number(membroRestricao)];

    if (!membro) {
      setErroRestricao("O membro selecionado não foi encontrado.");
      return;
    }

    if (!dataRestricao) {
      setErroRestricao("Escolha a data da restrição.");
      return;
    }

    const jaExiste = restricoes.some(
      (r) =>
        r.nome === membro.nome &&
        r.sobrenome === membro.sobrenome &&
        r.data === dataRestricao &&
        (!r.periodo || r.periodo === periodoRestricao)
    );

    if (jaExiste) {
      setErroRestricao(
        "Esse membro já possui uma restrição nessa data e período."
      );
      return;
    }

    const novaRestricao: Restricao = {
      nome: membro.nome,
      sobrenome: membro.sobrenome,
      data: dataRestricao,
      motivo: "",
      periodo: periodoRestricao,
    };

    try {
      salvarRestricoes([...restricoes, novaRestricao]);
    } catch {
      setErroRestricao(
        "Não foi possível salvar a restrição no navegador. Tente novamente."
      );
      return;
    }

    fecharModalRestricao();
  };

  // ----- Escala automática -----
  const abrirModalEscala = () => {
    setMesEscala(proximoMes());
    setErroEscala("");
    setModalEscalaAberto(true);
  };

  const fecharModalEscala = () => {
    setModalEscalaAberto(false);
    setErroEscala("");
  };

  const gerarEscala = (e: React.FormEvent) => {
    e.preventDefault();

    if (!mesEscala) {
      setErroEscala("Escolha o mês.");
      return;
    }

    if (usuarios.length === 0) {
      setErroEscala("Cadastre membros antes de gerar a escala.");
      return;
    }

    // "Líder" é só permissão de acesso, não entra na escala
    const funcoesEscala = funcoes.filter(
      (f) => f.trim().toLowerCase() !== "líder"
    );

    const [ano, mes] = mesEscala.split("-").map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();

    // Só domingos (0)
    const datas: string[] = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const diaSemana = new Date(ano, mes - 1, dia).getDay();
      if (diaSemana === 0) {
        datas.push(
          `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
        );
      }
    }

    const temRestricao = (
      u: Usuario,
      data: string,
      turno: "manha" | "tarde"
    ) =>
      restricoes.some(
        (r) =>
          r.nome === u.nome &&
          r.sobrenome === u.sobrenome &&
          r.data === data &&
          // Restrições antigas sem período bloqueiam o dia inteiro.
          (!r.periodo || r.periodo === turno)
      );

    // Quantas vezes cada pessoa já foi escalada (para dividir igualmente)
    const contagem: Record<string, number> = {};
    usuarios.forEach((u) => {
      contagem[`${u.nome} ${u.sobrenome}`] = 0;
    });

    const novosDias: DiaEscala[] = datas.map((data) => {
      // Controla quem já foi escalado em cada turno desse dia
      const ocupados = { manha: new Set<string>(), tarde: new Set<string>() };

      const itens: ItemEscala[] = funcoesEscala.map((funcao) => {
        const escolher = (turno: "manha" | "tarde"): string | null => {
          const disponiveis = usuarios.filter(
            (u) =>
              u.atribuicoes.includes(funcao) &&
              !temRestricao(u, data, turno)
          );

          // Não repete uma pessoa em duas funções no mesmo turno.
          const candidatos = disponiveis.filter(
            (u) => !ocupados[turno].has(`${u.nome} ${u.sobrenome}`)
          );

          if (candidatos.length === 0) return null;

          // Escolhe quem foi escalado menos vezes
          const escolhido = candidatos.reduce((menor, atual) =>
            contagem[`${atual.nome} ${atual.sobrenome}`] <
            contagem[`${menor.nome} ${menor.sobrenome}`]
              ? atual
              : menor
          );

          const chave = `${escolhido.nome} ${escolhido.sobrenome}`;
          contagem[chave] += 1;
          ocupados[turno].add(chave);
          return chave;
        };

        // Manhã: só Som e Holyrics
        const temManha = ["Projeção (Holyrics)", "Áudio (Som)"].includes(funcao);

        return {
          funcao,
          manha: temManha ? escolher("manha") : null,
          tarde: escolher("tarde"),
        };
      });

      return { data, itens };
    });

    // Substitui só o mês escolhido e mantém os outros meses
    const outrosMeses = escala.filter((d) => !d.data.startsWith(mesEscala));
    const nova = [...outrosMeses, ...novosDias].sort((a, b) =>
      a.data.localeCompare(b.data)
    );

    salvarEscala(nova);
    setMostrarEscala(true);
    fecharModalEscala();
  };

  const apagarEscala = () => {
    if (!confirm("Apagar toda a escala salva?")) return;
    salvarEscala([]);
  };

  const publicarEscala = () => {
    if (escala.length === 0) {
      alert("Nenhuma escala para publicar. Gere a escala primeiro.");
      return;
    }

    try {
      localStorage.setItem("escalaPublicada", JSON.stringify(escala));
      alert("Escala publicada com sucesso!");
    } catch {
      alert("Não foi possível publicar a escala no navegador.");
    }
  };

  if (!pronto) return null;

  return (
    <div className="admin-pagina">
      <header className="admin-cabecalho">
        <strong>Painel Admin</strong>
        <nav className="admin-menu">
          <button
            type="button"
            className={`admin-botao-menu ${
              mostrarMembros ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarMembros((v) => !v)}
          >
            Membros
          </button>

          <button
            type="button"
            className={`admin-botao-menu ${
              mostrarFuncoes ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarFuncoes((v) => !v)}
          >
            Funções
          </button>

          <button
            type="button"
            className={`admin-botao-menu ${
              mostrarEscala ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => {
              setMostrarEscala((v) => !v);
              setModalRestricaoAberto(false);
            }}
          >
            Escala
          </button>

          <button
            type="button"
            className={`admin-botao-menu ${
              mostrarAvisos ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarAvisos((v) => !v)}
          >
            Avisos
          </button>

          <Link href="/inicio" className="admin-botao-voltar">
            Voltar
          </Link>
        </nav>
      </header>

      <main className="admin-conteudo">
        <h1 className="admin-titulo">Administração</h1>
        <p className="admin-subtitulo">Gerencie o time de comunicação.</p>

        {mostrarMembros && (
          <section className="admin-cartao">
            {erroMembros && (
              <p className="login-erro" role="alert">
                {erroMembros}
              </p>
            )}

            {usuarios.length === 0 ? (
              <p>Nenhum membro cadastrado.</p>
            ) : (
              <table className="admin-tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Funções</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id}>
                      <td>
                        {u.nome} {u.sobrenome}
                      </td>
                      <td>{u.atribuicoes.join(", ") || "-"}</td>
                      <td>
                        <div className="admin-acoes">
                          <button
                            type="button"
                            className="admin-botao-editar"
                            onClick={() => abrirEdicaoMembro(i)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="admin-botao-apagar"
                            onClick={() => apagarMembro(i)}
                          >
                            Apagar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {mostrarFuncoes && (
          <section className="admin-cartao admin-cartao-espaco">
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Função</th>
                  <th>Membros</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcoes.map((funcao) => (
                  <tr key={funcao}>
                    <td>
                      {editando === funcao ? (
                        <input
                          type="text"
                          className="login-campo"
                          value={textoEdicao}
                          onChange={(e) => setTextoEdicao(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        funcao
                      )}
                    </td>
                    <td>
                      {
                        usuarios.filter((u) => u.atribuicoes.includes(funcao))
                          .length
                      }
                    </td>
                    <td>
                      <div className="admin-acoes">
                        {editando === funcao ? (
                          <>
                            <button
                              type="button"
                              className="admin-botao-editar"
                              onClick={() => confirmarEdicao(funcao)}
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              className="admin-botao-apagar"
                              onClick={() => setEditando(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-botao-editar"
                              onClick={() => iniciarEdicao(funcao)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="admin-botao-apagar"
                              onClick={() => apagarFuncao(funcao)}
                            >
                              Apagar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {mostrarEscala && (
          <section className="admin-cartao admin-cartao-espaco">
            {escala.length === 0 ? (
              <p>Nenhuma escala cadastrada ainda. Use o botão + para gerar.</p>
            ) : (
              <>
                {escala.map((dia) => (
                  <div key={dia.data} className="admin-escala-dia">
                    <h3 className="admin-escala-dia-titulo">
                      {formatarData(dia.data)} - {nomeDiaSemana(dia.data)}
                    </h3>
                    <table className="admin-tabela">
                      <thead>
                        <tr>
                          <th>Função</th>
                          <th>Manhã</th>
                          <th>Tarde</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dia.itens.map((item) => (
                          <tr key={item.funcao}>
                            <td>{item.funcao}</td>
                            <td>
                              {item.manha ??
                                ([
                                  "Projeção (Holyrics)",
                                  "Áudio (Som)",
                                ].includes(item.funcao)
                                  ? "Sem ninguém disponível"
                                  : "-")}
                            </td>
                            <td>{item.tarde ?? "Sem ninguém disponível"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                <div className="admin-acoes">
                  <button
                    type="button"
                    className="admin-botao-editar"
                    onClick={publicarEscala}
                  >
                    Publicar
                  </button>

                  <button
                    type="button"
                    className="admin-botao-apagar"
                    onClick={apagarEscala}
                  >
                    Apagar escala
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {mostrarAvisos && (
          <section className="admin-cartao admin-cartao-espaco">
            <p>Nenhum aviso cadastrado ainda.</p>
          </section>
        )}

        {mostrarEscala && (
          <section>
            <h2 className="admin-secao-titulo">Restrições registradas</h2>

            <div className="admin-cartao">
              {restricoes.length === 0 ? (
                <p>Nenhuma restrição registrada ainda.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-tabela">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Data</th>
                        <th>Período</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restricoes.map((restricao, indice) => (
                        <tr
                          key={`${restricao.nome}-${restricao.data}-${indice}`}
                        >
                          <td>
                            {restricao.nome} {restricao.sobrenome}
                          </td>
                          <td>
                            {restricaoEditando === indice ? (
                              <input
                                type="date"
                                className="login-campo"
                                aria-label="Data da restrição"
                                value={dataEdicaoRestricao}
                                onChange={(e) => {
                                  setDataEdicaoRestricao(e.target.value);
                                  setErroEdicaoRestricao("");
                                }}
                                autoFocus
                              />
                            ) : (
                              formatarData(restricao.data)
                            )}
                          </td>
                          <td>
                            {restricaoEditando === indice ? (
                              <select
                                className="login-campo"
                                aria-label="Período da restrição"
                                value={periodoEdicaoRestricao}
                                onChange={(e) => {
                                  const valor = e.target.value;
                                  if (
                                    valor === "" ||
                                    valor === "manha" ||
                                    valor === "tarde"
                                  ) {
                                    setPeriodoEdicaoRestricao(valor);
                                  }
                                  setErroEdicaoRestricao("");
                                }}
                              >
                                <option value="manha">Manhã</option>
                                <option value="tarde">Tarde</option>
                                {!restricao.periodo && (
                                  <option value="">Dia inteiro</option>
                                )}
                              </select>
                            ) : restricao.periodo === "manha" ? (
                              "Manhã"
                            ) : restricao.periodo === "tarde" ? (
                              "Tarde"
                            ) : (
                              "Dia inteiro"
                            )}
                          </td>
                          <td>
                            <div className="admin-acoes">
                              {restricaoEditando === indice ? (
                                <>
                                  <button
                                    type="button"
                                    className="admin-botao-editar"
                                    onClick={salvarEdicaoRestricao}
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-botao-apagar"
                                    onClick={cancelarEdicaoRestricao}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="admin-botao-editar"
                                    onClick={() =>
                                      iniciarEdicaoRestricao(indice)
                                    }
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-botao-apagar"
                                    onClick={() => apagarRestricao(indice)}
                                  >
                                    Apagar
                                  </button>
                                </>
                              )}
                            </div>

                            {restricaoEditando === indice &&
                              erroEdicaoRestricao && (
                                <p className="login-erro" role="alert">
                                  {erroEdicaoRestricao}
                                </p>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        <h2 className="admin-secao-titulo">Solicitações para entrar</h2>
        <section className="admin-cartao">
          {erroSolicitacoes && (
            <p className="login-erro" role="alert">
              {erroSolicitacoes}
            </p>
          )}

          {solicitacoes.length === 0 ? (
            <p>Nenhuma solicitação pendente.</p>
          ) : (
            <table className="admin-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Funções</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.nome} {s.sobrenome}
                    </td>
                    <td>{s.atribuicoes.join(", ") || "-"}</td>
                    <td>
                      <div className="admin-acoes">
                        <button
                          type="button"
                          className="admin-botao-editar"
                          onClick={() => aprovarSolicitacao(s.id)}
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="admin-botao-apagar"
                          onClick={() => recusarSolicitacao(s.id)}
                        >
                          Recusar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {mostrarFuncoes && (
        <button
          type="button"
          className={`admin-botao-flutuante admin-botao-flutuante-funcao ${
            !mostrarMembros ? "admin-botao-flutuante-baixo" : ""
          }`}
          onClick={() => setModalFuncaoAberto(true)}
          aria-label="Adicionar nova função"
          title="Adicionar nova função"
        >
          +
        </button>
      )}

      {mostrarMembros && (
        <button
          type="button"
          className="admin-botao-flutuante"
          onClick={() => setModalAberto(true)}
          aria-label="Adicionar novo membro"
          title="Adicionar novo membro"
        >
          +
        </button>
      )}

      {mostrarEscala && (
        <button
          type="button"
          className={`admin-botao-flutuante ${
            mostrarMembros || mostrarFuncoes ? "admin-botao-flutuante-lado" : ""
          }`}
          onClick={abrirModalEscala}
          aria-label="Gerar escala"
          title="Gerar escala"
        >
          +
        </button>
      )}

      {mostrarEscala && (
        <button
          type="button"
          className="admin-botao-flutuante"
          onClick={abrirModalRestricao}
          aria-label="Adicionar restrição"
          aria-haspopup="dialog"
          aria-expanded={modalRestricaoAberto}
          title="Adicionar restrição"
          style={{
            bottom: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          🚫
        </button>
      )}

      {modalRestricaoAberto && (
        <div
          onClick={fecharModalRestricao}
          onKeyDown={(e) => {
            if (e.key === "Escape") fecharModalRestricao();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "16px 16px 24px",
            boxSizing: "border-box",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-restricao"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 340,
              maxWidth: "100%",
              maxHeight: "calc(100dvh - 40px)",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 22,
              boxSizing: "border-box",
              boxShadow: "0 6px 24px rgba(0,0,0,.25)",
              color: "#222",
            }}
          >
            <h2
              id="titulo-restricao"
              className="admin-modal-titulo"
              style={{ marginTop: 0 }}
            >
              Nova restrição
            </h2>

            <form onSubmit={adicionarRestricao} className="login-formulario">
              <div>
                <label htmlFor="membro-restricao" className="login-rotulo">
                  Nome
                </label>
                <select
                  id="membro-restricao"
                  required
                  autoFocus
                  value={membroRestricao}
                  onChange={(e) => {
                    setMembroRestricao(e.target.value);
                    setErroRestricao("");
                  }}
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Selecione o membro</option>
                  {usuarios.map((u, i) => (
                    <option key={i} value={String(i)}>
                      {u.nome} {u.sobrenome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="data-restricao" className="login-rotulo">
                  Data da restrição
                </label>
                <input
                  id="data-restricao"
                  type="date"
                  required
                  value={dataRestricao}
                  onChange={(e) => {
                    setDataRestricao(e.target.value);
                    setErroRestricao("");
                  }}
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label htmlFor="periodo-restricao" className="login-rotulo">
                  Período
                </label>
                <select
                  id="periodo-restricao"
                  required
                  value={periodoRestricao}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor === "manha" || valor === "tarde") {
                      setPeriodoRestricao(valor);
                    }
                    setErroRestricao("");
                  }}
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>

              {usuarios.length === 0 && (
                <p className="login-link">
                  Cadastre um membro antes de adicionar uma restrição.
                </p>
              )}

              <p className="login-link">
                O membro não será escalado na data e no período selecionados.
                Para aplicar em uma escala existente, gere o mês novamente.
              </p>

              {erroRestricao && (
                <p className="login-erro" role="alert">
                  {erroRestricao}
                </p>
              )}

              <div className="admin-modal-acoes">
                <button
                  type="button"
                  className="admin-modal-cancelar"
                  onClick={fecharModalRestricao}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="login-botao admin-modal-salvar"
                  disabled={usuarios.length === 0}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="admin-modal-fundo" onClick={fecharModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">
              {membroEditando !== null ? "Editar membro" : "Novo membro"}
            </h2>

            <form onSubmit={adicionarMembro} className="login-formulario">
              <div>
                <label className="login-rotulo">Nome</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o nome"
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo">Sobrenome</label>
                <input
                  type="text"
                  value={sobrenome}
                  onChange={(e) => setSobrenome(e.target.value)}
                  placeholder="Digite o sobrenome"
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo">Atribuições / Funções:</label>
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

              <div className="admin-modal-acoes">
                <button
                  type="button"
                  className="admin-modal-cancelar"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="login-botao admin-modal-salvar"
                >
                  {membroEditando !== null ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalFuncaoAberto && (
        <div className="admin-modal-fundo" onClick={fecharModalFuncao}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">Nova função</h2>

            <form onSubmit={adicionarFuncao} className="login-formulario">
              <div>
                <label className="login-rotulo">Nome da função</label>
                <input
                  type="text"
                  value={novaFuncao}
                  onChange={(e) => setNovaFuncao(e.target.value)}
                  placeholder="Ex: Drone"
                  className="login-campo"
                  autoFocus
                />
              </div>

              <div>
                <label className="login-rotulo">Atribuir a membros:</label>
                <div className="login-lista-funcoes">
                  {usuarios.length === 0 ? (
                    <p className="login-link">Nenhum membro cadastrado.</p>
                  ) : (
                    usuarios.map((u, i) => (
                      <label key={u.id} className="login-opcao">
                        <input
                          type="checkbox"
                          className="login-checkbox"
                          checked={membrosEscolhidos.includes(i)}
                          onChange={() => alternarMembroEscolhido(i)}
                        />
                        {u.nome} {u.sobrenome}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {erroFuncao && <p className="login-erro">{erroFuncao}</p>}

              <div className="admin-modal-acoes">
                <button
                  type="button"
                  className="admin-modal-cancelar"
                  onClick={fecharModalFuncao}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="login-botao admin-modal-salvar"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalEscalaAberto && (
        <div className="admin-modal-fundo" onClick={fecharModalEscala}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">Gerar escala</h2>

            <form onSubmit={gerarEscala} className="login-formulario">
              <div>
                <label className="login-rotulo">Mês</label>
                <input
                  type="month"
                  required
                  value={mesEscala}
                  onChange={(e) => setMesEscala(e.target.value)}
                  className="login-campo"
                />
              </div>

              <p className="login-link">
                A escala é criada para todos os domingos do mês, com manhã e
                tarde. Quem tiver restrição não é escalado no período indicado.
                Restrições antigas sem período bloqueiam o dia inteiro. Se esse
                mês já tiver escala, ela será substituída.
              </p>

              {erroEscala && <p className="login-erro">{erroEscala}</p>}

              <div className="admin-modal-acoes">
                <button
                  type="button"
                  className="admin-modal-cancelar"
                  onClick={fecharModalEscala}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="login-botao admin-modal-salvar"
                >
                  Gerar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}