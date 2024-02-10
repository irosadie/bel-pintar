const createInitial = (name: string) => {
  const words: string[] = name.split(' ');
  const initialWord: string = words[0];
  const initials: string[] =
    words.length > 1
      ? words.slice(0, 2).map(word => word.charAt(0).toUpperCase())
      : [
          initialWord.charAt(0).toUpperCase(),
          initialWord.charAt(1).toLowerCase(),
        ];

  return initials.join('');
};

export default createInitial;
