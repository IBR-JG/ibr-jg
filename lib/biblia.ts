export type Testamento = "AT" | "NT";

export type LivroBiblia = {
  numero: number;
  abreviacao: string;
  nome: string;
  capitulos: number;
  testamento: Testamento;
  grupo: string;
};

export const coresGrupos: Record<string, string> = {
  Pentateuco: "#8a5a2b",
  Históricos: "#c8791f",
  Poéticos: "#c9a227",
  "Profetas maiores": "#a83232",
  "Profetas menores": "#7d3c98",
  Evangelhos: "#1f7a8c",
  História: "#2e7d5b",
  Cartas: "#2f7d32",
  Apocalipse: "#7cb342",
};

export const livros: LivroBiblia[] = [
  { numero: 1, abreviacao: "Gn", nome: "Gênesis", capitulos: 50, testamento: "AT", grupo: "Pentateuco" },
  { numero: 2, abreviacao: "Êx", nome: "Êxodo", capitulos: 40, testamento: "AT", grupo: "Pentateuco" },
  { numero: 3, abreviacao: "Lv", nome: "Levítico", capitulos: 27, testamento: "AT", grupo: "Pentateuco" },
  { numero: 4, abreviacao: "Nm", nome: "Números", capitulos: 36, testamento: "AT", grupo: "Pentateuco" },
  { numero: 5, abreviacao: "Dt", nome: "Deuteronômio", capitulos: 34, testamento: "AT", grupo: "Pentateuco" },
  { numero: 6, abreviacao: "Js", nome: "Josué", capitulos: 24, testamento: "AT", grupo: "Históricos" },
  { numero: 7, abreviacao: "Jz", nome: "Juízes", capitulos: 21, testamento: "AT", grupo: "Históricos" },
  { numero: 8, abreviacao: "Rt", nome: "Rute", capitulos: 4, testamento: "AT", grupo: "Históricos" },
  { numero: 9, abreviacao: "1Sm", nome: "1 Samuel", capitulos: 31, testamento: "AT", grupo: "Históricos" },
  { numero: 10, abreviacao: "2Sm", nome: "2 Samuel", capitulos: 24, testamento: "AT", grupo: "Históricos" },
  { numero: 11, abreviacao: "1Rs", nome: "1 Reis", capitulos: 22, testamento: "AT", grupo: "Históricos" },
  { numero: 12, abreviacao: "2Rs", nome: "2 Reis", capitulos: 25, testamento: "AT", grupo: "Históricos" },
  { numero: 13, abreviacao: "1Cr", nome: "1 Crônicas", capitulos: 29, testamento: "AT", grupo: "Históricos" },
  { numero: 14, abreviacao: "2Cr", nome: "2 Crônicas", capitulos: 36, testamento: "AT", grupo: "Históricos" },
  { numero: 15, abreviacao: "Ed", nome: "Esdras", capitulos: 10, testamento: "AT", grupo: "Históricos" },
  { numero: 16, abreviacao: "Ne", nome: "Neemias", capitulos: 13, testamento: "AT", grupo: "Históricos" },
  { numero: 17, abreviacao: "Et", nome: "Ester", capitulos: 10, testamento: "AT", grupo: "Históricos" },
  { numero: 18, abreviacao: "Jó", nome: "Jó", capitulos: 42, testamento: "AT", grupo: "Poéticos" },
  { numero: 19, abreviacao: "Sl", nome: "Salmos", capitulos: 150, testamento: "AT", grupo: "Poéticos" },
  { numero: 20, abreviacao: "Pv", nome: "Provérbios", capitulos: 31, testamento: "AT", grupo: "Poéticos" },
  { numero: 21, abreviacao: "Ec", nome: "Eclesiastes", capitulos: 12, testamento: "AT", grupo: "Poéticos" },
  { numero: 22, abreviacao: "Ct", nome: "Cânticos", capitulos: 8, testamento: "AT", grupo: "Poéticos" },
  { numero: 23, abreviacao: "Is", nome: "Isaías", capitulos: 66, testamento: "AT", grupo: "Profetas maiores" },
  { numero: 24, abreviacao: "Jr", nome: "Jeremias", capitulos: 52, testamento: "AT", grupo: "Profetas maiores" },
  { numero: 25, abreviacao: "Lm", nome: "Lamentações", capitulos: 5, testamento: "AT", grupo: "Profetas maiores" },
  { numero: 26, abreviacao: "Ez", nome: "Ezequiel", capitulos: 48, testamento: "AT", grupo: "Profetas maiores" },
  { numero: 27, abreviacao: "Dn", nome: "Daniel", capitulos: 12, testamento: "AT", grupo: "Profetas maiores" },
  { numero: 28, abreviacao: "Os", nome: "Oseias", capitulos: 14, testamento: "AT", grupo: "Profetas menores" },
  { numero: 29, abreviacao: "Jl", nome: "Joel", capitulos: 3, testamento: "AT", grupo: "Profetas menores" },
  { numero: 30, abreviacao: "Am", nome: "Amós", capitulos: 9, testamento: "AT", grupo: "Profetas menores" },
  { numero: 31, abreviacao: "Ob", nome: "Obadias", capitulos: 1, testamento: "AT", grupo: "Profetas menores" },
  { numero: 32, abreviacao: "Jn", nome: "Jonas", capitulos: 4, testamento: "AT", grupo: "Profetas menores" },
  { numero: 33, abreviacao: "Mq", nome: "Miqueias", capitulos: 7, testamento: "AT", grupo: "Profetas menores" },
  { numero: 34, abreviacao: "Na", nome: "Naum", capitulos: 3, testamento: "AT", grupo: "Profetas menores" },
  { numero: 35, abreviacao: "Hc", nome: "Habacuque", capitulos: 3, testamento: "AT", grupo: "Profetas menores" },
  { numero: 36, abreviacao: "Sf", nome: "Sofonias", capitulos: 3, testamento: "AT", grupo: "Profetas menores" },
  { numero: 37, abreviacao: "Ag", nome: "Ageu", capitulos: 2, testamento: "AT", grupo: "Profetas menores" },
  { numero: 38, abreviacao: "Zc", nome: "Zacarias", capitulos: 14, testamento: "AT", grupo: "Profetas menores" },
  { numero: 39, abreviacao: "Ml", nome: "Malaquias", capitulos: 4, testamento: "AT", grupo: "Profetas menores" },
  { numero: 40, abreviacao: "Mt", nome: "Mateus", capitulos: 28, testamento: "NT", grupo: "Evangelhos" },
  { numero: 41, abreviacao: "Mc", nome: "Marcos", capitulos: 16, testamento: "NT", grupo: "Evangelhos" },
  { numero: 42, abreviacao: "Lc", nome: "Lucas", capitulos: 24, testamento: "NT", grupo: "Evangelhos" },
  { numero: 43, abreviacao: "Jo", nome: "João", capitulos: 21, testamento: "NT", grupo: "Evangelhos" },
  { numero: 44, abreviacao: "At", nome: "Atos", capitulos: 28, testamento: "NT", grupo: "História" },
  { numero: 45, abreviacao: "Rm", nome: "Romanos", capitulos: 16, testamento: "NT", grupo: "Cartas" },
  { numero: 46, abreviacao: "1Co", nome: "1 Coríntios", capitulos: 16, testamento: "NT", grupo: "Cartas" },
  { numero: 47, abreviacao: "2Co", nome: "2 Coríntios", capitulos: 13, testamento: "NT", grupo: "Cartas" },
  { numero: 48, abreviacao: "Gl", nome: "Gálatas", capitulos: 6, testamento: "NT", grupo: "Cartas" },
  { numero: 49, abreviacao: "Ef", nome: "Efésios", capitulos: 6, testamento: "NT", grupo: "Cartas" },
  { numero: 50, abreviacao: "Fp", nome: "Filipenses", capitulos: 4, testamento: "NT", grupo: "Cartas" },
  { numero: 51, abreviacao: "Cl", nome: "Colossenses", capitulos: 4, testamento: "NT", grupo: "Cartas" },
  { numero: 52, abreviacao: "1Ts", nome: "1 Tessalonicenses", capitulos: 5, testamento: "NT", grupo: "Cartas" },
  { numero: 53, abreviacao: "2Ts", nome: "2 Tessalonicenses", capitulos: 3, testamento: "NT", grupo: "Cartas" },
  { numero: 54, abreviacao: "1Tm", nome: "1 Timóteo", capitulos: 6, testamento: "NT", grupo: "Cartas" },
  { numero: 55, abreviacao: "2Tm", nome: "2 Timóteo", capitulos: 4, testamento: "NT", grupo: "Cartas" },
  { numero: 56, abreviacao: "Tt", nome: "Tito", capitulos: 3, testamento: "NT", grupo: "Cartas" },
  { numero: 57, abreviacao: "Fm", nome: "Filemom", capitulos: 1, testamento: "NT", grupo: "Cartas" },
  { numero: 58, abreviacao: "Hb", nome: "Hebreus", capitulos: 13, testamento: "NT", grupo: "Cartas" },
  { numero: 59, abreviacao: "Tg", nome: "Tiago", capitulos: 5, testamento: "NT", grupo: "Cartas" },
  { numero: 60, abreviacao: "1Pe", nome: "1 Pedro", capitulos: 5, testamento: "NT", grupo: "Cartas" },
  { numero: 61, abreviacao: "2Pe", nome: "2 Pedro", capitulos: 3, testamento: "NT", grupo: "Cartas" },
  { numero: 62, abreviacao: "1Jo", nome: "1 João", capitulos: 5, testamento: "NT", grupo: "Cartas" },
  { numero: 63, abreviacao: "2Jo", nome: "2 João", capitulos: 1, testamento: "NT", grupo: "Cartas" },
  { numero: 64, abreviacao: "3Jo", nome: "3 João", capitulos: 1, testamento: "NT", grupo: "Cartas" },
  { numero: 65, abreviacao: "Jd", nome: "Judas", capitulos: 1, testamento: "NT", grupo: "Cartas" },
  { numero: 66, abreviacao: "Ap", nome: "Apocalipse", capitulos: 22, testamento: "NT", grupo: "Apocalipse" },
];

export const livrosDoTestamento = (testamento: Testamento) =>
  livros.filter((livro) => livro.testamento === testamento);

export const livroPorNome = (nome: string) => {
  const alvo = nome.trim().toLocaleLowerCase("pt-BR");

  return (
    livros.find(
      (livro) =>
        livro.nome.toLocaleLowerCase("pt-BR") === alvo ||
        livro.abreviacao.toLocaleLowerCase("pt-BR") === alvo
    ) ?? null
  );
};

export const analisarReferencia = (referencia: string) => {
  const partes = referencia.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!partes) return null;

  const livro = livroPorNome(partes[1]);
  if (!livro) return null;

  return {
    livro: livro.nome,
    capitulo: Number(partes[2]),
    versiculo: partes[3] ? Number(partes[3]) : null,
  };
};

