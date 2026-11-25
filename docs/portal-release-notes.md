# Histórico de atualizações do Portal

O Portal carrega as novidades a partir de `release-notes.json`. A primeira entrada do array `releases` é a atualização vigente; as entradas seguintes permanecem disponíveis em **Informações > Novidades da versão**.

## Como publicar uma nova atualização

Em cada PR que altere a experiência do voluntário, inclua uma nova entrada no início de `releases`:

- `id`: identificador único e estável da atualização (não reutilizar).
- `version`: número/identificação que aparecerá no card.
- `eyebrow`, `title`, `summary`: chamada, título e resumo.
- `homeSlides`: textos curtos exibidos no carrossel da página inicial.
- `items`: lista objetiva do que mudou, com `icon`, `title` e `text`.
- `ctaLabel` e `ctaPage`: ação principal do card.

Não substitua entradas antigas: elas compõem o histórico. O deploy de Pages copia esse arquivo para o artefato publicado. O aviso é considerado visto por usuário e por identificador da atualização; quando o `id` muda, o novo aviso volta a aparecer.

Atualizações exclusivamente internas/administrativas não devem ser anunciadas aos voluntários, a menos que alterem algo que eles possam perceber ou usar.
