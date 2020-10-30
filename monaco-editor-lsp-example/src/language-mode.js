export default {
  keywords: [
    'if', 'elsif', 'else', 'do', 'end', 'map'
  ],
  operators: [
    '='
  ],
  symbols: /=/,
  digits: /\d+(_+\d+)*/,
  tokenizer: {
    common: [
      [/[A-Za-z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': ''
        }
      }],
      {
        include: '@whitespace'
      },
      [/@symbols/, {
        cases: {
          '@operators': 'delimiter',
          '@default': ''
        }
      }],
      [/(@digits)/, 'number'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, '']
    ],
  }
};
