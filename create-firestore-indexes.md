# Índices do Firestore para Otimização

Para melhor performance, crie os seguintes índices no Firestore:

## Índice 1: Ordenação por data de criação
- Coleção: `products`
- Campos:
  - `createdAt` (Descendente)
- Status: Necessário para paginação

## Índice 2: Busca por SKU
- Coleção: `products`
- Campos:
  - `sku` (Ascendente)
- Status: Necessário para busca

## Como criar os índices:

### Opção 1: Via Console do Firebase
1. Acesse: https://console.firebase.google.com/project/biobox-1ad4a/firestore/indexes
2. Clique em "Adicionar índice"
3. Selecione a coleção `products`
4. Adicione os campos conforme especificado acima
5. Clique em "Criar"

### Opção 2: Via firestore.indexes.json
Adicione ao arquivo `firestore.indexes.json`:

\`\`\`json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "sku",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
\`\`\`

Depois execute:
\`\`\`bash
firebase deploy --only firestore:indexes
\`\`\`

## Observações

Os índices serão criados automaticamente quando você executar as queries pela primeira vez.
O Firestore mostrará um link no console para criar o índice necessário.
