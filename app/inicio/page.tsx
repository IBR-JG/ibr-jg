"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Usuario = {
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

type Plantao = {
  data: string;
  funcao: string;
  nome: string;
  periodo: "manha" | "tarde";
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

const rotulosFuncoes: Record<string, string> = {
  "Projeção (Holyrics)": "HOLYRICS",
  "Áudio (Som)": "SOM",
  "Transmissão (OBS)": "OBS",
  Fotografia: "Foto",
  "Social Media / Stories": "Redes sociais",
};

const rotuloFuncao = (funcao: string) => rotulosFuncoes[funcao] ?? funcao;

const rotuloPeriodo = (periodo: "manha" | "tarde") =>
  periodo === "manha" ? "Manhã" : "Noite";

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

const nomePeriodoRestricao = (restricao: Restricao) =>
  restricao.periodo === "manha"
    ? "Manhã"
    : restricao.periodo === "tarde"
      ? "Tarde"
      : "Dia inteiro";

export default function InicioPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [mostrarRestricoes, setMostrarRestricoes] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [data, setData] = useState("");
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

  useEffect(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) {
      router.replace("/login");
      return;
    }

    try {
      const usuarioSalvo = JSON.parse(salvo) as Usuario;
      setUsuario(usuarioSalvo);

      const restricoesSalvas = JSON.parse(
        localStorage.getItem("restricoes") || "[]"
      );
      setRestricoes(Array.isArray(restricoesSalvas) ? restricoesSalvas : []);

      const escalaSalva = JSON.parse(
        localStorage.getItem("escalaPublicada") || "[]"
      );
      setEscalaPublicada(Array.isArray(escalaSalva) ? escalaSalva : []);
    } catch {
      setRestricoes([]);
      setEscalaPublicada([]);
    }
  }, [router]);

  const sair = () => {
    localStorage.removeItem("usuario");
    router.push("/login");
  };

  const salvarRestricoes = (lista: Restricao[]) => {
    setRestricoes(lista);
    localStorage.setItem("restricoes", JSON.stringify(lista));
  };

  const fecharModal = () => {
    setModalAberto(false);
    setData("");
    setMotivo("");
  };

  const adicionarRestricao = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario) return;

    salvarRestricoes([
      ...restricoes,
      {
        nome: usuario.nome,
        sobrenome: usuario.sobrenome,
        data,
        motivo,
      },
    ]);

    fecharModal();
  };

  const apagarRestricao = (restricao: Restricao) => {
    if (!confirm("Apagar esta restrição?")) return;

    salvarRestricoes(restricoes.filter((r) => r !== restricao));
  };

  const iniciarEdicao = (restricao: Restricao) => {
    setRestricaoEditando(restricao);
    setDataEdicao(restricao.data);
    setPeriodoEdicao(restricao.periodo ?? "");
    setMotivoEdicao(restricao.motivo || "");
  };

  const cancelarEdicao = () => {
    setRestricaoEditando(null);
    setDataEdicao("");
    setPeriodoEdicao("");
    setMotivoEdicao("");
  };

  const salvarEdicao = () => {
    if (!restricaoEditando || !dataEdicao) return;

    salvarRestricoes(
      restricoes.map((r) =>
        r === restricaoEditando
          ? {
              ...r,
              data: dataEdicao,
              motivo: motivoEdicao,
              periodo: periodoEdicao === "" ? undefined : periodoEdicao,
            }
          : r
      )
    );

    cancelarEdicao();
  };

  const alternarEscala = () => {
    try {
      const salva = JSON.parse(
        localStorage.getItem("escalaPublicada") || "[]"
      );
      setEscalaPublicada(Array.isArray(salva) ? salva : []);
    } catch {
      setEscalaPublicada([]);
    }

    setMostrarEscala((visivel) => !visivel);
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

  const isoHoje = (() => {
    const hoje = new Date();

    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(hoje.getDate()).padStart(2, "0")}`;
  })();

  const correspondeAoUsuario = (nomeNaEscala: string | null) => {
    const nomeEscala = normalizarNome(nomeNaEscala);

    if (!nomeEscala) return false;

    // Compara o nome completo quando ele está disponível.
    if (nomeEscala === nomeCompleto) return true;

    // Também aceita primeiro nome quando a escala ou o login só o contém.
    const escalaTemUmNome = nomeEscala.split(" ").length === 1;
    const usuarioTemUmNome = nomeCompleto.split(" ").length === 1;

    return (
      (escalaTemUmNome || usuarioTemUmNome) &&
      nomeEscala === primeiroNomeUsuario
    );
  };

  const minhasEscalas: Plantao[] = escalaPublicada
    .filter((dia) => dia.data >= isoHoje)
    .flatMap((dia) =>
      (dia.itens ?? []).flatMap((item) => {
        const plantoes: Plantao[] = [];

        if (correspondeAoUsuario(item.manha)) {
          plantoes.push({
            data: dia.data,
            funcao: item.funcao,
            nome: nomeCompleto,
            periodo: "manha",
          });
        }

        if (correspondeAoUsuario(item.tarde)) {
          plantoes.push({
            data: dia.data,
            funcao: item.funcao,
            nome: nomeCompleto,
            periodo: "tarde",
          });
        }

        return plantoes;
      })
    )
    .sort(
      (a, b) =>
        a.data.localeCompare(b.data) ||
        (a.periodo === "manha" ? -1 : 1)
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
    periodo: "manha" | "tarde"
  ) =>
    (dia.itens ?? [])
      .map((item) => ({
        funcao: rotuloFuncao(item.funcao),
        pessoa: periodo === "manha" ? item.manha : item.tarde,
      }))
      .filter(
        (a): a is { funcao: string; pessoa: string } =>
          Boolean(a.pessoa && a.pessoa.trim() !== "")
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
            onClick={sair}
            className="inicio-botao-sair"
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
                            manha.map((a) => (
                              <p
                                className="escala-publica-item"
                                key={`manha-${dia.data}-${a.funcao}`}
                              >
                                <strong>{a.funcao}:</strong> {a.pessoa}
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
                            noite.map((a) => (
                              <p
                                className="escala-publica-item"
                                key={`noite-${dia.data}-${a.funcao}`}
                              >
                                <strong>{a.funcao}:</strong> {a.pessoa}
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
            <h3 className="inicio-cartao-titulo">
              Restrições registradas
            </h3>

            {restricoesOrdenadas.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhuma restrição registrada ainda.
              </p>
            ) : (
              <table className="admin-tabela">
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
                  {restricoesOrdenadas.map((restricao, indice) => {
                    const minha = ehMinhaRestricao(restricao);
                    const emEdicao = restricaoEditando === restricao;

                    return (
                      <tr
                        key={`${restricao.nome}-${restricao.data}-${indice}`}
                      >
                        <td>
                          {restricao.nome} {restricao.sobrenome}
                        </td>

                        <td>
                          {minha && emEdicao ? (
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
                          {minha && emEdicao ? (
                            <select
                              className="login-campo"
                              value={periodoEdicao}
                              onChange={(e) =>
                                setPeriodoEdicao(
                                  e.target.value as "manha" | "tarde" | ""
                                )
                              }
                            >
                              <option value="manha">Manhã</option>
                              <option value="tarde">Tarde</option>
                              {!restricao.periodo && (
                                <option value="">Dia inteiro</option>
                              )}
                            </select>
                          ) : (
                            nomePeriodoRestricao(restricao)
                          )}
                        </td>

                        <td>
                          {minha && emEdicao ? (
                            <input
                              type="text"
                              className="login-campo"
                              value={motivoEdicao}
                              onChange={(e) => setMotivoEdicao(e.target.value)}
                            />
                          ) : (
                            restricao.motivo || "-"
                          )}
                        </td>

                        <td>
                          {minha ? (
                            emEdicao ? (
                              <div className="admin-acoes">
                                <button
                                  type="button"
                                  className="admin-botao-editar"
                                  onClick={salvarEdicao}
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
                                  onClick={() => apagarRestricao(restricao)}
                                >
                                  Apagar
                                </button>
                              </div>
                            )
                          ) : (
                            "—"
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
            <h3 className="inicio-cartao-titulo">Próxima escala</h3>

            {minhasEscalas.length === 0 ? (
              <p className="inicio-texto-suave">
                Você não está escalado nas próximas datas publicadas.
              </p>
            ) : (
              minhasEscalas.map((plantao, indice) => (
                <p
                  key={`${plantao.data}-${plantao.funcao}-${plantao.periodo}-${indice}`}
                  style={{ margin: "4px 0" }}
                >
                  {formatarDiaMes(plantao.data)} —{" "}
                  {rotuloFuncao(plantao.funcao)} — {plantao.nome} —{" "}
                  {rotuloPeriodo(plantao.periodo)}
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
              minhasRestricoes.map((restricao, indice) => (
                <p
                  key={`${restricao.data}-${indice}`}
                  style={{ margin: "4px 0" }}
                >
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

            <form
              onSubmit={adicionarRestricao}
              className="login-formulario"
            >
              <div>
                <label className="login-rotulo">Data</label>

                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="login-campo"
                />
              </div>

              <div>
                <label className="login-rotulo">Motivo</label>

                <input
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
    </div>
  );
}