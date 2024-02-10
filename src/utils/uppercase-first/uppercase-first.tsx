const uppercaseFirst = (inputString: string) => {
  if (inputString.length === 0) {
    return inputString; // Jika string kosong, tidak ada yang perlu diubah
  }

  // Mengonversi huruf pertama ke huruf kapital dan menggabungkannya dengan sisa string
  return inputString.charAt(0).toUpperCase() + inputString.slice(1);
};

export default uppercaseFirst;
