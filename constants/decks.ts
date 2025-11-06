import { Ajah, Card, MadnessCard, MentalStateCard } from '../types';

export const AJAH_COLORS: Record<Ajah, string> = {
  [Ajah.Azul]: 'bg-blue-600',
  [Ajah.Amarela]: 'bg-yellow-500',
  [Ajah.Branca]: 'bg-gray-200 text-black',
  [Ajah.Marrom]: 'bg-yellow-900',
  [Ajah.Cinzenta]: 'bg-gray-500',
  [Ajah.Verde]: 'bg-green-600',
  [Ajah.Vermelha]: 'bg-red-700',
  [Ajah.Negra]: 'bg-black text-white',
};

export const AJAH_DECKS: Record<Ajah, Card[]> = {
    [Ajah.Azul]: [
        { value: 5, ajah: Ajah.Azul }, { value: 5, ajah: Ajah.Azul },
        { value: 4, ajah: Ajah.Azul }, { value: 4, ajah: Ajah.Azul },
        { value: 3, ajah: Ajah.Azul }, { value: 3, ajah: Ajah.Azul },
        { value: 2, ajah: Ajah.Azul }, { value: 2, ajah: Ajah.Azul },
        { value: 6, ajah: Ajah.Azul },
    ],
    [Ajah.Amarela]: [
        { value: 2, ajah: Ajah.Amarela }, { value: 2, ajah: Ajah.Amarela },
        { value: 1, ajah: Ajah.Amarela }, { value: 1, ajah: Ajah.Amarela },
        { value: 0, ajah: Ajah.Amarela }, { value: 0, ajah: Ajah.Amarela },
        { value: 3, ajah: Ajah.Amarela }, { value: 3, ajah: Ajah.Amarela },
        { value: 4, ajah: Ajah.Amarela },
    ],
    [Ajah.Vermelha]: [
        { value: 9, ajah: Ajah.Vermelha }, { value: 9, ajah: Ajah.Vermelha },
        { value: 8, ajah: Ajah.Vermelha }, { value: 8, ajah: Ajah.Vermelha },
        { value: 7, ajah: Ajah.Vermelha }, { value: 7, ajah: Ajah.Vermelha },
        { value: 6, ajah: Ajah.Vermelha }, { value: 6, ajah: Ajah.Vermelha },
        { value: 5, ajah: Ajah.Vermelha },
    ],
    [Ajah.Verde]: [
        { value: 5, ajah: Ajah.Verde }, { value: 5, ajah: Ajah.Verde },
        { value: 6, ajah: Ajah.Verde }, { value: 6, ajah: Ajah.Verde },
        { value: 4, ajah: Ajah.Verde }, { value: 4, ajah: Ajah.Verde },
        { value: 7, ajah: Ajah.Verde }, { value: 7, ajah: Ajah.Verde },
        { value: 8, ajah: Ajah.Verde },
    ],
    [Ajah.Cinzenta]: [
        { value: 4, ajah: Ajah.Cinzenta }, { value: 4, ajah: Ajah.Cinzenta },
        { value: 5, ajah: Ajah.Cinzenta }, { value: 5, ajah: Ajah.Cinzenta },
        { value: 3, ajah: Ajah.Cinzenta }, { value: 3, ajah: Ajah.Cinzenta },
        { value: 6, ajah: Ajah.Cinzenta }, { value: 6, ajah: Ajah.Cinzenta },
        { value: 2, ajah: Ajah.Cinzenta },
    ],
    [Ajah.Negra]: [
        { value: 7, ajah: Ajah.Negra }, { value: 7, ajah: Ajah.Negra },
        { value: 6, ajah: Ajah.Negra }, { value: 6, ajah: Ajah.Negra },
        { value: 8, ajah: Ajah.Negra }, { value: 8, ajah: Ajah.Negra },
        { value: 5, ajah: Ajah.Negra }, { value: 5, ajah: Ajah.Negra },
        { value: 9, ajah: Ajah.Negra },
    ],
    [Ajah.Marrom]: [
        { value: 5, ajah: Ajah.Marrom }, { value: 5, ajah: Ajah.Marrom },
        { value: 4, ajah: Ajah.Marrom }, { value: 4, ajah: Ajah.Marrom },
        { value: 6, ajah: Ajah.Marrom }, { value: 6, ajah: Ajah.Marrom },
        { value: 7, ajah: Ajah.Marrom }, { value: 7, ajah: Ajah.Marrom },
        { value: 8, ajah: Ajah.Marrom },
    ],
    [Ajah.Branca]: [
        { value: 0, ajah: Ajah.Branca }, { value: 0, ajah: Ajah.Branca },
        { value: 2, ajah: Ajah.Branca }, { value: 2, ajah: Ajah.Branca },
        { value: 4, ajah: Ajah.Branca }, { value: 4, ajah: Ajah.Branca },
        { value: 6, ajah: Ajah.Branca }, { value: 6, ajah: Ajah.Branca },
        { value: 8, ajah: Ajah.Branca },
    ],
};


export const MADNESS_DECK_TEMPLATE: MadnessCard[] = [
    { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 }, { value: 7 },
    { value: 8 }, { value: 9 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }
];

export const MENTAL_STATE_DECK_TEMPLATE: MentalStateCard[] = [
    {
      id: "Hesitacao", level: 1,
      textoEfeito: "Nesta rodada, a primeira jogadora a ficar em 'Stand' deve descartar uma carta aleatória da mão.",
      idLogicaEfeito: "EFEITO_HESITACAO", textoAprimoramento: "", idLogicaAprimoramento: "APRIM_NENHUM",
      idLogicaCondicao: "COND_NENHUMA", idLogicaDano: "DANO_NENHUM"
    },
    {
      id: "Desconfianca", level: 2,
      textoEfeito: "Nesta rodada, as cartas reveladas pelas jogadoras são viradas para baixo e só são somadas no final da fase 2.",
      idLogicaEfeito: "EFEITO_DESCONFIANCA", textoAprimoramento: "Permanente: Ao comprar cartas, compre 1 a mais e descarte 1.",
      idLogicaAprimoramento: "APRIM_COMPRA_EXTRA", idLogicaCondicao: "COND_ALGUMA_AJAH_EM_STAND",
      idLogicaDano: "DANO_NENHUM"
    },
    {
      id: "MedoParalisante", level: 2,
      textoEfeito: "As Ajahs não podem avançar na Trilha da Chama nesta rodada.",
      idLogicaEfeito: "EFEITO_BLOQUEIA_CHAMA_RODADA", textoAprimoramento: "A Trilha da Chama retrocede 1 nível.",
      idLogicaAprimoramento: "APRIM_CHAMA_MENOS_1", idLogicaCondicao: "COND_CHAMA_LVL_3_MAIS",
      idLogicaDano: "DANO_PRIMEIRO_JOGADOR"
    },
     {
      id: "ParanoiaSeletiva", level: 2,
      textoEfeito: "A loucura de Rand foca em quem mais o ameaçou.",
      idLogicaEfeito: "EFEITO_NENHUM", textoAprimoramento: "",
      idLogicaAprimoramento: "APRIM_NENHUM", idLogicaCondicao: "COND_NENHUMA",
      idLogicaDano: "DANO_MAIOR_PONTUACAO"
    },
    {
      id: "DesesperoSufocante", level: 3,
      textoEfeito: "Rand ataca a Aes Sedai mais enfraquecida.",
      idLogicaEfeito: "EFEITO_NENHUM", textoAprimoramento: "",
      idLogicaAprimoramento: "APRIM_NENHUM", idLogicaCondicao: "COND_NENHUMA",
      idLogicaDano: "DANO_MENOR_VIDA"
    },
    // Add more cards to reach 100... for now, we'll repeat these to have a working deck
    ...Array(28).fill(null).flatMap(() => [
        {
            id: "FuriaCega", level: 3,
            textoEfeito: "O dano da Loucura é aumentado em 2 nesta rodada.",
            idLogicaEfeito: "EFEITO_FURIA", textoAprimoramento: "", idLogicaAprimoramento: "APRIM_NENHUM",
            idLogicaCondicao: "COND_NENHUMA", idLogicaDano: "DANO_TODOS_MAIS_1"
        },
        {
            id: "CalmaEnganosa", level: 1,
            textoEfeito: "Se nenhum jogador estourar a pontuação, Rand recupera 5 de Sanidade.",
            idLogicaEfeito: "EFEITO_CALMA", textoAprimoramento: "Permanente: O limite de 'estouro' agora é 10 ao invés de 9.",
            idLogicaAprimoramento: "APRIM_LIMITE_ESTOURO_10", idLogicaCondicao: "COND_NENHUM_ESTOURO",
            idLogicaDano: "DANO_NENHUM"
        },
    ])
];