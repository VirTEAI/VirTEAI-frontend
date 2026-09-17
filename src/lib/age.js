// Calcula idade a partir de "DD/MM/AAAA" — a data de nascimento é guardada
// como texto livre (mesmo formato do formulário de edição), então uma
// entrada fora do padrão simplesmente não mostra idade. Compartilhado entre
// Profile.jsx e ProfilePsicologo.jsx.
export function calcAge(birthDate) {
  if (!birthDate) return null;
  const [day, month, year] = birthDate.split('/').map(Number);
  if (!day || !month || !year) return null;
  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const alreadyHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!alreadyHadBirthdayThisYear) age -= 1;
  return age;
}
