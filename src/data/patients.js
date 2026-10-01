// Pacientes mockados — reaproveita avatares já usados em outras telas do
// projeto para não depender de novas URLs do Figma. Serve para demonstrar a
// troca de "Paciente Selecionado" antes de gerar um código de acesso.

const imgAvatar1 = 'https://www.figma.com/api/mcp/asset/bd8f1fad-f40d-4f16-bdeb-42b78e29960f.png';
const imgAvatar2 = 'https://www.figma.com/api/mcp/asset/87373dcf-8ea2-421f-a4f7-b397f86daa2a.png';
const imgAvatar3 = 'https://www.figma.com/api/mcp/asset/c0d9bce9-7097-450a-806f-d374e7b2c1e0.png';
const imgAvatar4 = 'https://www.figma.com/api/mcp/asset/7281e4f0-0dc9-46e6-a8cd-4761a5b04a53.png';

export const patients = [
  {
    id: 'murillo-fernandes',
    name: 'Murillo Fernandes',
    note: 'Tratamento de Hiperatividade relacionada a carros',
    avatar: imgAvatar1,
  },
  {
    id: 'henrique-de-ferraz',
    name: 'Henrique de Ferraz',
    note: 'Tratamento de Hiperatividade relacionada a carros',
    avatar: imgAvatar2,
  },
  {
    id: 'fabricia-santos',
    name: 'Fabricia Santos',
    note: 'Acompanhamento de rotina social',
    avatar: imgAvatar3,
  },
  {
    id: 'ana-beatriz-lima',
    name: 'Ana Beatriz Lima',
    note: 'Terapia de comunicação alternativa',
    avatar: imgAvatar4,
  },
];
