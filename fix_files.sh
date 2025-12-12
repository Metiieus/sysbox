#!/bin/bash
for file in client/hooks/useAuth.tsx client/pages/Production.tsx client/pages/ProductionCalendar.tsx; do
  if [ -f "$file" ]; then
    echo "Corrigindo: $file"
    # Remove linhas que começam com "Text file:" ou "Latest content"
    sed -i '/^Text file:/d; /^Latest content with line numbers:/d; s/^[0-9]*\t//' "$file"
  fi
done
echo "Arquivos corrigidos!"
