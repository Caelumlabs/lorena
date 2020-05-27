/* eslint-disable no-multi-spaces */
'use strict'
const chevrotain = require('chevrotain')
const Lexer = chevrotain.Lexer
const createToken = chevrotain.createToken

// This is the vocabulary and it
// will be exported and used in the Parser definition.
const tokenVocabulary = {}

// createToken is used to create every TokenType
// The Lexer output will contain an array of token Objects created by metadata
const Identifier = createToken({ name: 'Identifier', pattern: /[a-zA-Z]\w*/ })

// We specify the "longer_alt" property to resolve keywords vs identifiers ambiguity.
const Create = createToken({
  name: 'Create',
  pattern: /CREATE/,
  longer_alt: Identifier
})
const Table = createToken({
  name: 'Table',
  pattern: /TABLE/,
  longer_alt: Identifier
})
const Text = createToken({
  name: 'Text',
  pattern: /TEXT/,
  longer_alt: Identifier
})
const Integer = createToken({
  name: 'Integer',
  pattern: /INTEGER/,
  longer_alt: Identifier
})
const Char = createToken({
  name: 'Char',
  pattern: /CHAR/,
  longer_alt: Identifier
})
const Boolean = createToken({
  name: 'Boolean',
  pattern: /BOOLEAN/,
  longer_alt: Identifier
})
const DateTime = createToken({
  name: 'DateTime',
  pattern: /DATETIME/,
  longer_alt: Identifier
})
const Default = createToken({
  name: 'Default',
  pattern: /DEFAULT/,
  longer_alt: Identifier
})
const Primary = createToken({
  name: 'Primary',
  pattern: /PRIMARY/,
  longer_alt: Identifier
})
const Key = createToken({
  name: 'Key',
  pattern: /KEY/,
  longer_alt: Identifier
})
const CurrentTime = createToken({
  name: 'CurrentTime',
  pattern: /CURRENT_TIMESTAMP/,
  longer_alt: Identifier
})
const AutoIncrement = createToken({
  name: 'AutoIncrement',
  pattern: /AUTOINCREMENT/,
  longer_alt: Identifier
})
const Null = createToken({
  name: 'Null',
  pattern: /NULL/,
  longer_alt: Identifier
})
const Not = createToken({
  name: 'Not',
  pattern: /NOT/,
  longer_alt: Identifier
})
const If = createToken({
  name: 'If',
  pattern: /IF/,
  longer_alt: Identifier
})
const Exists = createToken({
  name: 'Exists',
  pattern: /EXISTS/,
  longer_alt: Identifier
})

const Comma         = createToken({ name: 'Comma', pattern: /,/ })
const SemiColon     = createToken({ name: 'SemiColon', pattern: /;/ })
const Number        = createToken({ name: 'Number', pattern: /0|[1-9]\d*/ })
const LeftParen     = createToken({ name: 'LeftParen', pattern: /\(/ })
const RightParen    = createToken({ name: 'RightParen', pattern: /\)/ })
const Quote         = createToken({ name: 'Quote', pattern: /'/ })
const WhiteSpace    = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED
})

// The order of tokens is important
const allTokens = [
  WhiteSpace,
  // "keywords" appear before the Identifier
  Create,
  Table,
  Text,
  Integer,
  Char,
  Boolean,
  DateTime,
  Default,
  Primary,
  Key,
  AutoIncrement,
  Not,
  If,
  Exists,
  Null,
  CurrentTime,
  LeftParen,
  RightParen,
  Comma,
  Quote,
  SemiColon,
  // Identifier must appear after the keywords because all keywords are valid identifiers.
  Identifier,
  Number
]

const CreateTableLexer = new Lexer(allTokens)

allTokens.forEach((tokenType) => {
  tokenVocabulary[tokenType.name] = tokenType
})

module.exports = {
  tokenVocabulary: tokenVocabulary,

  lex: function (inputText) {
    const lexingResult = CreateTableLexer.tokenize(inputText)

    if (lexingResult.errors.length > 0) {
      throw Error('ERROR: Some lexing errors detected')
    }

    return lexingResult
  }
}
