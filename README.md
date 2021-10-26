# Tokenized Search

Fuzzy search an array of strings, prioritizing matches happening at token boundaries.

Note: this library is designed for searching code tokens (i.e. symbols and identifiers in PascalCase, camelCase, kebab-case, snake_case, etc.)

This replicates the functionality implemented by common IDEs and some other solutions
(i.e. GitHub) for searching files and symbols, with adding bias towards matching
the beginning of the words (called tokens), falling back to regular wildcard matching
which yields lower score.

The results are scored based on their relevance to the search query. Token-based matches are given higher priority.
