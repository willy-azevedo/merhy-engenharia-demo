# Conclusão e exclusão de comentários

## Implementado no código local

O painel oferece Marcar como concluído, Reabrir e filtros Todos, Pendentes e
Concluídos. Reutiliza a função `merhy_review_resolve` que já era chamada na
versão original do projeto (commit `cd55255`):

- Entrada: `p_token`, `p_id`, `p_resolved`.
- Saída: comentário atualizado, com `id` e `status` (`open` ou `resolved`).
- A interface só anuncia sucesso depois da resposta do servidor.
- A conclusão é compartilhada com quem acessa o mesmo link de revisão.

Nenhum comentário real foi concluído, reaberto ou excluído durante esta alteração.

## Pendente: excluir somente comentários do próprio autor

O sistema atual recebe um nome editável e usa um link de revisão compartilhado.
Não há identidade autenticada nem comprovante individual de autoria no cliente.
Comparar nomes não é autorização para excluir um comentário.

O administrador deve executar `inspect-review-schema.sql` no SQL Editor do
Supabase e fornecer as definições retornadas, após remover eventuais segredos.
Esse script é somente leitura e não retorna o conteúdo dos comentários.
Isso permitirá preparar uma migração compatível com as tabelas e permissões reais.

Requisitos para a implementação da exclusão:

1. Associar novos comentários a uma identidade autenticada ou a um comprovante
   individual de autoria. Se for usado um segredo de navegador, guardar apenas
   seu hash no servidor e não expor esse hash ou segredo na listagem pública.
2. Conferir no servidor tanto o acesso à revisão quanto a autoria do comentário.
   Alterar o nome exibido nunca pode transferir a autoria.
3. A listagem deve indicar ao cliente quais comentários ele pode excluir.
4. Implementar a exclusão com confirmação na interface e tratamento explícito
   de respostas de outros autores. Não remover respostas de terceiros por cascata.
5. Não permitir assumir comentários antigos apenas pelo nome. Definir com o
   responsável como associar comentários anteriores à identidade correta.
6. Preservar as funções de leitura, criação e conclusão já utilizadas no site.

A exclusão ainda não foi ativada nem publicada. Não habilitar um botão que
apenas esconda comentários no navegador ou invoque uma função inexistente.
