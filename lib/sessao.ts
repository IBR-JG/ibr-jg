export type Usuario = {
  nome: string;
  sobrenome: string;
  atribuicoes: string[];
};

const CHAVE = "usuario";

export const lerUsuario = (): Usuario | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const bruto = window.localStorage.getItem(CHAVE);

    if (!bruto) {
      return null;
    }

    const dados = JSON.parse(bruto) as Partial<Usuario>;

    if (!dados || typeof dados.nome !== "string" || !dados.nome.trim()) {
      window.localStorage.removeItem(CHAVE);
      return null;
    }

    return {
      nome: dados.nome,
      sobrenome: dados.sobrenome ?? "",
      atribuicoes: Array.isArray(dados.atribuicoes) ? dados.atribuicoes : [],
    };
  } catch {
    window.localStorage.removeItem(CHAVE);
    return null;
  }
};

export const salvarUsuario = (usuario: Usuario) => {
  window.localStorage.setItem(CHAVE, JSON.stringify(usuario));
};

export const limparUsuario = () => {
  window.localStorage.removeItem(CHAVE);
};