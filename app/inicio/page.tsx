"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Usuario = {
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
};

type Restricao = {
  id: string;
  nome: string;
  sobrenome: string;
  data: string;
  motivo: string | null;
  periodo?: "manha" | "tarde" | null;
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

type AvisoPublicado = {
  id: string;
  imagem_url: string;
  observacao: string | null;
  criado_em: string;
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Guarda qual seção estava aberta para restaurar ao recarregar a página.
const SECAO_KEY = "inicio:secao-aberta";

const rotulosFuncoes: Record<string, string> = {
  "Projeção (Holyrics)": "HOLYRICS",
  "Áudio (Som)": "SOM",
  "Transmissão (OBS)": "OBS",
  Fotografia: "Foto",
  "Social Media / Stories": "Redes sociais",
};

const rotuloFuncao = (funcao: string) => rotulosFuncoes[funcao] ?? funcao;

const normalizarNome = (nome: string | null | undefined) =>
  (nome ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

const nomeDiaSemana = (iso: string) => {
  const [ano, mes, dia] = iso.split("-").map(Number);

  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "long",
  });
};

const dataExtenso = (iso: string) => {
  const [, mes, dia] = iso.split("-");
  return `${dia} de ${MESES[Number(mes) - 1]}`;
};

const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarDiaMes = (iso: string) => {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
};

const formatarDataHora = (valor: string) =>
  new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const nomePeriodoRestricao = (restricao: Restricao) =>
  restricao.periodo === "manha"
    ? "Manhã"
    : restricao.periodo === "tarde"
      ? "Tarde"
      : "Dia inteiro";

// Funções que viram botão de ensaio na parte da noite.
const funcoesComEnsaio = ["HOLYRICS", "OBS"];

export default function InicioPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [erroRestricoes, setErroRestricoes] = useState("");
  const [mostrarRestricoes, setMostrarRestricoes] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [data, setData] = useState("");
  const [periodo, setPeriodo] = useState<"manha" | "tarde" | "">("");
  const [motivo, setMotivo] = useState("");

  const [restricaoEditando, setRestricaoEditando] =
    useState<Restricao | null>(null);
  const [dataEdicao, setDataEdicao] = useState("");
  const [periodoEdicao, setPeriodoEdicao] = useState<
    "manha" | "tarde" | ""
  >("");
  const [motivoEdicao, setMotivoEdicao] = useState("");

  const [mostrarEscala, setMostrarEscala] = useState(false);
  const [escalaPublicada, setEscalaPublicada] = useState<DiaEscala[]>([]);

  const [mostrarAvisos, setMostrarAvisos] = useState(false);
  const [avisosPublicados, setAvisosPublicados] = useState<AvisoPublicado[]>(
    []
  );

  const [notificacao, setNotificacao] = useState("");
  const [aviso, setAviso] = useState("");
  const [restricaoParaApagar, setRestricaoParaApagar] =
    useState<Restricao | null>(null);

  const carregarRestricoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("restricoes")
      .select("id, nome, sobrenome, data, motivo, periodo")
      .order("data", { ascending: true });

    if (error) {
      console.error("Erro ao carregar restrições:", error);
      setErroRestricoes(
        `Não foi possível carregar as restrições: ${error.message}`
      );
      return;
    }

    setRestricoes((data ?? []) as Restricao[]);
    setErroRestricoes("");
  }, []);

  const carregarEscala = useCallback(async () => {
    const { data, error } = await supabase
      .from("escalas")
      .select("data, itens")
      .order("data", { ascending: true });

    if (error) {
      console.error("Erro ao carregar escala:", error);
      setAviso(`Não foi possível carregar a escala: ${error.message}`);
      return;
    }

    setEscalaPublicada(
      ((data ?? []) as { data: string; itens: ItemEscala[] | null }[]).map(
        (dia) => ({
          data: dia.data,
          itens: dia.itens ?? [],
        })
      )
    );
  }, []);

  const carregarAvisos = useCallback(async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("id, imagem_url, observacao, criado_em")
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar avisos:", error);
      setAviso(`Não foi possível carregar os avisos: ${error.message}`);
      return;
    }

    setAvisosPublicados((data ?? []) as AvisoPublicado[]);
  }, []);

  useEffect(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) {
      router.replace("/login");
      return;
    }

    try {
      const usuarioSalvo = JSON.parse(salvo) as Usuario;
      setUsuario(usuarioSalvo);
    } catch {
      router.replace("/login");
      return;
    }

    try {
      const secaoSalva = JSON.parse(
        localStorage.getItem(SECAO_KEY) || "{}"
      );

      setMostrarRestricoes(Boolean(secaoSalva.mostrarRestricoes));
      setMostrarEscala(Boolean(secaoSalva.mostrarEscala));
      setMostrarAvisos(Boolean(secaoSalva.mostrarAvisos));
    } catch {
      // Se o valor estiver inválido, as seções começam fechadas.
    }

    void carregarRestricoes();
    void carregarEscala();
    void carregarAvisos();
  }, [carregarRestricoes, carregarEscala, carregarAvisos, router]);

  useEffect(() => {
    if (!notificacao) return;

    const timer = window.setTimeout(() => setNotificacao(""), 6000);
    return () => window.clearTimeout(timer);
  }, [notificacao]);

  useEffect(() => {
    if (!aviso) return;

    const timer = window.setTimeout(() => setAviso(""), 4000);
    return () => window.clearTimeout(timer);
  }, [aviso]);

  useEffect(() => {
    if (!usuario) return;

    localStorage.setItem(
      SECAO_KEY,
      JSON.stringify({
        mostrarRestricoes,
        mostrarEscala,
        mostrarAvisos,
      })
    );
  }, [usuario, mostrarRestricoes, mostrarEscala, mostrarAvisos]);

  const sair = () => {
    localStorage.removeItem("usuario");
    router.push("/login");
  };

  const fecharModal = () => {
    setModalAberto(false);
    setData("");
    setPeriodo("");
    setMotivo("");
  };

  const adicionarRestricao = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usuario) return;

    const { error } = await supabase.from("restricoes").insert({
      nome: usuario.nome,
      sobrenome: usuario.sobrenome ?? "",
      data,
      motivo: motivo.trim() || null,
      periodo: periodo === "" ? null : periodo,
    });

    if (error) {
      console.error("Erro ao salvar restrição:", error);
      setAviso(`Falha ao salvar a restrição: ${error.message}`);
      return;
    }

    fecharModal();
    setAviso("Restrição adicionada.");
    await carregarRestricoes();
  };

  const apagarRestricao = async () => {
    if (!restricaoParaApagar) return;

    const { error } = await supabase
      .from("restricoes")
      .delete()
      .eq("id", restricaoParaApagar.id);

    if (error) {
      console.error("Erro ao apagar restrição:", error);
      setAviso(`Não foi possível apagar a restrição: ${error.message}`);
      return;
    }

    setRestricaoParaApagar(null);
    setAviso("Restrição apagada.");
    await carregarRestricoes();
  };

  const iniciarEdicao = (restricao: Restricao) => {
    setRestricaoEditando(restricao);
    setDataEdicao(restricao.data);
    setPeriodoEdicao(restricao.periodo ?? "");
    setMotivoEdicao(restricao.motivo ?? "");
  };

  const cancelarEdicao = () => {
    setRestricaoEditando(null);
    setDataEdicao("");
    setPeriodoEdicao("");
    setMotivoEdicao("");
  };

  const salvarEdicao = async () => {
    if (!restricaoEditando || !dataEdicao) return;

    const { error } = await supabase
      .from("restricoes")
      .update({
        data: dataEdicao,
        motivo: motivoEdicao.trim() || null,
        periodo: periodoEdicao === "" ? null : periodoEdicao,
      })
      .eq("id", restricaoEditando.id);

    if (error) {
      console.error("Erro ao atualizar restrição:", error);
      setAviso(`Não foi possível atualizar a restrição: ${error.message}`);
      return;
    }

    cancelarEdicao();
    setAviso("Restrição atualizada.");
    await carregarRestricoes();
  };

  const alternarEscala = () => {
    void carregarEscala();
    setMostrarEscala((visivel) => !visivel);
  };

  const alternarAvisos = () => {
    void carregarAvisos();
    setMostrarAvisos((visivel) => !visivel);
  };

  const ehLider = usuario?.atribuicoes?.some(
    (atribuicao) => atribuicao.trim().toLocaleLowerCase("pt-BR") === "líder"
  );

  if (!usuario) return null;

  const ehMinhaRestricao = (restricao: Restricao) =>
    normalizarNome(restricao.nome) === normalizarNome(usuario.nome) &&
    normalizarNome(restricao.sobrenome) ===
      normalizarNome(usuario.sobrenome);

  const restricoesOrdenadas = [...restricoes].sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  const minhasRestricoes = restricoesOrdenadas.filter(ehMinhaRestricao);

  const nomeCompleto = normalizarNome(
    `${usuario.nome} ${usuario.sobrenome ?? ""}`
  );

  const primeiroNomeUsuario = normalizarNome(usuario.nome);

  const hoje = new Date();
  const isoHoje = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const proximasEscalasPublicadas = [...escalaPublicada].sort((a, b) =>
  a.data.localeCompare(b.data)
  );

  const correspondeAoUsuario = (nomeNaEscala: string | null) => {
    const nomeEscala = normalizarNome(nomeNaEscala);

    if (!nomeEscala) return false;
    if (nomeEscala === nomeCompleto) return true;

    const escalaTemUmNome = nomeEscala.split(" ").length === 1;
    const usuarioTemUmNome = nomeCompleto.split(" ").length === 1;

    return (
      (escalaTemUmNome || usuarioTemUmNome) &&
      nomeEscala === primeiroNomeUsuario
    );
  };

const minhasProximasEscalas = proximasEscalasPublicadas.flatMap((dia) =>
  (dia.itens ?? [])
    .flatMap((item) => [
      ...(item.manha
        ? [
            {
              funcao: item.funcao,
              pessoa: item.manha,
              periodo: "manha" as const,
            },
          ]
        : []),
      ...(item.tarde
        ? [
            {
              funcao: item.funcao,
              pessoa: item.tarde,
              periodo: "tarde" as const,
            },
          ]
        : []),
    ])
    .filter((atribuicao) => correspondeAoUsuario(atribuicao.pessoa))
    .map((atribuicao) => ({
      data: dia.data,
      periodo: atribuicao.periodo,
      funcao: rotuloFuncao(atribuicao.funcao),
    }))
);

  const escalaOrdenada = [...escalaPublicada].sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  const mesEscala =
    escalaOrdenada.length > 0
      ? {
          nome: MESES[Number(escalaOrdenada[0].data.split("-")[1]) - 1],
          ano: escalaOrdenada[0].data.split("-")[0],
        }
      : null;

  const atribuicoesDoPeriodo = (
    dia: DiaEscala,
    periodoDoDia: "manha" | "tarde"
  ) =>
    (dia.itens ?? [])
      .map((item) => ({
        funcao: rotuloFuncao(item.funcao),
        pessoa: periodoDoDia === "manha" ? item.manha : item.tarde,
      }))
      .filter(
        (atribuicao): atribuicao is { funcao: string; pessoa: string } =>
          Boolean(atribuicao.pessoa && atribuicao.pessoa.trim() !== "")
      );

  return (
    <div className="inicio-pagina">
      <header className="inicio-cabecalho">
        {ehLider ? (
          <Link
            href="/admin"
            className="inicio-logo-link"
            title="Ir para o Admin"
          >
            <img
              src="/logo.jpg"
              alt="Comunicação IBR JG"
              className="inicio-logo"
            />
          </Link>
        ) : (
          <img
            src="/logo.jpg"
            alt="Comunicação IBR JG"
            className="inicio-logo"
          />
        )}

        <nav className="inicio-menu">
          <button
            type="button"
            className={`inicio-botao-menu ${
              mostrarRestricoes ? "inicio-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarRestricoes((visivel) => !visivel)}
          >
            Restrições
          </button>

          <button
            type="button"
            className={`inicio-botao-menu ${
              mostrarEscala ? "inicio-botao-menu-ativo" : ""
            }`}
            onClick={alternarEscala}
          >
            Escala
          </button>

          <button
            type="button"
            className={`inicio-botao-menu ${
              mostrarAvisos ? "inicio-botao-menu-ativo" : ""
            }`}
            onClick={alternarAvisos}
          >
            Avisos
          </button>

          <button
            type="button"
            className="inicio-botao-menu"
            onClick={sair}
          >
            Sair
          </button>
        </nav>
      </header>

      <main className="inicio-conteudo">
        <h1 className="inicio-titulo">Olá, {usuario.nome}!</h1>

        <p className="inicio-subtitulo">
          Bem-vindo ao sistema de escalas do time de comunicação.
        </p>

        {mostrarEscala && (
          <section className="inicio-cartao inicio-cartao-restricoes escala-publica">
            {escalaOrdenada.length === 0 ? (
              <>
                <h3 className="inicio-cartao-titulo">Escala publicada</h3>
                <p className="inicio-texto-suave">
                  Nenhuma escala publicada ainda.
                </p>
              </>
            ) : (
              <>
                <h2 className="escala-publica-titulo">
                  📢 Escala Mês de {mesEscala?.nome}
                </h2>

                <p className="escala-publica-subtitulo">
                  {mesEscala?.nome} / {mesEscala?.ano}
                </p>

                {escalaOrdenada.map((dia) => {
                  const manha = atribuicoesDoPeriodo(dia, "manha");
                  const noite = atribuicoesDoPeriodo(dia, "tarde");

                  return (
                    <div className="escala-publica-dia" key={dia.data}>
                      <div className="escala-publica-data">
                        <span className="escala-publica-calendario">
                          📅
                        </span>

                        <span>
                          {dataExtenso(dia.data)}
                          <small className="escala-publica-dia-semana">
                            {nomeDiaSemana(dia.data)}
                          </small>
                        </span>
                      </div>

                      <div className="escala-publica-turnos">
                        <div className="escala-publica-turno">
                          <h4 className="escala-publica-turno-titulo">
                            Manhã -
                          </h4>

                          {manha.length === 0 ? (
                            <p className="escala-publica-item">—</p>
                          ) : (
                            manha.map((atribuicao) => (
                              <p
                                className="escala-publica-item"
                                key={`manha-${dia.data}-${atribuicao.funcao}`}
                              >
                                <strong>{atribuicao.funcao}:</strong>{" "}
                                {atribuicao.pessoa}
                              </p>
                            ))
                          )}
                        </div>

                        <div className="escala-publica-turno">
                          <h4 className="escala-publica-turno-titulo">
                            Noite -
                          </h4>

                          {noite.length === 0 ? (
                            <p className="escala-publica-item">—</p>
                          ) : (
                            noite.map((atribuicao) => (
                              <p
                                className="escala-publica-item"
                                key={`noite-${dia.data}-${atribuicao.funcao}`}
                              >
                                <strong>
                                  {funcoesComEnsaio.includes(
                                    atribuicao.funcao
                                  ) ? (
                                    <button
                                      type="button"
                                      className="botao-funcao-ensaio"
                                      onClick={() =>
                                        setNotificacao(
                                          "Ir para o ensaio no sábado às 09:00."
                                        )
                                      }
                                    >
                                      {atribuicao.funcao}
                                    </button>
                                  ) : (
                                    atribuicao.funcao
                                  )}
                                  :
                                </strong>{" "}
                                {atribuicao.pessoa}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

        {mostrarRestricoes && (
          <section className="inicio-cartao inicio-cartao-restricoes">
            <h3 className="inicio-cartao-titulo">Restrições registradas</h3>

            {erroRestricoes ? (
              <p className="inicio-texto-suave">{erroRestricoes}</p>
            ) : restricoesOrdenadas.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhuma restrição registrada ainda.
              </p>
            ) : (
              <table className="admin-tabela tabela-restricoes">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Data</th>
                    <th>Período</th>
                    <th>Motivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {restricoesOrdenadas.map((restricao) => {
                    const emEdicao =
                      restricaoEditando?.id === restricao.id;

                    return (
                      <tr key={restricao.id}>
                        <td>
                          {restricao.nome} {restricao.sobrenome}
                        </td>

                        <td>
                          {emEdicao ? (
                            <input
                              type="date"
                              className="login-campo"
                              value={dataEdicao}
                              onChange={(e) => setDataEdicao(e.target.value)}
                            />
                          ) : (
                            formatarData(restricao.data)
                          )}
                        </td>

                        <td>
                          {emEdicao ? (
                            <select
                              className="login-campo"
                              value={periodoEdicao}
                              onChange={(e) =>
                                setPeriodoEdicao(
                                  e.target.value as "manha" | "tarde" | ""
                                )
                              }
                            >
                              <option value="">Dia inteiro</option>
                              <option value="manha">Manhã</option>
                              <option value="tarde">Tarde</option>
                            </select>
                          ) : (
                            nomePeriodoRestricao(restricao)
                          )}
                        </td>

                        <td>
                          {emEdicao ? (
                            <input
                              type="text"
                              className="login-campo"
                              value={motivoEdicao}
                              onChange={(e) =>
                                setMotivoEdicao(e.target.value)
                              }
                            />
                          ) : (
                            restricao.motivo || "-"
                          )}
                        </td>

                        <td>
                          {emEdicao ? (
                            <div className="admin-acoes">
                              <button
                                type="button"
                                className="admin-botao-editar"
                                onClick={() => void salvarEdicao()}
                              >
                                Salvar
                              </button>

                              <button
                                type="button"
                                className="admin-botao-apagar"
                                onClick={cancelarEdicao}
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="admin-acoes">
                              <button
                                type="button"
                                className="admin-botao-editar"
                                onClick={() => iniciarEdicao(restricao)}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="admin-botao-apagar"
                                onClick={() =>
                                  setRestricaoParaApagar(restricao)
                                }
                              >
                                Apagar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {mostrarAvisos && (
          <section className="inicio-cartao">
            <h3 className="inicio-cartao-titulo">Avisos</h3>

            {avisosPublicados.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhum aviso publicado ainda.
              </p>
            ) : (
              avisosPublicados.map((avisoPublicado) => (
                <div
                  key={avisoPublicado.id}
                  style={{
                    border: "1px solid rgba(128, 128, 128, .35)",
                    borderRadius: 12,
                    padding: 12,
                    margin: "10px 0",
                  }}
                >
                  <img
                    src={avisoPublicado.imagem_url}
                    alt="Aviso"
                    style={{
                      width: "100%",
                      borderRadius: 8,
                      display: "block",
                    }}
                  />

                  {avisoPublicado.observacao && (
                    <p style={{ margin: "8px 0 2px" }}>
                      {avisoPublicado.observacao}
                    </p>
                  )}

                  <p
                    className="inicio-texto-suave"
                    style={{ margin: 0, fontSize: 13 }}
                  >
                    {formatarDataHora(avisoPublicado.criado_em)}
                  </p>
                </div>
              ))
            )}
          </section>
        )}

        <div className="inicio-grade">
          <section className="inicio-cartao">
            <h3 className="inicio-cartao-titulo">Meu perfil</h3>

            <p>
              {usuario.nome} {usuario.sobrenome}
            </p>

            <p className="inicio-texto-suave">
              {usuario.atribuicoes?.length > 0
                ? usuario.atribuicoes.join(", ")
                : "Nenhuma função selecionada"}
            </p>
          </section>

          <section className="inicio-cartao">
  <h3 className="inicio-cartao-titulo">Minhas Escalas</h3>

  {minhasProximasEscalas.length === 0 ? (
    <p className="inicio-texto-suave">
      Você não está escalado nas próximas datas.
    </p>
  ) : (
    minhasProximasEscalas.map((item, indice) => (
      <p
        key={`${item.data}-${item.funcao}-${item.periodo}-${indice}`}
        style={{ margin: "5px 0" }}
      >
        {formatarDiaMes(item.data)}/
        {item.periodo === "manha" ? "manhã" : "noite"} - {item.funcao} -{" "}
        {usuario.nome}
      </p>
    ))
  )}
</section>

          <section className="inicio-cartao">
            <h3 className="inicio-cartao-titulo">
              Minhas indisponibilidades
            </h3>

            {minhasRestricoes.length === 0 ? (
              <p className="inicio-texto-suave">Nenhuma data informada.</p>
            ) : (
              minhasRestricoes.map((restricao) => (
                <p key={restricao.id} style={{ margin: "4px 0" }}>
                  {formatarData(restricao.data)} —{" "}
                  {nomePeriodoRestricao(restricao)}
                </p>
              ))
            )}
          </section>
        </div>
      </main>

      {mostrarRestricoes && (
        <button
          type="button"
          className="admin-botao-flutuante"
          onClick={() => setModalAberto(true)}
          aria-label="Adicionar restrição"
          title="Adicionar restrição"
        >
          +
        </button>
      )}

      {modalAberto && (
        <div className="admin-modal-fundo" onClick={fecharModal}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-modal-titulo">Nova restrição</h2>

            <form onSubmit={adicionarRestricao} className="login-formulario">
              <div>
                <label className="login-rotulo" htmlFor="restricao-data">
                  Data
                </label>

                <input
                  id="restricao-data"
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="login-campo"
                />
              </div>

              <div>
                <label
                  className="login-rotulo"
                  htmlFor="restricao-periodo"
                >
                  Período
                </label>

                <select
                  id="restricao-periodo"
                  value={periodo}
                  onChange={(e) =>
                    setPeriodo(e.target.value as "manha" | "tarde" | "")
                  }
                  className="login-campo"
                >
                  <option value="">Dia inteiro</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>

              <div>
                <label className="login-rotulo" htmlFor="restricao-motivo">
                  Motivo
                </label>

                <input
                  id="restricao-motivo"
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: viagem, trabalho..."
                  className="login-campo"
                />
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restricaoParaApagar && (
        <div
          className="admin-modal-fundo"
          onClick={() => setRestricaoParaApagar(null)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">Apagar restrição</h2>

            <p style={{ margin: "0 0 16px" }}>
              Tem certeza de que deseja apagar a restrição de{" "}
              {restricaoParaApagar.nome} {restricaoParaApagar.sobrenome} em{" "}
              {formatarData(restricaoParaApagar.data)}?
            </p>

            <div className="admin-modal-acoes">
              <button
                type="button"
                className="admin-modal-cancelar"
                onClick={() => setRestricaoParaApagar(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="admin-botao-apagar"
                onClick={() => void apagarRestricao()}
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {notificacao && (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#7f1d1d",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,.3)",
            zIndex: 1000,
            fontWeight: 600,
            maxWidth: "90vw",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{notificacao}</span>

          <button
            type="button"
            onClick={() => setNotificacao("")}
            aria-label="Fechar notificação"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {aviso && (
        <div className="aviso-flutuante" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}