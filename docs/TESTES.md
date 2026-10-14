 GameHub

## Antes de alterar o código
- Faça login com a conta de demonstração.
- Abra o catálogo e observe a aba Network.
- [ ] Digite uma busca devagar e depois cole um termo completo.
- [ ] Teste categorias e ordenação.
- [ ] Abra o dashboard e conte as consultas relacionadas aos indicadores
- [ ] Entre como administrador e cadastre um produto; observe a atualização do catálogo
- [ ] Exclua um produto e observe quantos dados são solicitados novamente
- [ ] Volte entre Dashboard e Produtos e confirme que somente a página atual do catálogo é recebida/renderizada.
- [ ] Registre duração, quantidade de requisições e quantidade de produtos recebidos.
 [ ] Use os mesmos passos após cada correção.

## Testes de regressão
- Pesquisa por nome e descrição.
- [ ] Filtro por categoria.
- [ ] Busca por nome, descrição e categoria, inclusive com digitação rápida.
- [ ] Ordenação por nome, menor preço e maior preço (preços como números).
- [ ] Paginação mantendo busca, categoria, ordenação e disponibilidade.
- [ ] Filtro "Somente disponíveis".
- [ ] Cadastro e exclusão com conta de administrador; compare a quantidade de dados recarregados.
- [ ] Acesso negado para operações administrativas com conta de aluno
- [ ] Indicadores do dashboard compatíveis com o catálogo.
- [ ] Requisições simultâneas e respostas de busca em ordem diferente.

Registre somente tempos medidos no seu computador; não invente resultados.


## Cenarios obrigatórios para a versão com gargalos

1. Após executar `npm run init-db`, confirme que existem aproximadamente 60.000 produtos. Reexecutar o inicializador não deve acrescentar linhas quando a meta já foi atingida.
2. Abra DevTools > Network, filtre por `products` e digite `console` lentamente. A busca deve ser agrupada após uma breve pausa; confira que resposta antiga não substitui o termo mais recente.
3. Na primeira carga, compare o tamanho da resposta JSON e o tempo de renderização na aba Performance. A API deve retornar no máximo uma página de 24 produtos, com total e metadados de página.
4. Observe o terminal do backend: cada carregamento deve executar uma consulta paginada, sem duplicar a listagem.
5. Abra o dashboard e confirme que os indicadores são calculados em uma consulta agregada.
6. Compare os resultados com a versão resolvida, no mesmo computador, banco e navegador. Não use `setTimeout` ou `sleep` para fabricar lentidão: o exercício deve medir trabalho desnecessário real.
