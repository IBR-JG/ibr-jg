"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
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

type Solicitacao = {
  id: string;
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
  senha: string | null;
};

type PedidoConfirmacao = {
  titulo: string;
  mensagem: string;
  aoConfirmar: () => void;
};

type AvisoPublicado = {
  id: string;
  imagem_url: string;
  observacao: string | null;
  criado_em: string;
};

const funcoesPadrao = [
  "Fotografia",
  "Transmissão (OBS)",
  "Projeção (Holyrics)",
  "Social Media / Stories",
  "Áudio (Som)",
];

const ADMIN_SECOES_KEY = "admin:secoes-abertas";

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

const nomePeriodo = (periodo?: "manha" | "tarde" | null) =>
  periodo === "manha"
    ? "Manhã"
    : periodo === "tarde"
      ? "Tarde"
      : "Dia inteiro";

const temRestricao = (
  membro: Usuario,
  data: string,
  periodo: "manha" | "tarde",
  lista: Restricao[]
) =>
  lista.some(
    (r) =>
      r.nome === membro.nome &&
      (r.sobrenome ?? "") === (membro.sobrenome ?? "") &&
      r.data === data &&
      (r.periodo == null || r.periodo === periodo)
  );

const FUNCOES_ENSAIO_SABADO = ["Áudio (Som)", "Projeção (Holyrics)"];

// Funções que entram na escala gerada (apenas estas duas)
const FUNCOES_ESCALA = ["Projeção (Holyrics)", "Áudio (Som)"];

// A escala é de domingo; o ensaio é no sábado imediatamente anterior.
const sabadoAnterior = (iso: string) => {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  d.setDate(d.getDate() - 1);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const temRestricaoSabado = (
  membro: Usuario,
  dataEscala: string,
  lista: Restricao[]
) => {
  const sabado = sabadoAnterior(dataEscala);

  return lista.some(
    (r) =>
      r.nome === membro.nome &&
      (r.sobrenome ?? "") === (membro.sobrenome ?? "") &&
      r.data === sabado
  );
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
  const [mostrarRestricoes, setMostrarRestricoes] = useState(false);
  const [secoesCarregadas, setSecoesCarregadas] = useState(false);

  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [membroEditando, setMembroEditando] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [atribuicoes, setAtribuicoes] = useState<string[]>([]);

  const [modalFuncaoAberto, setModalFuncaoAberto] = useState(false);
  const [novaFuncao, setNovaFuncao] = useState("");
  const [membrosEscolhidos, setMembrosEscolhidos] = useState<number[]>([]);
  const [erroFuncao, setErroFuncao] = useState("");

  const [modalEscalaAberto, setModalEscalaAberto] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState(
    String(new Date().getFullYear()).slice(2)
  );
  const [erroEscala, setErroEscala] = useState("");

  const [modalRestricaoAberto, setModalRestricaoAberto] = useState(false);
  const [membroRestricao, setMembroRestricao] = useState("");
  const [dataRestricao, setDataRestricao] = useState("");
  const [periodoRestricao, setPeriodoRestricao] = useState<"manha" | "tarde">(
    "manha"
  );
  const [erroRestricao, setErroRestricao] = useState("");
const [avisosPublicados, setAvisosPublicados] = useState<AvisoPublicado[]>([]);
const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
const [fotoAviso, setFotoAviso] = useState<File | null>(null);
const [observacaoAviso, setObservacaoAviso] = useState("");
const [enviandoAviso, setEnviandoAviso] = useState(false);

const inputGaleriaRef = useRef<HTMLInputElement>(null);
const inputCameraRef = useRef<HTMLInputElement>(null);
  const [restricaoEditando, setRestricaoEditando] = useState<number | null>(
    null
  );
  const [dataEdicaoRestricao, setDataEdicaoRestricao] = useState("");
  const [periodoEdicaoRestricao, setPeriodoEdicaoRestricao] = useState<
    "manha" | "tarde" | ""
  >("");
  const [erroEdicaoRestricao, setErroEdicaoRestricao] = useState("");

  // Aviso flutuante (substitui os alert() do navegador)
  const [aviso, setAviso] = useState("");
  const avisoTimer = useRef<number | null>(null);

  const mostrarAviso = useCallback((mensagem: string) => {
    setAviso(mensagem);

    if (avisoTimer.current !== null) {
      window.clearTimeout(avisoTimer.current);
    }

    avisoTimer.current = window.setTimeout(() => setAviso(""), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (avisoTimer.current !== null) {
        window.clearTimeout(avisoTimer.current);
      }
    };
  }, []);
const carregarAvisos = useCallback(async () => {
  const { data, error } = await supabase
    .from("avisos")
    .select("id, imagem_url, observacao, criado_em")
    .order("criado_em", { ascending: false });

  if (error) {
    mostrarAviso(`Não foi possível carregar os avisos: ${error.message}`);
    return;
  }

  setAvisosPublicados((data ?? []) as AvisoPublicado[]);
}, [mostrarAviso]);

const selecionarFotoAviso = (arquivo: File | undefined) => {
  if (!arquivo) return;

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

  if (!tiposPermitidos.includes(arquivo.type)) {
    mostrarAviso("Escolha uma imagem JPG, PNG ou WebP.");
    return;
  }

  if (arquivo.size > 5 * 1024 * 1024) {
    mostrarAviso("A imagem deve ter no máximo 5 MB.");
    return;
  }

  setFotoAviso(arquivo);
};

const fecharModalAviso = () => {
  setModalAvisoAberto(false);
  setFotoAviso(null);
  setObservacaoAviso("");

  if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
  if (inputCameraRef.current) inputCameraRef.current.value = "";
};

const publicarAviso = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!fotoAviso) {
    mostrarAviso("Escolha uma foto da galeria ou tire uma foto.");
    return;
  }

  setEnviandoAviso(true);

  const extensao = fotoAviso.name.split(".").pop()?.toLowerCase() || "jpg";
  const caminho = `aviso-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from("avisos")
    .upload(caminho, fotoAviso, {
      contentType: fotoAviso.type,
      upsert: false,
    });

  if (erroUpload) {
    setEnviandoAviso(false);
    mostrarAviso(`Não foi possível enviar a foto: ${erroUpload.message}`);
    return;
  }

  const { data: urlPublica } = supabase.storage
    .from("avisos")
    .getPublicUrl(caminho);

  const { error: erroSalvar } = await supabase.from("avisos").insert({
    imagem_url: urlPublica.publicUrl,
    observacao: observacaoAviso.trim() || null,
  });

  if (erroSalvar) {
    await supabase.storage.from("avisos").remove([caminho]);
    setEnviandoAviso(false);
    mostrarAviso(`Não foi possível salvar o aviso: ${erroSalvar.message}`);
    return;
  }

  fecharModalAviso();
  setEnviandoAviso(false);
  mostrarAviso("Aviso publicado.");
  await carregarAvisos();
};
  // Confirmação dentro da página (substitui os confirm() do navegador)
  const [confirmacao, setConfirmacao] = useState<PedidoConfirmacao | null>(
    null
  );

  const carregarSolicitacoes = useCallback(async () => {
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
  }, []);

  const carregarRestricoes = useCallback(async () => {
    const { data, error } = await supabase
      .from("restricoes")
      .select("id, nome, sobrenome, data, motivo, periodo")
      .order("data", { ascending: true });

    if (error) {
      console.error("Erro ao carregar restrições:", error.message);
      mostrarAviso(`Não foi possível carregar as restrições: ${error.message}`);
      return;
    }

    setRestricoes((data ?? []) as Restricao[]);
  }, [mostrarAviso]);

  const carregarEscalaAdmin = useCallback(async () => {
    const { data, error } = await supabase
      .from("escalas")
      .select("data, itens")
      .order("data", { ascending: true });

    if (error) {
      console.error("Erro ao carregar escala:", error);
      mostrarAviso(`Não foi possível carregar a escala: ${error.message}`);
      return;
    }

    const escalaCarregada = (
      (data ?? []) as { data: string; itens: ItemEscala[] | null }[]
    ).map((dia) => ({
      data: dia.data,
      itens: dia.itens ?? [],
    }));

    setEscala(escalaCarregada);
    localStorage.setItem("escala", JSON.stringify(escalaCarregada));
  }, [mostrarAviso]);

  const carregarUsuarios = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const salvo = localStorage.getItem("usuario");

    if (!salvo) {
      router.replace("/login");
      return;
    }

    try {
      const atual = JSON.parse(salvo);
      const lider = (atual.atribuicoes || []).some(
        (a: string) => a.trim().toLocaleLowerCase("pt-BR") === "líder"
      );

      if (!lider) {
        router.replace("/inicio");
        return;
      }

      void carregarEscalaAdmin();

      const funcoesSalvas = localStorage.getItem("funcoes");
      if (funcoesSalvas) {
        const funcoesParseadas = JSON.parse(funcoesSalvas);
        if (Array.isArray(funcoesParseadas)) setFuncoes(funcoesParseadas);
      }

      try {
        const secoesSalvas = JSON.parse(
          localStorage.getItem(ADMIN_SECOES_KEY) || "{}"
        );

        setMostrarMembros(Boolean(secoesSalvas.mostrarMembros));
        setMostrarFuncoes(Boolean(secoesSalvas.mostrarFuncoes));
        setMostrarEscala(Boolean(secoesSalvas.mostrarEscala));
        setMostrarAvisos(Boolean(secoesSalvas.mostrarAvisos));
        setMostrarRestricoes(Boolean(secoesSalvas.mostrarRestricoes));
      } catch {
        // Se o valor salvo estiver inválido, as seções começam fechadas.
      }

      setSecoesCarregadas(true);
      setPronto(true);

      void carregarUsuarios();
      void carregarSolicitacoes();
      void carregarRestricoes();
    } catch (error) {
      console.error("Não foi possível ler os dados salvos do usuário:", error);
      localStorage.removeItem("usuario");
      router.replace("/login");
    }
  }, [router, carregarRestricoes, carregarEscalaAdmin]);

  useEffect(() => {
    if (!secoesCarregadas) return;

    localStorage.setItem(
      ADMIN_SECOES_KEY,
      JSON.stringify({
        mostrarMembros,
        mostrarFuncoes,
        mostrarEscala,
        mostrarAvisos,
        mostrarRestricoes,
      })
    );
  }, [
    secoesCarregadas,
    mostrarMembros,
    mostrarFuncoes,
    mostrarEscala,
    mostrarAvisos,
    mostrarRestricoes,
  ]);

  useEffect(() => {
    if (!pronto) return;

    localStorage.setItem("escala", JSON.stringify(escala));
  }, [pronto, escala]);

  const sair = () => {
    localStorage.removeItem("usuario");
    router.push("/login");
  };

  // ---------- Solicitações ----------

  const aprovarSolicitacao = async (indice: number) => {
    const solicitacao = solicitacoes[indice];
    if (!solicitacao) return;

    const { error: erroInserir } = await supabase.from("usuarios").insert({
      nome: solicitacao.nome,
      sobrenome: solicitacao.sobrenome,
      atribuicoes: solicitacao.atribuicoes,
      senha: solicitacao.senha,
    });

    if (erroInserir) {
      mostrarAviso(`Não foi possível aprovar: ${erroInserir.message}`);
      return;
    }

    const { error: erroRemover } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", solicitacao.id);

    if (erroRemover) {
      mostrarAviso(
        `Não foi possível remover a solicitação: ${erroRemover.message}`
      );
      return;
    }

    mostrarAviso("Cadastro aprovado.");
    await Promise.all([carregarUsuarios(), carregarSolicitacoes()]);
  };

  const recusarSolicitacao = (indice: number) => {
    const solicitacao = solicitacoes[indice];
    if (!solicitacao) return;

    setConfirmacao({
      titulo: "Recusar cadastro",
      mensagem: `Recusar o cadastro de ${solicitacao.nome} ${solicitacao.sobrenome}?`,
      aoConfirmar: () => {
        void removerSolicitacao(solicitacao);
      },
    });
  };

  const removerSolicitacao = async (solicitacao: Solicitacao) => {
    const { error } = await supabase
      .from("solicitacoes")
      .delete()
      .eq("id", solicitacao.id);

    if (error) {
      mostrarAviso(`Não foi possível recusar: ${error.message}`);
      return;
    }

    mostrarAviso("Solicitação recusada.");
    await carregarSolicitacoes();
  };

  // ---------- Membros ----------

  const fecharModal = () => {
    setModalAberto(false);
    setMembroEditando(null);
    setNome("");
    setSobrenome("");
    setAtribuicoes([]);
  };

  const alternarFuncao = (funcao: string) => {
    setAtribuicoes((atuais) =>
      atuais.includes(funcao)
        ? atuais.filter((f) => f !== funcao)
        : [...atuais, funcao]
    );
  };

  const adicionarMembro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (membroEditando === null) {
      const { error } = await supabase.from("usuarios").insert({
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        atribuicoes,
      });

      if (error) {
        mostrarAviso(`Não foi possível adicionar o membro: ${error.message}`);
        return;
      }

      mostrarAviso("Membro adicionado.");
    } else {
      const membro = usuarios[membroEditando];
      if (!membro) return;

      const { error } = await supabase
        .from("usuarios")
        .update({
          nome: nome.trim(),
          sobrenome: sobrenome.trim(),
          atribuicoes,
        })
        .eq("id", membro.id);

      if (error) {
        mostrarAviso(`Não foi possível salvar o membro: ${error.message}`);
        return;
      }

      mostrarAviso("Membro salvo.");
    }

    fecharModal();
    await carregarUsuarios();
  };

  const editarMembro = (indice: number) => {
    const membro = usuarios[indice];
    if (!membro) return;

    setMembroEditando(indice);
    setNome(membro.nome);
    setSobrenome(membro.sobrenome);
    setAtribuicoes(membro.atribuicoes ?? []);
    setModalAberto(true);
  };

  const apagarMembro = (indice: number) => {
    const membro = usuarios[indice];
    if (!membro) return;

    setConfirmacao({
      titulo: "Apagar membro",
      mensagem: `Apagar ${membro.nome} ${membro.sobrenome}?`,
      aoConfirmar: () => {
        void removerMembro(membro);
      },
    });
  };

  const removerMembro = async (membro: Usuario) => {
    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", membro.id);

    if (error) {
      mostrarAviso(`Não foi possível apagar o membro: ${error.message}`);
      return;
    }

    mostrarAviso("Membro apagado.");
    await carregarUsuarios();
  };

  // ---------- Funções ----------

  const fecharModalFuncao = () => {
    setModalFuncaoAberto(false);
    setNovaFuncao("");
    setMembrosEscolhidos([]);
    setErroFuncao("");
  };

  const alternarMembroEscolhido = (indice: number) => {
    setMembrosEscolhidos((atuais) =>
      atuais.includes(indice)
        ? atuais.filter((i) => i !== indice)
        : [...atuais, indice]
    );
  };

  const adicionarFuncao = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nomeLimpo = novaFuncao.trim();

    if (!nomeLimpo) {
      setErroFuncao("Digite o nome da função.");
      return;
    }

    const jaExiste = funcoes.some(
      (f) =>
        f.toLocaleLowerCase("pt-BR") ===
        nomeLimpo.toLocaleLowerCase("pt-BR")
    );

    if (jaExiste) {
      setErroFuncao("Essa função já existe.");
      return;
    }

    const novasFuncoes = [...funcoes, nomeLimpo];
    setFuncoes(novasFuncoes);
    localStorage.setItem("funcoes", JSON.stringify(novasFuncoes));

    for (const indice of membrosEscolhidos) {
      const membro = usuarios[indice];
      if (!membro) continue;

      const { error } = await supabase
        .from("usuarios")
        .update({
          atribuicoes: [...(membro.atribuicoes ?? []), nomeLimpo],
        })
        .eq("id", membro.id);

      if (error) {
        mostrarAviso(
          `Não foi possível atribuir a função a ${membro.nome}: ${error.message}`
        );
      }
    }

    mostrarAviso("Função adicionada.");
    fecharModalFuncao();
    await carregarUsuarios();
  };

  // ---------- Restrições ----------

  const fecharModalRestricao = () => {
    setModalRestricaoAberto(false);
    setMembroRestricao("");
    setDataRestricao("");
    setPeriodoRestricao("manha");
    setErroRestricao("");
  };

  const adicionarRestricao = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const membro = usuarios.find((u) => u.id === membroRestricao);

    if (!membro) {
      setErroRestricao("Escolha um membro.");
      return;
    }

    if (!dataRestricao) {
      setErroRestricao("Escolha a data.");
      return;
    }

    const { error } = await supabase.from("restricoes").insert({
      nome: membro.nome,
      sobrenome: membro.sobrenome,
      data: dataRestricao,
      motivo: null,
      periodo: periodoRestricao,
    });

    if (error) {
      console.error("Erro ao salvar restrição:", error.message);
      setErroRestricao(`Não foi possível salvar: ${error.message}`);
      return;
    }

    fecharModalRestricao();
    await carregarRestricoes();
  };

  const iniciarEdicaoRestricao = (indice: number) => {
    const restricao = restricoes[indice];
    if (!restricao) return;

    setRestricaoEditando(indice);
    setDataEdicaoRestricao(restricao.data);
    setPeriodoEdicaoRestricao(restricao.periodo ?? "");
    setErroEdicaoRestricao("");
  };

  const cancelarEdicaoRestricao = () => {
    setRestricaoEditando(null);
    setDataEdicaoRestricao("");
    setPeriodoEdicaoRestricao("");
    setErroEdicaoRestricao("");
  };

  const salvarEdicaoRestricao = async () => {
    if (restricaoEditando === null) return;

    const restricao = restricoes[restricaoEditando];
    if (!restricao) return;

    if (!dataEdicaoRestricao) {
      setErroEdicaoRestricao("Escolha a data.");
      return;
    }

    const { error } = await supabase
      .from("restricoes")
      .update({
        data: dataEdicaoRestricao,
        periodo:
          periodoEdicaoRestricao === "" ? null : periodoEdicaoRestricao,
      })
      .eq("id", restricao.id);

    if (error) {
      console.error("Erro ao atualizar restrição:", error.message);
      setErroEdicaoRestricao(`Não foi possível salvar: ${error.message}`);
      return;
    }

    cancelarEdicaoRestricao();
    await carregarRestricoes();
  };

  const apagarRestricao = (indice: number) => {
    const restricao = restricoes[indice];
    if (!restricao) return;

    setConfirmacao({
      titulo: "Apagar restrição",
      mensagem: `Apagar a restrição de ${restricao.nome} ${restricao.sobrenome} em ${formatarData(restricao.data)}?`,
      aoConfirmar: () => {
        void removerRestricao(restricao);
      },
    });
  };

  const removerRestricao = async (restricao: Restricao) => {
    const { error } = await supabase
      .from("restricoes")
      .delete()
      .eq("id", restricao.id);

    if (error) {
      mostrarAviso(`Não foi possível apagar a restrição: ${error.message}`);
      return;
    }

    mostrarAviso("Restrição apagada.");
    await carregarRestricoes();
  };

  // ---------- Escala ----------

  const fecharModalEscala = () => {
    setModalEscalaAberto(false);
    setMesSelecionado("");
    setAnoSelecionado(String(new Date().getFullYear()).slice(2));
    setErroEscala("");
  };

  const gerarEscala = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const mesLimpo = mesSelecionado.trim();
    const mes = Number(mesLimpo);

    if (!/^\d{1,2}$/.test(mesLimpo) || mes < 1 || mes > 12) {
      setErroEscala("Digite o mês em número de 1 a 12.");
      return;
    }

    const anoLimpo = anoSelecionado.trim();

    if (!/^\d{2}$/.test(anoLimpo)) {
      setErroEscala("Digite o ano com 2 dígitos (ex: 26).");
      return;
    }

    const ano = 2000 + Number(anoLimpo);

    const ultimoDia = new Date(ano, mes, 0).getDate();
    const domingos: string[] = [];

    for (let dia = 1; dia <= ultimoDia; dia += 1) {
      const d = new Date(ano, mes - 1, dia);

      if (d.getDay() === 0) {
        domingos.push(
          `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
        );
      }
    }

    if (domingos.length === 0) {
      setErroEscala("Nenhum domingo nesse mês.");
      return;
    }

    const novaEscala: DiaEscala[] = domingos.map((data) => {
      const escolhidos: Record<"manha" | "tarde", string[]> = {
        manha: [],
        tarde: [],
      };

      const sortear = (funcao: string, periodo: "manha" | "tarde") => {
        const disponiveis = usuarios.filter((u) => {
          if (!(u.atribuicoes ?? []).includes(funcao)) return false;

          if (temRestricao(u, data, periodo, restricoes)) return false;

          if (
            FUNCOES_ENSAIO_SABADO.includes(funcao) &&
            temRestricaoSabado(u, data, restricoes)
          ) {
            return false;
          }

          return !escolhidos[periodo].includes(
            `${u.nome} ${u.sobrenome}`.trim()
          );
        });

        if (disponiveis.length === 0) return null;

        const escolhido =
          disponiveis[Math.floor(Math.random() * disponiveis.length)];

        const nomeEscolhido =
          `${escolhido.nome} ${escolhido.sobrenome}`.trim();

        escolhidos[periodo].push(nomeEscolhido);
        return nomeEscolhido;
      };

      const itens: ItemEscala[] = [
        // Manhã e noite: apenas Holyrics e Som
        ...FUNCOES_ESCALA.map((funcao) => ({
          funcao,
          manha: sortear(funcao, "manha"),
          tarde: sortear(funcao, "tarde"),
        })),

        // Noite: todas as outras funções também
        ...funcoes
          .filter((funcao) => !FUNCOES_ESCALA.includes(funcao))
          .map((funcao) => ({
            funcao,
            manha: null,
            tarde: sortear(funcao, "tarde"),
          })),
      ];

      return { data, itens };
    });

    setEscala(novaEscala);
    localStorage.setItem("escala", JSON.stringify(novaEscala));
    fecharModalEscala();
    setMostrarEscala(true);
  };

  const publicarEscala = async () => {
    if (escala.length === 0) {
      mostrarAviso("Gere a escala antes de publicar.");
      return;
    }

    const datas = escala.map((dia) => dia.data);
    const primeira = datas[0];
    const ultima = datas[datas.length - 1];

    const { error: erroRemover } = await supabase
      .from("escalas")
      .delete()
      .gte("data", primeira)
      .lte("data", ultima)
      .not("data", "in", `(${datas.map((d) => `"${d}"`).join(",")})`);

    if (erroRemover) {
      console.error("Erro ao atualizar escala:", erroRemover);
      mostrarAviso(`Não foi possível atualizar a escala: ${erroRemover.message}`);
      return;
    }

    const { error: erroPublicar } = await supabase
      .from("escalas")
      .upsert(
        escala.map((dia) => ({
          data: dia.data,
          itens: dia.itens,
        })),
        { onConflict: "data" }
      );

    if (erroPublicar) {
      console.error("Erro ao publicar escala:", erroPublicar);
      mostrarAviso(`Não foi possível publicar a escala: ${erroPublicar.message}`);
      return;
    }

    mostrarAviso("Escala publicada! Todos já conseguem ver na página inicial.");
  };

  const apagarEscala = () => {
    setConfirmacao({
      titulo: "Apagar escala",
      mensagem:
        "Apagar TODA a escala? Isso remove também a escala publicada para o time.",
      aoConfirmar: () => {
        void removerEscala();
      },
    });
  };

  const removerEscala = async () => {
    const { error } = await supabase
      .from("escalas")
      .delete()
      .gte("data", "0001-01-01");

    if (error) {
      console.error("Erro ao apagar escala:", error);
      mostrarAviso(`Não foi possível apagar a escala: ${error.message}`);
      return;
    }

    setEscala([]);
    setEditando(null);
    setTextoEdicao("");
    localStorage.setItem("escala", "[]");
    mostrarAviso("Escala apagada.");
  };

  const salvarEdicaoCelula = (
    dia: DiaEscala,
    item: ItemEscala,
    periodo: "manha" | "tarde"
  ) => {
    const novoValor = textoEdicao.trim();

    setEscala((atual) =>
      atual.map((d) =>
        d.data !== dia.data
          ? d
          : {
              ...d,
              itens: d.itens.map((i) =>
                i.funcao !== item.funcao
                  ? i
                  : { ...i, [periodo]: novoValor === "" ? null : novoValor }
              ),
            }
      )
    );

    setEditando(null);
    setTextoEdicao("");
  };

  const celulaEscala = (
    dia: DiaEscala,
    item: ItemEscala,
    periodo: "manha" | "tarde"
  ) => {
    const chave = `${dia.data}|${item.funcao}|${periodo}`;
    const valor = periodo === "manha" ? item.manha : item.tarde;

    if (editando === chave) {
      return (
        <p className="escala-publica-item" key={chave}>
          <strong>{item.funcao}:</strong>{" "}
          <input
            type="text"
            className="login-campo"
            value={textoEdicao}
            onChange={(e) => setTextoEdicao(e.target.value)}
            style={{ width: 160, display: "inline-block" }}
          />{" "}
          <button
            type="button"
            className="admin-botao-editar"
            onClick={() => salvarEdicaoCelula(dia, item, periodo)}
          >
            Salvar
          </button>{" "}
          <button
            type="button"
            className="admin-botao-apagar"
            onClick={() => {
              setEditando(null);
              setTextoEdicao("");
            }}
          >
            Cancelar
          </button>
        </p>
      );
    }

    return (
      <p className="escala-publica-item" key={chave}>
        <strong>{item.funcao}:</strong>{" "}
        {valor ? (
          <button
            type="button"
            onClick={() => {
              setEditando(chave);
              setTextoEdicao(valor);
            }}
            title="Clique para editar"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {valor}
          </button>
        ) : (
          <span>—</span>
        )}
      </p>
    );
  };

  const escalaOrdenada = [...escala].sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  if (!pronto) return null;

  const hoje = new Date();
  const hojeISO = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const restricoesFuturas = [...restricoes]
    .filter((r) => r.data >= hojeISO)
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="inicio-pagina">
      <header className="inicio-cabecalho">
        <Link
          href="/inicio"
          className="inicio-logo-link"
          title="Voltar ao início"
        >
          <img
            src="/logo.jpg"
            alt="Comunicação IBR JG"
            className="inicio-logo"
          />
        </Link>

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
              mostrarRestricoes ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarRestricoes((v) => !v)}
          >
            Restrições
          </button>

          <button
            type="button"
            className={`admin-botao-menu ${
              mostrarEscala ? "admin-botao-menu-ativo" : ""
            }`}
            onClick={() => setMostrarEscala((v) => !v)}
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
        <h1 className="inicio-titulo">Painel do Admin</h1>

        <p className="inicio-subtitulo">
          Gerencie membros, funções, escala e restrições do time.
        </p>

        {mostrarMembros && (
          <section className="inicio-cartao">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 className="inicio-cartao-titulo">Membros</h3>

              <button
                type="button"
                className="admin-botao-editar"
                onClick={() => {
                  setMembroEditando(null);
                  setNome("");
                  setSobrenome("");
                  setAtribuicoes([]);
                  setModalAberto(true);
                }}
              >
                Novo membro
              </button>
            </div>

            {erroMembros ? (
              <p className="inicio-texto-suave">{erroMembros}</p>
            ) : usuarios.length === 0 ? (
              <p className="inicio-texto-suave">Nenhum membro cadastrado.</p>
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
                  {usuarios.map((membro, indice) => (
                    <tr key={membro.id}>
                      <td>
                        {membro.nome} {membro.sobrenome}
                      </td>

                      <td>
                        {membro.atribuicoes?.length > 0
                          ? membro.atribuicoes.join(", ")
                          : "—"}
                      </td>

                      <td>
                        <div className="admin-acoes">
                          <button
                            type="button"
                            className="admin-botao-editar"
                            onClick={() => editarMembro(indice)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="admin-botao-apagar"
                            onClick={() => apagarMembro(indice)}
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
          <section className="inicio-cartao">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 className="inicio-cartao-titulo">Funções</h3>

              <button
                type="button"
                className="admin-botao-editar"
                onClick={() => setModalFuncaoAberto(true)}
              >
                Nova função
              </button>
            </div>

            {funcoes.length === 0 ? (
              <p className="inicio-texto-suave">Nenhuma função cadastrada.</p>
            ) : (
              <table className="admin-tabela">
                <thead>
                  <tr>
                    <th>Função</th>
                    <th>Membros</th>
                  </tr>
                </thead>

                <tbody>
                  {funcoes.map((funcao) => (
                    <tr key={funcao}>
                      <td>{funcao}</td>
                      <td>
                        {
                          usuarios.filter((u) =>
                            (u.atribuicoes ?? []).includes(funcao)
                          ).length
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {mostrarEscala && (
          <section className="inicio-cartao escala-publica">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 className="inicio-cartao-titulo">Escala</h3>

              <div className="admin-acoes">
                <button
                  type="button"
                  className="admin-botao-editar"
                  onClick={() => setModalEscalaAberto(true)}
                >
                  Gerar escala
                </button>

                <button
                  type="button"
                  className="admin-botao-apagar"
                  onClick={apagarEscala}
                  disabled={escala.length === 0}
                >
                  Apagar escala
                </button>

                <button
                  type="button"
                  className="login-botao"
                  onClick={() => void publicarEscala()}
                  disabled={escala.length === 0}
                >
                  Publicar
                </button>
              </div>
            </div>

            <p className="inicio-texto-suave">
              A escala só aparece para o time depois de clicar em Publicar.
              Clique no nome de uma pessoa para editar antes de publicar.
            </p>

            {escalaOrdenada.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhuma escala gerada ainda.
              </p>
            ) : (
              escalaOrdenada.map((dia) => (
                <div className="escala-publica-dia" key={dia.data}>
                  <div className="escala-publica-data">
                    <span className="escala-publica-calendario">📅</span>

                    <span>
                      {formatarData(dia.data)}
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

                      {dia.itens
                        .filter((item) =>
                          FUNCOES_ESCALA.includes(item.funcao)
                        )
                        .map((item) =>
                          celulaEscala(dia, item, "manha")
                        )}
                    </div>

                    <div className="escala-publica-turno">
                      <h4 className="escala-publica-turno-titulo">
                        Noite -
                      </h4>

                      {dia.itens.map((item) =>
                        celulaEscala(dia, item, "tarde")
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {mostrarAvisos && (
          <section className="inicio-cartao">
            <h3 className="inicio-cartao-titulo">Avisos</h3>

            <h4 style={{ margin: "12px 0 4px" }}>
              Solicitações de cadastro
            </h4>

            {erroSolicitacoes ? (
              <p className="inicio-texto-suave">{erroSolicitacoes}</p>
            ) : solicitacoes.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhuma solicitação pendente.
              </p>
            ) : (
              solicitacoes.map((solicitacao, indice) => (
                <div key={solicitacao.id} style={{ margin: "8px 0" }}>
                  <p style={{ margin: "4px 0" }}>
                    {solicitacao.nome} {solicitacao.sobrenome} —{" "}
                    {solicitacao.atribuicoes?.length > 0
                      ? solicitacao.atribuicoes.join(", ")
                      : "sem funções"}
                  </p>

                  <div className="admin-acoes">
                    <button
                      type="button"
                      className="admin-botao-editar"
                      onClick={() => void aprovarSolicitacao(indice)}
                    >
                      Aprovar
                    </button>

                    <button
                      type="button"
                      className="admin-botao-apagar"
                      onClick={() => recusarSolicitacao(indice)}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {mostrarRestricoes && (
          <section className="inicio-cartao">
            <h3 className="inicio-cartao-titulo">Restrições</h3>

            {restricoes.length === 0 ? (
              <p className="inicio-texto-suave">
                Nenhuma restrição registrada.
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
                  {restricoes.map((restricao, indice) => {
                    const emEdicao = restricaoEditando === indice;

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
                              value={dataEdicaoRestricao}
                              onChange={(e) => {
                                setDataEdicaoRestricao(e.target.value);
                                setErroEdicaoRestricao("");
                              }}
                            />
                          ) : (
                            formatarData(restricao.data)
                          )}
                        </td>

                        <td>
                          {emEdicao ? (
                            <select
                              className="login-campo"
                              value={periodoEdicaoRestricao}
                              onChange={(e) =>
                                setPeriodoEdicaoRestricao(
                                  e.target.value as "manha" | "tarde" | ""
                                )
                              }
                            >
                              <option value="">Dia inteiro</option>
                              <option value="manha">Manhã</option>
                              <option value="tarde">Tarde</option>
                            </select>
                          ) : (
                            nomePeriodo(restricao.periodo)
                          )}
                        </td>

                        <td>{restricao.motivo || "-"}</td>

                        <td>
                          {emEdicao ? (
                            <div className="admin-acoes">
                              <button
                                type="button"
                                className="admin-botao-editar"
                                onClick={() => void salvarEdicaoRestricao()}
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
                            </div>
                          ) : (
                            <div className="admin-acoes">
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
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {erroEdicaoRestricao && (
              <p className="login-erro" role="alert">
                {erroEdicaoRestricao}
              </p>
            )}
          </section>
        )}
      </main>

      {mostrarRestricoes && (
        <button
          type="button"
          className="admin-botao-flutuante"
          onClick={() => setModalRestricaoAberto(true)}
          aria-label="Adicionar restrição"
          title="Adicionar restrição"
        >
          +
        </button>
      )}

      {modalRestricaoAberto && (
        <div className="admin-modal-fundo" onClick={fecharModalRestricao}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">Nova restrição</h2>

            <form onSubmit={adicionarRestricao} className="login-formulario">
              <div>
                <label htmlFor="membro-restricao" className="login-rotulo">
                  Membro
                </label>

                <select
                  id="membro-restricao"
                  required
                  value={membroRestricao}
                  onChange={(e) => {
                    setMembroRestricao(e.target.value);
                    setErroRestricao("");
                  }}
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  <option value="">Escolha o membro</option>

                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} {u.sobrenome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="data-restricao" className="login-rotulo">
                  Data
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
                <label className="login-rotulo">
                  Atribuições / Funções:
                </label>

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
                <label htmlFor="mes-escala" className="login-rotulo">
                  Mês (1 a 12)
                </label>

                <input
                  id="mes-escala"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={2}
                  value={mesSelecionado}
                  onChange={(e) => {
                    setMesSelecionado(e.target.value.replace(/\D/g, ""));
                    setErroEscala("");
                  }}
                  placeholder="Ex: 6"
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label htmlFor="ano-escala" className="login-rotulo">
                  Ano
                </label>

                <input
                  id="ano-escala"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={2}
                  value={anoSelecionado}
                  onChange={(e) => {
                    setAnoSelecionado(e.target.value.replace(/\D/g, ""));
                    setErroEscala("");
                  }}
                  placeholder="Ex: 26"
                  className="login-campo"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <p className="login-link">
                A escala é criada para todos os domingos do mês. Na manhã
                entram apenas Projeção (Holyrics) e Áudio (Som); na noite
                entram todas as funções. Quem tiver restrição não é escalado
                no período indicado. Restrições antigas sem período bloqueiam
                o dia inteiro. Quem tiver restrição no sábado anterior não
                será escalado para Som ou Holyrics no domingo seguinte. Se
                esse mês já tiver escala, ela será substituída.
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

      {confirmacao && (
        <div
          className="admin-modal-fundo"
          onClick={() => setConfirmacao(null)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-titulo">{confirmacao.titulo}</h2>

            <p
              style={{
                margin: "0 0 16px",
                color: "var(--cor-texto-suave)",
                fontSize: 15,
              }}
            >
              {confirmacao.mensagem}
            </p>

            <div className="admin-modal-acoes">
              <button
                type="button"
                className="admin-modal-cancelar"
                onClick={() => setConfirmacao(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="admin-botao-apagar"
                onClick={() => {
                  const acao = confirmacao.aoConfirmar;
                  setConfirmacao(null);
                  acao();
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
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